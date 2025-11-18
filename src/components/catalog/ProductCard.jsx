import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import QuickViewModal from './QuickViewModal';

export default function ProductCard({ product }) {
  const [showQuickView, setShowQuickView] = useState(false);
  const queryClient = useQueryClient();
  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=2105';
  
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

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
          quantity: existingItems[0].quantity + 1
        });
      } else {
        await base44.entities.CartItem.create({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          price: product.price
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Produit ajouté au panier');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout au panier');
    }
  });

  return (
    <>
      <Card className="group overflow-hidden h-full hover:shadow-2xl transition-all duration-300">
        <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
          <div className="relative aspect-square overflow-hidden image-immersive bg-muted">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Quick View Button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.preventDefault();
                setShowQuickView(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Vue rapide
            </Button>

            {hasDiscount && (
              <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                -{discountPercent}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Coup de Cœur
              </Badge>
            )}
            {product.stock_quantity <= 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="secondary">Rupture de stock</Badge>
              </div>
            )}
          </div>
        </Link>

      <CardContent className="p-4">
        <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {product.short_description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                {product.compare_at_price.toFixed(2)}€
              </span>
            )}
            <span className="text-xl font-bold text-primary">
              {product.price.toFixed(2)}€
            </span>
          </div>
          
          <Button
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90"
            onClick={(e) => {
              e.preventDefault();
              addToCartMutation.mutate();
            }}
            disabled={product.stock_quantity <= 0 || addToCartMutation.isPending}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>

        {product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold && (
          <p className="text-xs text-destructive mt-2">
            Plus que {product.stock_quantity} en stock
          </p>
        )}
      </CardContent>
    </Card>

    <QuickViewModal 
      product={product}
      open={showQuickView}
      onClose={() => setShowQuickView(false)}
    />
    </>
  );
}