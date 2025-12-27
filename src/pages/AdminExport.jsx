import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Database, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminExport() {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState({});

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const exportEntity = async (entityName, sortBy = '', limit = 5000) => {
    try {
      setExportStatus(prev => ({ ...prev, [entityName]: 'loading' }));
      const data = await base44.entities[entityName].list(sortBy, limit);
      setExportStatus(prev => ({ ...prev, [entityName]: 'success' }));
      return { [entityName]: data };
    } catch (error) {
      setExportStatus(prev => ({ ...prev, [entityName]: 'error' }));
      console.error(`Error exporting ${entityName}:`, error);
      return { [entityName]: [] };
    }
  };

  const exportAllData = async () => {
    setExporting(true);
    setExportStatus({});

    try {
      // Export toutes les entités principales
      const [
        products,
        rites,
        obediences,
        degreeOrders,
        categories,
        orders,
        users,
        cartItems,
        quotes,
        reviews,
        wishlist,
        savedCustomizations,
        businessOpportunities,
        leads,
        productionItems,
        loyaltyPoints,
        settings
      ] = await Promise.all([
        exportEntity('Product', '-created_date'),
        exportEntity('Rite', 'order'),
        exportEntity('Obedience', 'order'),
        exportEntity('DegreeOrder', 'level'),
        exportEntity('Category', 'order'),
        exportEntity('Order', '-created_date'),
        exportEntity('User', '-created_date'),
        exportEntity('CartItem', '-created_date'),
        exportEntity('Quote', '-created_date'),
        exportEntity('ProductReview', '-created_date'),
        exportEntity('WishlistItem', '-created_date'),
        exportEntity('SavedCustomization', '-created_date'),
        exportEntity('BusinessOpportunity', '-created_date'),
        exportEntity('LeadRequest', '-created_date'),
        exportEntity('ProductionItem', '-created_date'),
        exportEntity('LoyaltyPoints', '-created_date'),
        exportEntity('AppSettings', 'setting_key')
      ]);

      // Combiner toutes les données
      const fullExport = {
        export_date: new Date().toISOString(),
        app_name: 'Atelier Art Royal',
        version: '1.0',
        data: {
          ...products,
          ...rites,
          ...obediences,
          ...degreeOrders,
          ...categories,
          ...orders,
          ...users,
          ...cartItems,
          ...quotes,
          ...reviews,
          ...wishlist,
          ...savedCustomizations,
          ...businessOpportunities,
          ...leads,
          ...productionItems,
          ...loyaltyPoints,
          ...settings
        },
        stats: {
          products: products.Product?.length || 0,
          rites: rites.Rite?.length || 0,
          obediences: obediences.Obedience?.length || 0,
          degreeOrders: degreeOrders.DegreeOrder?.length || 0,
          categories: categories.Category?.length || 0,
          orders: orders.Order?.length || 0,
          users: users.User?.length || 0,
          quotes: quotes.Quote?.length || 0,
          reviews: reviews.ProductReview?.length || 0
        }
      };

      // Télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atelier-art-royal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Export réussi !', {
        description: `${fullExport.stats.products} produits, ${fullExport.stats.orders} commandes exportés`,
        duration: 5000
      });
    } catch (error) {
      toast.error('Erreur lors de l\'export', {
        description: error.message,
        duration: 5000
      });
    } finally {
      setExporting(false);
    }
  };

  const exportProducts = async () => {
    setExporting(true);
    try {
      const products = await base44.entities.Product.list('-created_date', 5000);
      
      // Enrichir avec les relations
      const rites = await base44.entities.Rite.list('', 100);
      const obediences = await base44.entities.Obedience.list('', 100);
      const degrees = await base44.entities.DegreeOrder.list('', 200);
      const categories = await base44.entities.Category.list('', 100);

      const enrichedProducts = products.map(product => ({
        ...product,
        rites: product.rite_ids?.map(id => rites.find(r => r.id === id)?.name).filter(Boolean) || [],
        obediences: product.obedience_ids?.map(id => obediences.find(o => o.id === id)?.name).filter(Boolean) || [],
        degrees: product.degree_order_ids?.map(id => degrees.find(d => d.id === id)?.name).filter(Boolean) || [],
        categories: product.category_ids?.map(id => categories.find(c => c.id === id)?.name).filter(Boolean) || []
      }));

      const exportData = {
        export_date: new Date().toISOString(),
        total_products: enrichedProducts.length,
        products: enrichedProducts,
        metadata: { rites, obediences, degrees, categories }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${enrichedProducts.length} produits exportés`);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportOrders = async () => {
    setExporting(true);
    try {
      const orders = await base44.entities.Order.list('-created_date', 5000);
      const users = await base44.entities.User.list('', 1000);

      const enrichedOrders = orders.map(order => ({
        ...order,
        customer: users.find(u => u.id === order.customer_id)
      }));

      const exportData = {
        export_date: new Date().toISOString(),
        total_orders: enrichedOrders.length,
        orders: enrichedOrders
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${enrichedOrders.length} commandes exportées`);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
        <p className="text-muted-foreground">Cette page est réservée aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Export de Données</h1>
        <p className="text-muted-foreground">Exportez vos données pour sauvegarde ou migration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Export complet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Export Complet
            </CardTitle>
            <CardDescription>
              Toutes les données de l'application (produits, commandes, clients, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportAllData} 
              disabled={exporting}
              className="w-full"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Tout
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export produits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Produits
            </CardTitle>
            <CardDescription>
              Catalogue complet avec relations (rites, obédiences, degrés)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportProducts} 
              disabled={exporting}
              className="w-full"
              variant="outline"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Produits
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export commandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Commandes
            </CardTitle>
            <CardDescription>
              Historique complet des commandes avec informations clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportOrders} 
              disabled={exporting}
              className="w-full"
              variant="outline"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Commandes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status des exports */}
      {Object.keys(exportStatus).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statut de l'export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(exportStatus).map(([entity, status]) => (
                <div key={entity} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="font-medium">{entity}</span>
                  {status === 'loading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  {status === 'error' && (
                    <span className="text-xs text-destructive">Erreur</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📋 Instructions d'utilisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Format d'export</h4>
            <p className="text-muted-foreground">
              Les données sont exportées au format JSON, prêtes pour import dans une autre base de données ou analyse.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Fréquence recommandée</h4>
            <p className="text-muted-foreground">
              Effectuez un backup complet au moins 1 fois par semaine et avant toute migration majeure.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Conservation</h4>
            <p className="text-muted-foreground">
              Conservez les fichiers d'export dans un espace sécurisé (Google Drive, Dropbox, etc.) avec versioning.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-amber-900">⚠️ Important</h4>
            <p className="text-amber-800 text-xs">
              Les fichiers d'export contiennent des données sensibles (emails clients, commandes). 
              Ne les partagez jamais publiquement et protégez-les par mot de passe si nécessaire.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}