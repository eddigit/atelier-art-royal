import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Trash2, 
  Package, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CsvFieldMapper from '@/components/admin/CsvFieldMapper';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [importProgress, setImportProgress] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 500),
    initialData: []
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const allProducts = await base44.entities.Product.list('-created_date', 1000);
      await Promise.all(allProducts.map(p => base44.entities.Product.delete(p.id)));
      return allProducts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(`${count} produits supprimés`);
      setShowDeleteDialog(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvHeaders(null);
    setImportResults(null);
    setFieldMapping({});

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFileUrl(file_url);

      // Read CSV headers
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const firstLine = text.split('\n')[0];
        const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setCsvHeaders(headers);
      };
      reader.readAsText(file);

      toast.success('Fichier chargé, configurez le mappage ci-dessous');
    } catch (error) {
      toast.error('Erreur lors du chargement: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!uploadedFileUrl || !fieldMapping) return;

    setIsImporting(true);
    setImportResults(null);
    setImportProgress({ current: 0, total: 0, imported: 0, updated: 0, skipped: 0 });

    try {
      // Call the streaming function
      const response = await fetch(`https://base44.app/api/apps/${base44._appId}/functions/importProductsWithProgress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${base44._token}`
        },
        body: JSON.stringify({
          file_url: uploadedFileUrl,
          field_mapping: fieldMapping
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'import');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              setImportProgress({
                current: data.current,
                total: data.total,
                imported: data.imported,
                updated: data.updated,
                skipped: data.skipped,
                productName: data.productName
              });
            } else if (data.type === 'complete') {
              setImportResults(data.results);
              queryClient.invalidateQueries(['admin-products']);
              
              if (data.results.success) {
                toast.success(`Import terminé: ${data.results.imported + data.results.updated} produits traités`);
              } else {
                toast.error('Import terminé avec des erreurs');
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error('Erreur lors de l\'import: ' + error.message);
      setImportResults({ success: false, error: error.message });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion des Produits</h1>
          <p className="text-muted-foreground">
            {products.length} produit{products.length > 1 ? 's' : ''} dans le catalogue
          </p>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Étape 1 : Charger le fichier CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="max-w-md"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Format attendu :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Export CSV WooCommerce standard</li>
                <li>Encodage UTF-8 recommandé</li>
                <li>Les doublons (même UGS) seront mis à jour</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {csvHeaders && (
          <>
            <CsvFieldMapper 
              csvHeaders={csvHeaders}
              mapping={fieldMapping}
              onMappingChange={setFieldMapping}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Étape 3 : Lancer l'import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !uploadedFileUrl}
                  size="lg"
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Importer et télécharger les images
                    </>
                  )}
                </Button>

                {importProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {importProgress.current} / {importProgress.total} produits traités
                      </span>
                      <span className="font-semibold text-primary">
                        {Math.round((importProgress.current / importProgress.total) * 100)}%
                      </span>
                    </div>
                    <Progress value={(importProgress.current / importProgress.total) * 100} />
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>✅ Importés: {importProgress.imported}</p>
                      <p>🔄 Mis à jour: {importProgress.updated}</p>
                      <p>⏭️ Ignorés: {importProgress.skipped}</p>
                      {importProgress.productName && (
                        <p className="text-primary font-medium">En cours: {importProgress.productName}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {importResults && (
          <Card>
            <CardContent className="pt-6">
              <div className={`p-4 rounded-lg border ${
                importResults.success 
                  ? 'bg-green-600/10 border-green-600/30' 
                  : 'bg-red-600/10 border-red-600/30'
              }`}>
                <div className="flex items-start gap-3">
                  {importResults.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">
                      {importResults.success ? 'Import réussi' : 'Erreurs détectées'}
                    </h4>
                    <div className="text-sm space-y-1">
                      {importResults.imported && (
                        <p>✅ {importResults.imported} produits importés</p>
                      )}
                      {importResults.updated && (
                        <p>🔄 {importResults.updated} produits mis à jour</p>
                      )}
                      {importResults.skipped && (
                        <p>⏭️ {importResults.skipped} produits ignorés</p>
                      )}
                      {importResults.errors && importResults.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium text-red-400">
                            ❌ {importResults.errors.length} erreur(s)
                          </summary>
                          <ul className="mt-2 ml-4 space-y-1">
                            {importResults.errors.slice(0, 10).map((err, i) => (
                              <li key={i} className="text-xs">{err}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produits existants</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={products.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Tout supprimer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun produit. Importez un fichier CSV pour commencer.
            </p>
          ) : (
            <div className="space-y-2">
              {products.slice(0, 50).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        <span>•</span>
                        <span className="font-semibold text-primary">
                          {product.price?.toFixed(2)}€
                        </span>
                        {product.stock_quantity !== undefined && (
                          <>
                            <span>•</span>
                            <span>Stock: {product.stock_quantity}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!product.is_active && (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                    <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {products.length > 50 && (
                <p className="text-center text-sm text-muted-foreground pt-4">
                  ... et {products.length - 50} autres produits
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement <strong>tous les {products.length} produits</strong> de la base de données.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteAllMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer tout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}