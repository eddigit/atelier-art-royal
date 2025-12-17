import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, FileSignature, Phone, Shield, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getGuestCart, updateGuestCartItem, removeFromGuestCart } from '@/components/cart/guestCart';

export default function Cart() {
  const queryClient = useQueryClient();
  const [guestCartRefresh, setGuestCartRefresh] = React.useState(0);
  const [isCreatingQuote, setIsCreatingQuote] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CartItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  // Guest cart from localStorage
  const { data: guestCartItems = [] } = useQuery({
    queryKey: ['guest-cart', guestCartRefresh],
    queryFn: () => getGuestCart(),
    initialData: [],
    enabled: !user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['cart-products', cartItems, guestCartItems],
    queryFn: async () => {
      const items = user ? cartItems : guestCartItems;
      if (items.length === 0) return [];
      const productPromises = items.map(item =>
        base44.entities.Product.filter({ id: item.product_id }).then(p => p[0])
      );
      return Promise.all(productPromises);
    },
    enabled: (user && cartItems.length > 0) || (!user && guestCartItems.length > 0),
    initialData: []
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, productId, newQuantity }) => {
      if (user) {
        return base44.entities.CartItem.update(itemId, { quantity: newQuantity });
      } else {
        updateGuestCartItem(productId, newQuantity);
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries(['cart']);
      } else {
        setGuestCartRefresh(prev => prev + 1);
      }
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ itemId, productId }) => {
      if (user) {
        return base44.entities.CartItem.delete(itemId);
      } else {
        removeFromGuestCart(productId);
        return Promise.resolve();
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries(['cart']);
      } else {
        setGuestCartRefresh(prev => prev + 1);
      }
      toast.success('Produit retiré du panier');
    }
  });

  const activeCartItems = user ? cartItems : guestCartItems;

  const subtotal = activeCartItems.reduce((sum, item, idx) => {
    const product = products[idx];
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shippingCost = subtotal >= 500 ? 0 : 15;
  const total = subtotal + shippingCost;

  const handleCreateQuote = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour créer un devis');
      base44.auth.redirectToLogin();
      return;
    }

    if (activeCartItems.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    setIsCreatingQuote(true);
    try {
      const quoteNumber = 'WEB-' + Date.now();
      const taxRate = 20;
      const subtotalHT = total / (1 + taxRate / 100);
      const taxAmount = total - subtotalHT;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const quoteData = {
        quote_number: quoteNumber,
        customer_id: user.id,
        customer_name: user.full_name,
        customer_email: user.email,
        status: 'draft',
        items: activeCartItems.map((item, idx) => {
          const product = products[idx];
          return {
            product_id: product.id,
            product_name: product.name,
            quantity: item.quantity,
            price: product.price,
            total: product.price * item.quantity
          };
        }),
        subtotal: subtotalHT,
        shipping_cost: shippingCost,
        discount: 0,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: total,
        valid_until: validUntil.toISOString().split('T')[0],
        notes: 'Devis valable 30 jours. Paiement à la commande.'
      };

      await base44.entities.Quote.create(quoteData);
      toast.success('Devis créé avec succès ! Vous pouvez le consulter dans vos commandes.');
      
      // Vider le panier
      if (user) {
        const deletePromises = cartItems.map(item => base44.entities.CartItem.delete(item.id));
        await Promise.all(deletePromises);
        queryClient.invalidateQueries(['cart']);
      } else {
        localStorage.removeItem('guest_cart');
        setGuestCartRefresh(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Erreur lors de la création du devis');
    } finally {
      setIsCreatingQuote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (activeCartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
        <p className="text-muted-foreground mb-6">
          Découvrez nos créations d'exception
        </p>
        <Link to={createPageUrl('Catalog')}>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Parcourir le catalogue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Votre Panier</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {activeCartItems.map((item, idx) => {
            const product = products[idx];
            if (!product) return null;

            return (
              <Card key={item.id || item.product_id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    <div className="flex-1">
                      <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                        <h3 className="font-semibold mb-1 hover:text-primary">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-3">
                        {product.price.toFixed(2)}€
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantityMutation.mutate({
                              itemId: item.id,
                              productId: item.product_id,
                              newQuantity: Math.max(1, item.quantity - 1)
                            })}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantityMutation.mutate({
                              itemId: item.id,
                              productId: item.product_id,
                              newQuantity: item.quantity + 1
                            })}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            {(product.price * item.quantity).toFixed(2)}€
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemMutation.mutate({ itemId: item.id, productId: item.product_id })}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Gratuit</span>
                  ) : (
                    `${shippingCost.toFixed(2)}€`
                  )}
                </span>
              </div>
              {subtotal < 500 && (
                <p className="text-xs text-muted-foreground">
                  Plus que {(500 - subtotal).toFixed(2)}€ pour la livraison gratuite
                </p>
              )}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{total.toFixed(2)}€</span>
                </div>
              </div>
              <div className="space-y-3">
                <Link to={createPageUrl('Checkout')}>
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                    Commander
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={handleCreateQuote}
                disabled={isCreatingQuote}
              >
                <FileSignature className="mr-2 w-5 h-5" />
                {isCreatingQuote ? 'Création...' : 'Créer un devis'}
              </Button>
              <Link to={createPageUrl('Catalog')}>
                <Button variant="ghost" size="lg" className="w-full">
                  Continuer mes achats
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}