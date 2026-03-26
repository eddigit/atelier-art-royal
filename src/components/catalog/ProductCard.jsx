import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Eye, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import QuickViewModal from './QuickViewModal';

export default function ProductCard({ product }) {
  const [showQuickView, setShowQuickView] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me().catch(() => null),
    initialData: null
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.WishlistItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const isInWishlist = wishlistItems.some(item => item.product_id === product.id);

  // Use product-level rating data if available (avoids N+1 queries)
  const averageRating = product.average_rating || 0;
  const reviewCount = product.review_count || 0;
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
      toast.success('✅ Produit ajouté au panier !', {
        action: {
          label: 'Voir le panier',
          onClick: () => {
            const event = new CustomEvent('openCartSidebar');
            window.dispatchEvent(event);
          }
        }
      });
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout au panier');
    }
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      if (isInWishlist) {
        const item = wishlistItems.find(w => w.product_id === product.id);
        if (item) {
          await base44.entities.WishlistItem.delete(item.id);
        }
      } else {
        await base44.entities.WishlistItem.create({
          user_id: user.id,
          product_id: product.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(isInWishlist ? 'Retiré de la liste de souhaits' : 'Ajouté à la liste de souhaits');
    }
  });

  return (
    <>
      <Card className="group overflow-hidden h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
          <div className="relative aspect-square overflow-hidden image-immersive bg-muted">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Quick View Button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 z-10"
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
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.featured && (
                <Badge className="bg-primary/90 text-primary-foreground">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Coup de Cœur
                </Badge>
              )}
            </div>

            <Button
              size="icon"
              variant="secondary"
              className="absolute top-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              onClick={(e) => {
                e.preventDefault();
                toggleWishlistMutation.mutate();
              }}
              disabled={toggleWishlistMutation.isPending}
            >
              <Heart className={`w-4 h-4 transition-all ${isInWishlist ? 'fill-current text-red-500 scale-110' : ''}`} />
            </Button>
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
        
        {averageRating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-semibold">{Number(averageRating).toFixed(1)}</span>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}

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