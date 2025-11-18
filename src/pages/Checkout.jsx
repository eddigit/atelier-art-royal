import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function Checkout() {
  const queryClient = useQueryClient();
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [formData, setFormData] = useState({
    shipping: {
      name: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France',
      phone: ''
    },
    billing: {
      name: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    }
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
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
    queryKey: ['cart-products', cartItems],
    queryFn: async () => {
      if (cartItems.length === 0) return [];
      const productPromises = cartItems.map(item =>
        base44.entities.Product.filter({ id: item.product_id }).then(p => p[0])
      );
      return Promise.all(productPromises);
    },
    enabled: cartItems.length > 0,
    initialData: []
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const subtotal = cartItems.reduce((sum, item, idx) => {
        return sum + (products[idx]?.price || 0) * item.quantity;
      }, 0);

      const shippingCost = subtotal >= 500 ? 0 : 15;
      const total = subtotal + shippingCost;

      const orderNumber = `AR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const items = cartItems.map((item, idx) => ({
        product_id: item.product_id,
        product_name: products[idx]?.name || '',
        quantity: item.quantity,
        price: products[idx]?.price || 0,
        total: (products[idx]?.price || 0) * item.quantity
      }));

      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        customer_id: user.id,
        status: 'pending',
        items: items,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total: total,
        shipping_address: formData.shipping,
        billing_address: sameAsShipping ? formData.shipping : formData.billing,
        payment_status: 'pending',
        payment_method: 'card'
      });

      // Clear cart
      for (const item of cartItems) {
        await base44.entities.CartItem.delete(item.id);
      }

      // Update stock
      for (let i = 0; i < cartItems.length; i++) {
        const product = products[i];
        if (product) {
          await base44.entities.Product.update(product.id, {
            stock_quantity: Math.max(0, product.stock_quantity - cartItems[i].quantity)
          });
        }
      }

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Commande créée avec succès !');
      window.location.href = createPageUrl('Orders');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la commande');
    }
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connexion requise</h2>
        <Button onClick={() => base44.auth.redirectToLogin()}>
          Se connecter
        </Button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    window.location.href = createPageUrl('Cart');
    return null;
  }

  const subtotal = cartItems.reduce((sum, item, idx) => {
    return sum + (products[idx]?.price || 0) * item.quantity;
  }, 0);
  const shippingCost = subtotal >= 500 ? 0 : 15;
  const total = subtotal + shippingCost;

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createOrderMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Finaliser la Commande</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse de Livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-name">Nom complet *</Label>
                    <Input
                      id="ship-name"
                      required
                      value={formData.shipping.name}
                      onChange={(e) => handleInputChange('shipping', 'name', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ship-street">Adresse *</Label>
                    <Input
                      id="ship-street"
                      required
                      value={formData.shipping.street}
                      onChange={(e) => handleInputChange('shipping', 'street', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-city">Ville *</Label>
                    <Input
                      id="ship-city"
                      required
                      value={formData.shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-postal">Code postal *</Label>
                    <Input
                      id="ship-postal"
                      required
                      value={formData.shipping.postal_code}
                      onChange={(e) => handleInputChange('shipping', 'postal_code', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-country">Pays *</Label>
                    <Input
                      id="ship-country"
                      required
                      value={formData.shipping.country}
                      onChange={(e) => handleInputChange('shipping', 'country', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship-phone">Téléphone *</Label>
                    <Input
                      id="ship-phone"
                      type="tel"
                      required
                      value={formData.shipping.phone}
                      onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Adresse de Facturation</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="same-address"
                      checked={sameAsShipping}
                      onCheckedChange={setSameAsShipping}
                    />
                    <Label htmlFor="same-address" className="cursor-pointer">
                      Identique à la livraison
                    </Label>
                  </div>
                </div>
              </CardHeader>
              {!sameAsShipping && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="bill-name">Nom complet *</Label>
                      <Input
                        id="bill-name"
                        required
                        value={formData.billing.name}
                        onChange={(e) => handleInputChange('billing', 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bill-street">Adresse *</Label>
                      <Input
                        id="bill-street"
                        required
                        value={formData.billing.street}
                        onChange={(e) => handleInputChange('billing', 'street', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bill-city">Ville *</Label>
                      <Input
                        id="bill-city"
                        required
                        value={formData.billing.city}
                        onChange={(e) => handleInputChange('billing', 'city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bill-postal">Code postal *</Label>
                      <Input
                        id="bill-postal"
                        required
                        value={formData.billing.postal_code}
                        onChange={(e) => handleInputChange('billing', 'postal_code', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bill-country">Pays *</Label>
                      <Input
                        id="bill-country"
                        required
                        value={formData.billing.country}
                        onChange={(e) => handleInputChange('billing', 'country', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Le paiement sera traité de manière sécurisée via Stripe.
                  Votre commande sera confirmée après validation du paiement.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, idx) => {
                  const product = products[idx];
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {product.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {(product.price * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-border pt-4 space-y-2">
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
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total</span>
                    <span className="text-primary">{total.toFixed(2)}€</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Traitement...' : 'Confirmer la commande'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}