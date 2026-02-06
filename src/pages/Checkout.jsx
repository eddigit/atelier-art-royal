import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CreditCard, Loader2, Banknote, Building2, Shield, Lock, Phone, Award } from 'lucide-react';
import ProgressBar from '@/components/checkout/ProgressBar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { getGuestCart, clearGuestCart } from '@/components/cart/guestCart';

export default function Checkout() {
  const queryClient = useQueryClient();
  const [sameAddress, setSameAddress] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');

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
    queryFn: () => base44.auth.me().catch(() => null)
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

  // Guest cart
  const guestCartItems = !user ? getGuestCart() : [];

  const activeCartItems = user ? cartItems : guestCartItems;

  const { data: products = [] } = useQuery({
    queryKey: ['cart-products', activeCartItems],
    queryFn: async () => {
      if (activeCartItems.length === 0) return [];
      const productPromises = activeCartItems.map(item =>
        base44.entities.Product.filter({ id: item.product_id }).then(p => p[0])
      );
      return Promise.all(productPromises);
    },
    enabled: activeCartItems.length > 0,
    initialData: []
  });

  const subtotal = activeCartItems.reduce((sum, item, idx) => {
    const product = products[idx];
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shippingCost = deliveryMethod === 'pickup' ? 0 : (subtotal >= 500 ? 0 : 15);
  const total = subtotal + shippingCost;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      let customerId;

      // Create account if guest and createAccount is true
      if (!user && createAccount) {
        if (!guestEmail || !guestPassword) {
          throw new Error('Email et mot de passe requis pour créer un compte');
        }
        
        const newUser = await base44.auth.signUp({
          email: guestEmail,
          password: guestPassword,
          full_name: shippingAddress.name
        });
        customerId = newUser.id;
      } else if (user) {
        customerId = user.id;
      } else {
        customerId = `guest_${Date.now()}`;
      }

      const orderNumber = `AR-${Date.now()}`;
      const items = activeCartItems.map((item, idx) => {
        const product = products[idx];
        return {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku || '',
          quantity: item.quantity,
          price: product.price,
          total: product.price * item.quantity
        };
      });

      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        customer_id: customerId,
        status: 'pending',
        items: items,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total: total,
        shipping_address: shippingAddress,
        billing_address: sameAddress ? shippingAddress : billingAddress,
        payment_status: 'pending',
        payment_method: paymentMethod
      });

      // If card payment, create SumUp checkout
      if (paymentMethod === 'card') {
        const { data: sumupCheckout } = await base44.functions.invoke('createSumupCheckout', {
          amount: total,
          reference: order.id,
          description: `Commande ${orderNumber}`
        });

        console.log('SumUp Response:', sumupCheckout);

        if (!sumupCheckout.success || !sumupCheckout.checkoutId) {
          console.error('SumUp Error:', sumupCheckout);
          throw new Error(sumupCheckout.error || 'Erreur lors de la création du paiement');
        }

        // Update order with checkout ID
        await base44.entities.Order.update(order.id, {
          stripe_payment_id: sumupCheckout.checkoutId
        });

        // Clear cart
        if (user) {
          await Promise.all(cartItems.map(item => base44.entities.CartItem.delete(item.id)));
        } else {
          clearGuestCart();
        }

        // Redirect to SumUp payment page
        window.location.href = sumupCheckout.checkoutUrl;
        return { orderId: order.id, redirecting: true };
      }

      // Clear cart for other payment methods
      if (user) {
        await Promise.all(cartItems.map(item => base44.entities.CartItem.delete(item.id)));
      } else {
        clearGuestCart();
      }

      // Send confirmation emails
      try {
        await base44.functions.invoke('sendOrderConfirmation', { orderId: order.id });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      return { orderId: order.id };
    },
    onSuccess: (result) => {
      if (result.redirecting) {
        // SumUp redirect - don't show toast
        return;
      }
      
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['guest-cart']);
      queryClient.invalidateQueries(['orders']);
      toast.success('✅ Commande validée avec succès !');
      
      setTimeout(() => {
        window.location.href = createPageUrl('OrderConfirmation') + `?order=${result.orderId}`;
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création de la commande');
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
    
    // Validation complète (seulement si livraison)
    let hasErrors = false;
    
    if (deliveryMethod === 'shipping') {
      const requiredFields = ['name', 'street', 'city', 'postal_code', 'phone'];
      requiredFields.forEach(field => {
        if (!validateField(field, shippingAddress[field])) {
          hasErrors = true;
        }
      });
    }

    if (!user && createAccount) {
      if (!guestEmail || !guestPassword) {
        toast.error('Email et mot de passe requis pour créer un compte');
        return;
      }
    }

    if (hasErrors || Object.keys(validationErrors).length > 0) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsProcessing(true);
    createOrderMutation.mutate();
  };

  if (activeCartItems.length === 0) {
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
      <ProgressBar currentStep="checkout" />
      <Link to={createPageUrl('Cart')} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour au panier
      </Link>

      <h1 className="text-4xl font-bold mb-8">Finaliser la commande</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Account Creation */}
            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle>Créer un compte (optionnel)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      id="create-account"
                      checked={createAccount}
                      onCheckedChange={(checked) => setCreateAccount(checked)}
                    />
                    <Label htmlFor="create-account" className="cursor-pointer">
                      Je souhaite créer un compte pour suivre ma commande
                    </Label>
                  </div>
                  {createAccount && (
                    <>
                      <div>
                        <Label htmlFor="guest-email">Email *</Label>
                        <Input
                          id="guest-email"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="votre@email.fr"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guest-password">Mot de passe *</Label>
                        <Input
                          id="guest-password"
                          type="password"
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          placeholder="Minimum 6 caractères"
                          required
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delivery Method */}
            <Card>
              <CardHeader>
                <CardTitle>Mode de livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="shipping" id="shipping" />
                    <div className="flex-1">
                      <Label htmlFor="shipping" className="cursor-pointer font-semibold">
                        Livraison à domicile
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {subtotal >= 500 ? 'Livraison gratuite' : '15€ de frais de port'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <div className="flex-1">
                      <Label htmlFor="pickup" className="cursor-pointer font-semibold">
                        Retrait en atelier
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gratuit - Sur rendez-vous au +33 6 46 68 36 10
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {deliveryMethod === 'shipping' && (
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
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Mode de paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-start space-x-3 border-2 border-primary rounded-lg p-4 cursor-pointer hover:bg-accent bg-primary/5">
                    <RadioGroupItem value="card" id="card" />
                    <div className="flex-1">
                      <Label htmlFor="card" className="cursor-pointer font-semibold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Carte bancaire
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paiement sécurisé par CB via SumUp - Recommandé
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <div className="flex-1">
                      <Label htmlFor="bank_transfer" className="cursor-pointer font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Virement bancaire
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Coordonnées bancaires communiquées par email après validation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="check" id="check" />
                    <div className="flex-1">
                      <Label htmlFor="check" className="cursor-pointer font-semibold flex items-center gap-2">
                        <Banknote className="w-5 h-5" />
                        Chèque bancaire
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Envoi du chèque après validation de la commande
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="cash" id="cash" />
                    <div className="flex-1">
                      <Label htmlFor="cash" className="cursor-pointer font-semibold flex items-center gap-2">
                        <Banknote className="w-5 h-5" />
                        Espèces à l'atelier
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paiement en espèces lors du retrait en atelier
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium mb-2">📦 Conditions d'expédition :</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• La marchandise sera expédiée dès réception du paiement</li>
                    <li>• Délai d'expédition : 5-7 jours ouvrés après validation du paiement</li>
                    <li>• Vous recevrez un email de confirmation avec les détails de paiement</li>
                  </ul>
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
              {/* Paiement sécurisé */}
              <div className="p-4 bg-primary/5 border-b border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Paiement 100% Sécurisé</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6 opacity-70" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 opacity-70" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-70" />
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCartItems.map((item, idx) => {
                  const product = products[idx];
                  if (!product) return null;
                  return (
                    <div key={item.id || item.product_id} className="flex justify-between text-sm">
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
                    <span className="text-muted-foreground">
                      {deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}
                    </span>
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

                  {/* Trust Message */}
                  <Card className="mb-4 bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Award className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Fabrication sur-mesure</h4>
                        <p className="text-xs text-muted-foreground">
                          Toutes nos créations sont fabriquées en France avec le plus grand respect des traditions maçonniques. 
                          Chaque pièce est confectionnée selon les spécificités de votre obédience et de votre rite.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  </Card>

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
                      Valider la commande
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {paymentMethod === 'card' && 'Paiement sécurisé via SumUp'}
                  {paymentMethod === 'bank_transfer' && 'Vous recevrez les coordonnées bancaires par email'}
                  {paymentMethod === 'check' && 'Vous recevrez l\'adresse d\'envoi par email'}
                  {paymentMethod === 'cash' && 'Retrait en atelier sur rendez-vous : +33 6 46 68 36 10'}
                </p>

                {/* Contact sur-mesure */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                  <p className="text-sm font-semibold mb-2">Besoin d'une création sur-mesure ?</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Notre atelier réalise toutes vos pièces personnalisées. Contactez-nous pour un devis rapide.
                  </p>
                  <a href="tel:+33646683610" className="flex items-center justify-center gap-2 text-primary font-semibold hover:underline">
                    <Phone className="w-4 h-4" />
                    +33 6 46 68 36 10
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}