import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Edit,
  Search,
  History,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [movementData, setMovementData] = useState({
    movement_type: 'adjustment',
    quantity: 0,
    reason: '',
    reference: '',
    supplier: '',
    cost_per_unit: 0,
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
    initialData: []
  });

  const { data: stockMovements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => base44.entities.StockMovement.list('-created_date', 500),
    initialData: []
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newStock, movementData }) => {
      const product = products.find(p => p.id === productId);
      const previousStock = product.stock_quantity || 0;
      const quantity = newStock - previousStock;

      await base44.entities.StockMovement.create({
        product_id: productId,
        movement_type: movementData.movement_type,
        quantity: quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: movementData.reason,
        reference: movementData.reference,
        supplier: movementData.supplier,
        cost_per_unit: movementData.cost_per_unit,
        notes: movementData.notes
      });

      await base44.entities.Product.update(productId, {
        stock_quantity: newStock,
        last_restock_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Stock mis à jour avec succès');
      setMovementDialogOpen(false);
      setSelectedProduct(null);
      setMovementData({
        movement_type: 'adjustment',
        quantity: 0,
        reason: '',
        reference: '',
        supplier: '',
        cost_per_unit: 0,
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du stock');
      console.error(error);
    }
  });

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 5)
  ).length;

  const outOfStockProducts = products.filter(p => 
    p.stock_quantity === 0
  ).length;

  const totalInventoryValue = products.reduce((sum, p) => 
    sum + ((p.stock_quantity || 0) * (p.price || 0)), 0
  );

  const handleOpenMovementDialog = (product) => {
    setSelectedProduct(product);
    setMovementData({
      movement_type: 'adjustment',
      quantity: 0,
      reason: '',
      reference: '',
      supplier: '',
      cost_per_unit: product.price || 0,
      notes: ''
    });
    setMovementDialogOpen(true);
  };

  const handleStockAdjustment = () => {
    if (!selectedProduct) return;

    const currentStock = selectedProduct.stock_quantity || 0;
    let newStock = currentStock;

    if (movementData.movement_type === 'adjustment') {
      newStock = parseInt(movementData.quantity) || 0;
    } else if (movementData.movement_type === 'entry') {
      newStock = currentStock + (parseInt(movementData.quantity) || 0);
    } else if (movementData.movement_type === 'exit') {
      newStock = currentStock - (parseInt(movementData.quantity) || 0);
    }

    if (newStock < 0) {
      toast.error('Le stock ne peut pas être négatif');
      return;
    }

    updateStockMutation.mutate({
      productId: selectedProduct.id,
      newStock: newStock,
      movementData: {
        ...movementData,
        quantity: movementData.movement_type === 'adjustment' 
          ? (newStock - currentStock) 
          : movementData.movement_type === 'exit'
            ? -(parseInt(movementData.quantity) || 0)
            : (parseInt(movementData.quantity) || 0)
      }
    });
  };

  const getStockStatusBadge = (product) => {
    const stock = product.stock_quantity || 0;
    const threshold = product.low_stock_threshold || 5;

    if (stock === 0) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Rupture</Badge>;
    }
    if (stock <= threshold) {
      return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700"><AlertTriangle className="w-3 h-3" /> Stock bas</Badge>;
    }
    return <Badge variant="outline" className="gap-1 border-green-500 text-green-700">En stock</Badge>;
  };

  const productMovements = selectedProduct 
    ? stockMovements.filter(m => m.product_id === selectedProduct.id)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestion des Stocks</h2>
        <p className="text-muted-foreground">Inventaire et mouvements de marchandises</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits en stock</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock bas</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rupture de stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur totale</p>
                <p className="text-2xl font-bold">{totalInventoryValue.toFixed(0)}€</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit par nom ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Stock actuel</TableHead>
                  <TableHead className="text-center">Seuil alerte</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead>Dernier réappro.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold">{product.stock_quantity || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.low_stock_threshold || 5}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStockStatusBadge(product)}
                      </TableCell>
                      <TableCell>
                        {product.last_restock_date 
                          ? new Date(product.last_restock_date).toLocaleDateString('fr-FR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMovementDialog(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Ajuster
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setHistoryDialogOpen(true);
                            }}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mouvement de Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Stock actuel</p>
              <p className="text-2xl font-bold">{selectedProduct?.stock_quantity || 0} unités</p>
            </div>

            <div>
              <Label>Type de mouvement</Label>
              <Select 
                value={movementData.movement_type} 
                onValueChange={(value) => setMovementData({...movementData, movement_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrée (Réapprovisionnement)</SelectItem>
                  <SelectItem value="exit">Sortie (Vente/Perte)</SelectItem>
                  <SelectItem value="adjustment">Ajustement (Inventaire)</SelectItem>
                  <SelectItem value="return">Retour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {movementData.movement_type === 'adjustment' ? 'Nouveau stock' : 'Quantité'}
              </Label>
              <Input
                type="number"
                value={movementData.quantity}
                onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                placeholder={movementData.movement_type === 'adjustment' ? 'Stock corrigé' : 'Nombre d\'unités'}
              />
            </div>

            <div>
              <Label>Raison *</Label>
              <Input
                value={movementData.reason}
                onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                placeholder="Ex: Inventaire annuel, Réception fournisseur, Vente..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Référence</Label>
                <Input
                  value={movementData.reference}
                  onChange={(e) => setMovementData({...movementData, reference: e.target.value})}
                  placeholder="N° bon de livraison..."
                />
              </div>
              {movementData.movement_type === 'entry' && (
                <div>
                  <Label>Fournisseur</Label>
                  <Input
                    value={movementData.supplier}
                    onChange={(e) => setMovementData({...movementData, supplier: e.target.value})}
                    placeholder="Nom du fournisseur"
                  />
                </div>
              )}
            </div>

            {movementData.movement_type === 'entry' && (
              <div>
                <Label>Coût unitaire</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={movementData.cost_per_unit}
                  onChange={(e) => setMovementData({...movementData, cost_per_unit: e.target.value})}
                  placeholder="Prix d'achat"
                />
              </div>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea
                value={movementData.notes}
                onChange={(e) => setMovementData({...movementData, notes: e.target.value})}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleStockAdjustment}
              disabled={updateStockMutation.isPending || !movementData.reason}
            >
              {updateStockMutation.isPending ? 'Enregistrement...' : 'Valider le mouvement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique des mouvements - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {productMovements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun mouvement enregistré</p>
            ) : (
              <div className="space-y-3">
                {productMovements.map((movement) => (
                  <Card key={movement.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {movement.movement_type === 'entry' && <TrendingUp className="w-4 h-4 text-green-600" />}
                            {movement.movement_type === 'exit' && <TrendingDown className="w-4 h-4 text-red-600" />}
                            {movement.movement_type === 'adjustment' && <Edit className="w-4 h-4 text-blue-600" />}
                            <span className="font-semibold">
                              {movement.movement_type === 'entry' && 'Entrée'}
                              {movement.movement_type === 'exit' && 'Sortie'}
                              {movement.movement_type === 'adjustment' && 'Ajustement'}
                              {movement.movement_type === 'return' && 'Retour'}
                            </span>
                            <Badge variant={movement.quantity > 0 ? 'default' : 'destructive'}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </Badge>
                          </div>
                          <p className="text-sm">{movement.reason}</p>
                          {movement.reference && (
                            <p className="text-xs text-muted-foreground">Réf: {movement.reference}</p>
                          )}
                          {movement.supplier && (
                            <p className="text-xs text-muted-foreground">Fournisseur: {movement.supplier}</p>
                          )}
                          {movement.notes && (
                            <p className="text-xs text-muted-foreground italic">{movement.notes}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{new Date(movement.created_date).toLocaleDateString('fr-FR')}</p>
                          <p className="text-xs">Par: {movement.created_by}</p>
                          <p className="text-xs mt-2">
                            {movement.previous_stock} → {movement.new_stock}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}