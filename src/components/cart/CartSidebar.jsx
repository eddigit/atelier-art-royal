import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartSidebar({ open, onClose }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.CartItem.filter({ user_id: user.id });
    },
    enabled: !!user,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-cart'],
    queryFn: () => base44.entities.Product.list('-created_date', 500),
    initialData: []
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      if (quantity <= 0) {
        await base44.entities.CartItem.delete(itemId);
      } else {
        await base44.entities.CartItem.update(itemId, { quantity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId) => {
      await base44.entities.CartItem.delete(itemId);
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries(['cart']);
      const previousCart = queryClient.getQueryData(['cart']);
      queryClient.setQueryData(['cart'], (old) => old?.filter(item => item.id !== itemId));
      return { previousCart };
    },
    onError: (err, itemId, context) => {
      queryClient.setQueryData(['cart'], context.previousCart);
      toast.error('Erreur lors de la suppression');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['cart']);
    },
    onSuccess: () => {
      toast.success('Article retiré');
    }
  });

  const getProductForItem = (item) => {
    return products.find(p => p.id === item.product_id);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProductForItem(item);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shipping = subtotal > 100 ? 0 : 8.90;
  const total = subtotal + shipping;

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Mon Panier
            </span>
            <Badge variant="secondary" className="text-sm">
              {cartItems.length} {cartItems.length > 1 ? 'articles' : 'article'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Votre panier est vide</h3>
            <p className="text-muted-foreground mb-6">
              Ajoutez des produits pour commencer vos achats
            </p>
            <Button onClick={onClose}>
              Continuer mes achats
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <AnimatePresence>
                <div className="space-y-4">
                  {cartItems.map((item, index) => {
                  const product = getProductForItem(item);
                  if (!product) return null;

                  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=2105';

                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 pb-4 border-b last:border-0"
                    >
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                          {product.name}
                        </h4>
                        <p className="text-sm font-bold text-primary mb-3">
                          {product.price.toFixed(2)}€
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantityMutation.mutate({
                                itemId: item.id,
                                quantity: item.quantity - 1
                              })}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantityMutation.mutate({
                                itemId: item.id,
                                quantity: item.quantity + 1
                              })}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItemMutation.mutate(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              </AnimatePresence>
            </ScrollArea>

            <div className="border-t p-6 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-semibold">{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-semibold">
                    {shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2)}€`}
                  </span>
                </div>
                {subtotal < 100 && subtotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-xs font-medium text-primary">
                      Plus que {(100 - subtotal).toFixed(2)}€ pour la livraison gratuite !
                    </p>
                  </motion.div>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{total.toFixed(2)}€</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link to={createPageUrl('Checkout')} onClick={onClose}>
                  <Button className="w-full" size="lg">
                    Passer la commande
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to={createPageUrl('Cart')} onClick={onClose}>
                  <Button variant="outline" className="w-full">
                    Voir le panier complet
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}