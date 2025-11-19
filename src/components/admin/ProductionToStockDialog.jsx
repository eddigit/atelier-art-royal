import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Package, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ProductionToStockDialog({ production, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: production?.product_name || '',
    price: '',
    stock_quantity: 1,
    description: production?.specifications || '',
    images: production?.design_images || [],
    is_active: true
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      // Create product
      const product = await base44.entities.Product.create(data);
      
      // Update production status to 'livree'
      await base44.entities.ProductionItem.update(production.id, {
        status: 'livree'
      });
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['productions']);
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Produit mis en stock');
      onClose();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      toast.error('Nom et prix requis');
      return;
    }

    createProductMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity) || 1
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Mettre en Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nom du Produit *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prix de Vente (€) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <Label>Quantité Initiale</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Description du produit..."
            />
          </div>

          {formData.images?.length > 0 && (
            <div>
              <Label>Images ({formData.images.length})</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {formData.images.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url} 
                    alt={`Image ${idx + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
            <p className="text-sm">
              Ce produit sera créé dans le catalogue et la production sera marquée comme livrée.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createProductMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Mettre en Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}