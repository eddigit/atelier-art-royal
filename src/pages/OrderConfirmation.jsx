import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProgressBar from '@/components/checkout/ProgressBar';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderConfirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      const orderData = orders[0];
      
      // If card payment, verify SumUp payment status
      if (orderData && orderData.payment_method === 'card' && orderData.stripe_payment_id) {
        try {
          const { data: verification } = await base44.functions.invoke('verifySumupPayment', {
            checkoutId: orderData.stripe_payment_id
          });
          
          if (verification.paid) {
            // Update order to paid
            await base44.entities.Order.update(orderData.id, {
              payment_status: 'paid'
            });
            orderData.payment_status = 'paid';
            
            // Send confirmation emails
            try {
              await base44.functions.invoke('sendOrderConfirmation', { orderId: orderData.id });
            } catch (emailError) {
              console.error('Email error:', emailError);
            }
          }
        } catch (error) {
          console.error('Payment verification error:', error);
        }
      }
      
      return orderData;
    },
    enabled: !!orderId
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <ProgressBar currentStep="confirmation" />
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Commande introuvable</h2>
        <Link to={createPageUrl('Home')}>
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <ProgressBar currentStep="confirmation" />

      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Commande confirmée !</h1>
          <p className="text-muted-foreground">
            Merci pour votre confiance. Nous avons bien reçu votre commande.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Détails de la commande</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numéro de commande</span>
                  <span className="font-semibold">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold text-primary">{order.total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode de paiement</span>
                  <span className="font-medium">
                    {order.payment_method === 'bank_transfer' ? 'Virement bancaire' : 
                     order.payment_method === 'cash' ? 'Espèces' : 
                     order.payment_method === 'card' ? 'Carte bancaire' : 'Autre'}
                  </span>
                </div>
                {order.payment_method === 'card' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut du paiement</span>
                    <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.payment_status === 'paid' ? '✓ Payé' : 'En attente'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {order.payment_method === 'bank_transfer' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  📧 Instructions de paiement envoyées par email
                </p>
                <p className="text-xs text-yellow-700">
                  Veuillez effectuer le virement bancaire pour que nous puissions traiter votre commande.
                </p>
              </div>
            )}

            {order.payment_method === 'cash' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold mb-2">
                  📍 Retrait en atelier
                </p>
                <p className="text-xs text-green-700">
                  Merci de nous contacter au +33 6 46 68 36 10 pour convenir d'un rendez-vous.
                </p>
              </div>
            )}

            {order.payment_method === 'card' && order.payment_status === 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold mb-2">
                  ✓ Paiement confirmé
                </p>
                <p className="text-xs text-green-700">
                  Votre paiement par carte a été accepté. Nous préparons votre commande.
                </p>
              </div>
            )}

            {order.payment_method === 'card' && order.payment_status !== 'paid' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  ⏳ Paiement en attente
                </p>
                <p className="text-xs text-yellow-700">
                  Nous vérifions votre paiement. Vous recevrez une confirmation par email.
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Articles commandés</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  const variants = [item.selected_size, item.selected_color, item.selected_material].filter(Boolean);
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <div>
                        <span>{item.product_name} x {item.quantity}</span>
                        {item.product_sku && (
                          <span className="text-xs text-muted-foreground ml-2 font-mono">({item.product_sku})</span>
                        )}
                        {variants.length > 0 && (
                          <p className="text-xs text-muted-foreground">{variants.join(' / ')}</p>
                        )}
                      </div>
                      <span className="font-medium">{item.total.toFixed(2)}€</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Adresse de livraison</h3>
              <div className="text-sm text-muted-foreground">
                <p>{order.shipping_address.name}</p>
                <p>{order.shipping_address.street}</p>
                <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                <p>{order.shipping_address.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Prochaines étapes
            </h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Validation du paiement</p>
                  <p className="text-muted-foreground text-xs">Nous vérifions votre paiement</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">Production</p>
                  <p className="text-muted-foreground text-xs">Nos artisans créent votre pièce</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Expédition</p>
                  <p className="text-muted-foreground text-xs">Livraison sous 5-7 jours ouvrés</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Une question sur votre commande ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Notre équipe est à votre disposition
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:+33646683610" className="text-primary font-semibold hover:underline">
                +33 6 46 68 36 10
              </a>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <a href="mailto:contact@artroyal.fr" className="text-primary font-semibold hover:underline">
                contact@artroyal.fr
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Link to={createPageUrl('Orders')} className="flex-1">
            <Button variant="outline" className="w-full">
              Voir mes commandes
            </Button>
          </Link>
          <Link to={createPageUrl('Home')} className="flex-1">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}