import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Trash2, 
  Package, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Eye,
  Edit,
  Download,
  Grid,
  List,
  Search
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
import ProductStatsCards from '@/components/admin/ProductStatsCards';
import ProductEditDialog from '@/components/admin/ProductEditDialog';
import ProductListView from '@/components/admin/ProductListView';
import ProductGridView from '@/components/admin/ProductGridView';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');


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

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Produit supprimé');
    }
  });

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

    try {
      toast.info('Import en cours, cela peut prendre quelques minutes...');
      
      const { data } = await base44.functions.invoke('importProducts', {
        file_url: uploadedFileUrl,
        field_mapping: fieldMapping
      });

      setImportResults(data);
      queryClient.invalidateQueries(['admin-products']);
      
      if (data.success) {
        toast.success(`Import terminé: ${data.imported + data.updated} produits traités`);
      } else {
        toast.error('Import terminé avec des erreurs');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'import: ' + error.message);
      setImportResults({ success: false, error: error.message });
    } finally {
      setIsImporting(false);
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

      <ProductStatsCards products={products} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">{/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit. Importez un fichier CSV pour commencer.'}
            </p>
          ) : viewMode === 'list' ? (
            <ProductListView 
              products={filteredProducts}
              onEdit={setEditingProduct}
              onDelete={(id) => deleteProductMutation.mutate(id)}
            />
          ) : (
            <ProductGridView 
              products={filteredProducts}
              onEdit={setEditingProduct}
              onDelete={(id) => deleteProductMutation.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="import">

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

                {isImporting && (
                  <p className="text-sm text-muted-foreground text-center">
                    Traitement des produits et téléchargement des images en cours...
                  </p>
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
                        <details className="mt-2" open>
                          <summary className="cursor-pointer font-medium text-red-400 mb-2">
                            ❌ {importResults.errors.length} erreur(s) détectée(s)
                          </summary>
                          <div className="mt-2 ml-4 space-y-1 max-h-64 overflow-y-auto bg-red-950/30 p-3 rounded border border-red-600/30">
                            {importResults.errors.map((err, i) => (
                              <div key={i} className="text-xs font-mono border-b border-red-600/20 pb-1">
                                {err}
                              </div>
                            ))}
                          </div>
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

        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingProduct && (
        <ProductEditDialog
          product={editingProduct}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => queryClient.invalidateQueries(['admin-products'])}
        />
      )}

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