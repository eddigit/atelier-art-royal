import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function SumupPayment() {
  const [mounted, setMounted] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutId = urlParams.get('checkoutId');
  const orderId = urlParams.get('order');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.filter({ id: orderId }).then(o => o[0]),
    enabled: !!orderId
  });

  useEffect(() => {
    if (!checkoutId) return;

    // Charger le SDK SumUp
    const script = document.createElement('script');
    script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
    script.onload = () => {
      try {
        window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId: checkoutId,
          onResponse: async (type, body) => {
            console.log('SumUp Payment Response:', type, body);
            
            if (type === 'success') {
              // Mettre à jour la commande
              if (orderId) {
                await base44.entities.Order.update(orderId, {
                  payment_status: 'paid'
                });
              }
              
              // Rediriger vers confirmation
              window.location.href = createPageUrl('OrderConfirmation') + `?order=${orderId}`;
            } else if (type === 'error') {
              console.error('Payment error:', body);
            }
          }
        });
        setMounted(true);
      } catch (error) {
        console.error('Failed to mount SumUp widget:', error);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [checkoutId, orderId]);

  if (!checkoutId) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Erreur de paiement</h2>
        <p className="text-muted-foreground mb-6">
          Aucune session de paiement trouvée
        </p>
        <Button onClick={() => window.location.href = createPageUrl('Cart')}>
          Retour au panier
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Paiement sécurisé</CardTitle>
        </CardHeader>
        <CardContent>
          {order && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Commande:</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{order.total?.toFixed(2)}€</span>
              </div>
            </div>
          )}

          {!mounted && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement du paiement sécurisé...</p>
            </div>
          )}

          <div id="sumup-card"></div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Paiement 100% sécurisé par SumUp</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}