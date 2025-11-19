import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function AdminStock() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkStock, setBulkStock] = useState('');
  const [bulkStockBehavior, setBulkStockBehavior] = useState('');
  const [bulkIsActive, setBulkIsActive] = useState('');
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 500),
    initialData: []
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, stockData }) => {
      await Promise.all(
        productIds.map(id => base44.entities.Product.update(id, stockData))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(`${selectedProducts.length} produits mis à jour`);
      setSelectedProducts([]);
      setShowBulkDialog(false);
      setBulkStock('');
      setBulkStockBehavior('');
      setBulkIsActive('');
    }
  });

  const handleQuickStockUpdate = (productId, newStock) => {
    updateProductMutation.mutate({
      id: productId,
      data: { stock_quantity: parseInt(newStock) || 0 }
    });
  };

  const handleBulkUpdate = () => {
    if (selectedProducts.length === 0) {
      toast.error('Aucun produit sélectionné');
      return;
    }

    const stockData = {};
    if (bulkStock !== '') {
      stockData.stock_quantity = parseInt(bulkStock) || 0;
    }
    if (bulkStockBehavior !== '') {
      stockData.allow_backorders = bulkStockBehavior === 'allow';
    }
    if (bulkIsActive !== '') {
      stockData.is_active = bulkIsActive === 'active';
    }

    bulkUpdateMutation.mutate({
      productIds: selectedProducts,
      stockData
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: products.length,
    inStock: products.filter(p => (p.stock_quantity || 0) > 0).length,
    lowStock: products.filter(p => {
      const qty = p.stock_quantity || 0;
      const threshold = p.low_stock_threshold || 5;
      return qty > 0 && qty <= threshold;
    }).length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length
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
          <h1 className="text-4xl font-bold mb-2">Gestion des Stocks</h1>
          <p className="text-muted-foreground">
            {products.length} produit{products.length > 1 ? 's' : ''} au catalogue
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={stockManagementEnabled ? "default" : "outline"}
            onClick={() => setStockManagementEnabled(!stockManagementEnabled)}
          >
            {stockManagementEnabled ? (
              <ToggleRight className="w-4 h-4 mr-2" />
            ) : (
              <ToggleLeft className="w-4 h-4 mr-2" />
            )}
            Gestion Stock {stockManagementEnabled ? 'ON' : 'OFF'}
          </Button>
          {selectedProducts.length > 0 && (
            <Button onClick={() => setShowBulkDialog(true)}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Mettre à jour ({selectedProducts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stockManagementEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-primary" />
              <Badge variant="outline">{stats.total}</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.total}</h3>
            <p className="text-sm text-muted-foreground">Total Produits</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <Badge variant="outline" className="bg-green-600/10">{stats.inStock}</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.inStock}</h3>
            <p className="text-sm text-muted-foreground">En Stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <Badge variant="outline" className="bg-yellow-600/10">{stats.lowStock}</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.lowStock}</h3>
            <p className="text-sm text-muted-foreground">Stock Faible</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <Badge variant="outline" className="bg-red-600/10">{stats.outOfStock}</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.outOfStock}</h3>
            <p className="text-sm text-muted-foreground">Rupture</p>
          </CardContent>
        </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-md w-full">
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
            <Button
              variant="outline"
              onClick={toggleSelectAll}
            >
              {selectedProducts.length === filteredProducts.length ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Tout désélectionner
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tout sélectionner
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun produit trouvé</p>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => {
                const stock = product.stock_quantity || 0;
                const threshold = product.low_stock_threshold || 5;
                const isLowStock = stock > 0 && stock <= threshold;
                const isOutOfStock = stock === 0;

                return (
                  <div 
                    key={product.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      selectedProducts.includes(product.id) ? 'bg-primary/5 border-primary' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelectProduct(product.id)}
                    />
                    
                    <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        {stockManagementEnabled && isOutOfStock && (
                          <Badge variant="outline" className="bg-red-600/20 text-red-400 border-red-600/30">
                            Rupture
                          </Badge>
                        )}
                        {stockManagementEnabled && isLowStock && (
                          <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                            Stock Faible
                          </Badge>
                        )}
                        {!product.is_active && (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span>SKU: {product.sku || '-'}</span>
                        <span>•</span>
                        <span>Prix: {product.price}€</span>
                        {stockManagementEnabled && !product.allow_backorders && stock === 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-400">Vente bloquée</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <Label className="text-xs">Stock</Label>
                        <Input
                          type="number"
                          value={stock}
                          onChange={(e) => handleQuickStockUpdate(product.id, e.target.value)}
                          className="mt-1"
                          min="0"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Si rupture</Label>
                        <Select
                          value={product.allow_backorders ? 'allow' : 'block'}
                          onValueChange={(v) => updateProductMutation.mutate({
                            id: product.id,
                            data: { allow_backorders: v === 'allow' }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="allow">Autoriser</SelectItem>
                            <SelectItem value="block">Bloquer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mise à jour en masse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}
            </p>
            <div>
              <Label>Quantité en Stock</Label>
              <Input
                type="number"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                placeholder="Laisser vide pour ne pas modifier"
                min="0"
              />
            </div>
            <div>
              <Label>Comportement si Rupture</Label>
              <Select value={bulkStockBehavior} onValueChange={setBulkStockBehavior}>
                <SelectTrigger>
                  <SelectValue placeholder="Laisser inchangé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Laisser inchangé</SelectItem>
                  <SelectItem value="allow">Autoriser la vente</SelectItem>
                  <SelectItem value="block">Bloquer la vente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Affichage sur le site</Label>
              <Select value={bulkIsActive} onValueChange={setBulkIsActive}>
                <SelectTrigger>
                  <SelectValue placeholder="Laisser inchangé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Laisser inchangé</SelectItem>
                  <SelectItem value="active">Autoriser (Actif)</SelectItem>
                  <SelectItem value="inactive">Masquer (Inactif)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkUpdate} disabled={bulkUpdateMutation.isPending}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}