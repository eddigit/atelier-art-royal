import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/catalog/ProductCard';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Wishlist() {
  const queryClient = useQueryClient();

  // SEO Meta Tags
  React.useEffect(() => {
    document.title = 'Ma Liste de Souhaits - Atelier Art Royal';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Gérez votre liste de souhaits et retrouvez tous vos produits favoris en un seul endroit.';
    
    return () => {
      document.title = 'Atelier Art Royal';
    };
  }, []);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: wishlistItems = [], isLoading: loadingWishlist } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.WishlistItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['wishlist-products', wishlistItems],
    queryFn: async () => {
      if (wishlistItems.length === 0) return [];
      const productIds = wishlistItems.map(item => item.product_id);
      return await base44.entities.Product.filter({
        id: { $in: productIds }
      });
    },
    enabled: wishlistItems.length > 0,
    initialData: []
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId) => {
      const item = wishlistItems.find(w => w.product_id === productId);
      if (item) {
        await base44.entities.WishlistItem.delete(item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success('Produit retiré de la liste de souhaits');
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product) => {
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
    }
  });

  if (loadingUser) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 mx-auto mb-4" style={{color: '#e5b350'}} />
        <h2 className="text-2xl font-bold mb-4">Connectez-vous pour accéder à votre liste de souhaits</h2>
        <p className="text-muted-foreground mb-6">
          Enregistrez vos produits favoris et retrouvez-les facilement
        </p>
        <Button onClick={() => base44.auth.redirectToLogin()}>
          Se connecter
        </Button>
      </div>
    );
  }

  const isLoading = loadingWishlist || loadingProducts;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-10 h-10" style={{color: '#e5b350'}} />
        <h1 className="text-4xl font-bold">
          Ma Liste de <span style={{color: '#e5b350'}}>Souhaits</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Votre liste de souhaits est vide</h3>
          <p className="text-muted-foreground mb-6">
            Parcourez notre catalogue et ajoutez vos produits préférés
          </p>
          <Button onClick={() => window.location.href = createPageUrl('Catalog')}>
            Découvrir le catalogue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg"
                  onClick={() => removeFromWishlistMutation.mutate(product.id)}
                  disabled={removeFromWishlistMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  className="rounded-full shadow-lg"
                  style={{backgroundColor: '#e5b350'}}
                  onClick={() => addToCartMutation.mutate(product)}
                  disabled={addToCartMutation.isPending}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}