import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Checkout() {
  const queryClient = useQueryClient();
  const [sameAddress, setSameAddress] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'France',
    phone: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const [billingAddress, setBillingAddress] = useState({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'France'
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
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

  const subtotal = cartItems.reduce((sum, item, idx) => {
    const product = products[idx];
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shippingCost = subtotal >= 500 ? 0 : 15;
  const total = subtotal + shippingCost;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderNumber = `AR-${Date.now()}`;
      const items = cartItems.map((item, idx) => {
        const product = products[idx];
        return {
          product_id: product.id,
          product_name: product.name,
          quantity: item.quantity,
          price: product.price,
          total: product.price * item.quantity
        };
      });

      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        customer_id: user.id,
        status: 'pending',
        items: items,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total: total,
        shipping_address: shippingAddress,
        billing_address: sameAddress ? shippingAddress : billingAddress,
        payment_status: 'pending',
        payment_method: 'stripe'
      });

      // Clear cart
      await Promise.all(cartItems.map(item => base44.entities.CartItem.delete(item.id)));

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      toast.success('Commande créée avec succès !');
      window.location.href = createPageUrl('Orders');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la commande');
      setIsProcessing(false);
    }
  });

  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    
    if (!value || value.trim() === '') {
      errors[field] = 'Ce champ est requis';
    } else if (field === 'postal_code' && !/^\d{5}$/.test(value)) {
      errors[field] = 'Code postal invalide (5 chiffres)';
    } else if (field === 'phone' && !/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(value.replace(/\s/g, ''))) {
      errors[field] = 'Numéro de téléphone invalide';
    } else {
      delete errors[field];
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation complète
    const requiredFields = ['name', 'street', 'city', 'postal_code', 'phone'];
    let hasErrors = false;
    
    requiredFields.forEach(field => {
      if (!validateField(field, shippingAddress[field])) {
        hasErrors = true;
      }
    });

    if (hasErrors || Object.keys(validationErrors).length > 0) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsProcessing(true);
    createOrderMutation.mutate();
  };

  if (!user || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
        <Link to={createPageUrl('Catalog')}>
          <Button>Parcourir le catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to={createPageUrl('Cart')} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour au panier
      </Link>

      <h1 className="text-4xl font-bold mb-8">Finaliser la commande</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ship-name">Nom complet *</Label>
                  <Input
                    id="ship-name"
                    value={shippingAddress.name}
                    onChange={(e) => {
                      setShippingAddress({...shippingAddress, name: e.target.value});
                      validateField('name', e.target.value);
                    }}
                    onBlur={(e) => validateField('name', e.target.value)}
                    className={validationErrors.name ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="ship-street">Adresse *</Label>
                  <Input
                    id="ship-street"
                    value={shippingAddress.street}
                    onChange={(e) => {
                      setShippingAddress({...shippingAddress, street: e.target.value});
                      validateField('street', e.target.value);
                    }}
                    onBlur={(e) => validateField('street', e.target.value)}
                    className={validationErrors.street ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.street && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.street}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ship-postal">Code postal *</Label>
                    <Input
                      id="ship-postal"
                      value={shippingAddress.postal_code}
                      onChange={(e) => {
                        setShippingAddress({...shippingAddress, postal_code: e.target.value});
                        validateField('postal_code', e.target.value);
                      }}
                      onBlur={(e) => validateField('postal_code', e.target.value)}
                      className={validationErrors.postal_code ? 'border-red-500' : ''}
                      required
                    />
                    {validationErrors.postal_code && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.postal_code}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ship-city">Ville *</Label>
                    <Input
                      id="ship-city"
                      value={shippingAddress.city}
                      onChange={(e) => {
                        setShippingAddress({...shippingAddress, city: e.target.value});
                        validateField('city', e.target.value);
                      }}
                      onBlur={(e) => validateField('city', e.target.value)}
                      className={validationErrors.city ? 'border-red-500' : ''}
                      required
                    />
                    {validationErrors.city && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.city}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="ship-phone">Téléphone *</Label>
                  <Input
                    id="ship-phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={shippingAddress.phone}
                    onChange={(e) => {
                      setShippingAddress({...shippingAddress, phone: e.target.value});
                      validateField('phone', e.target.value);
                    }}
                    onBlur={(e) => validateField('phone', e.target.value)}
                    className={validationErrors.phone ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Adresse de facturation
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="same-address"
                      checked={sameAddress}
                      onCheckedChange={(checked) => setSameAddress(checked)}
                    />
                    <Label htmlFor="same-address" className="font-normal text-sm cursor-pointer">
                      Identique à la livraison
                    </Label>
                  </div>
                </CardTitle>
              </CardHeader>
              {!sameAddress && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bill-name">Nom complet *</Label>
                    <Input
                      id="bill-name"
                      value={billingAddress.name}
                      onChange={(e) => setBillingAddress({...billingAddress, name: e.target.value})}
                      required={!sameAddress}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bill-street">Adresse *</Label>
                    <Input
                      id="bill-street"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                      required={!sameAddress}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bill-postal">Code postal *</Label>
                      <Input
                        id="bill-postal"
                        value={billingAddress.postal_code}
                        onChange={(e) => setBillingAddress({...billingAddress, postal_code: e.target.value})}
                        required={!sameAddress}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bill-city">Ville *</Label>
                      <Input
                        id="bill-city"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        required={!sameAddress}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Order Summary */}
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
                        {product.name} × {item.quantity}
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
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 w-5 h-5" />
                      Payer {total.toFixed(2)}€
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Paiement sécurisé par Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}