import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Package, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function QuickViewModal({ product, open, onClose }) {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: rite } = useQuery({
    queryKey: ['rite', product?.rite_id],
    queryFn: async () => {
      if (!product?.rite_id) return null;
      const results = await base44.entities.Rite.filter({ id: product.rite_id });
      return results[0];
    },
    enabled: !!product?.rite_id
  });

  const { data: grade } = useQuery({
    queryKey: ['grade', product?.grade_id],
    queryFn: async () => {
      if (!product?.grade_id) return null;
      const results = await base44.entities.Grade.filter({ id: product.grade_id });
      return results[0];
    },
    enabled: !!product?.grade_id
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      const existingItems = await base44.entities.CartItem.filter({
        user_id: user.id,
        product_id: product.id
      });

      if (existingItems.length > 0) {
        await base44.entities.CartItem.update(existingItems[0].id, {
          quantity: existingItems[0].quantity + quantity
        });
      } else {
        await base44.entities.CartItem.create({
          user_id: user.id,
          product_id: product.id,
          quantity: quantity,
          price: product.price
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Produit ajouté au panier');
      onClose();
    }
  });

  if (!product) return null;

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const images = product.images || [];
  const primaryImage = images[selectedImage] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Vue rapide du produit</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {hasDiscount && (
                <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                  -{discountPercent}%
                </Badge>
              )}
              {product.featured && (
                <Badge className="absolute top-3 left-3 bg-primary/90">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Coup de Cœur
                </Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
              {(rite || grade) && (
                <div className="flex gap-2 mb-3">
                  {rite && <Badge variant="outline">{rite.name}</Badge>}
                  {grade && <Badge variant="outline">{grade.name}</Badge>}
                </div>
              )}
            </div>

            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}

            {/* Attributes */}
            <div className="space-y-2 py-4 border-y">
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Tailles: </span>
                  <span className="text-sm text-muted-foreground">
                    {product.sizes.join(', ')}
                  </span>
                </div>
              )}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Couleurs: </span>
                  <span className="text-sm text-muted-foreground">
                    {product.colors.join(', ')}
                  </span>
                </div>
              )}
              {product.materials && product.materials.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Matières: </span>
                  <span className="text-sm text-muted-foreground">
                    {product.materials.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="py-4">
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through mr-3">
                  {product.compare_at_price.toFixed(2)}€
                </span>
              )}
              <span className="text-3xl font-bold text-primary">
                {product.price.toFixed(2)}€
              </span>
            </div>

            {/* Stock */}
            {product.stock_quantity > 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Package className="w-4 h-4" />
                {product.stock_quantity <= product.low_stock_threshold 
                  ? `Plus que ${product.stock_quantity} en stock`
                  : 'En stock'
                }
              </div>
            ) : (
              <Badge variant="secondary">Rupture de stock</Badge>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantité:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="px-4 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => addToCartMutation.mutate()}
                disabled={product.stock_quantity <= 0 || addToCartMutation.isPending}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier
              </Button>
              
              <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`} onClick={onClose}>
                <Button variant="outline" size="lg" className="w-full">
                  <Eye className="w-5 h-5 mr-2" />
                  Voir tous les détails
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}