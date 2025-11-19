import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Calendar, MapPin, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import OrderTimeline from '@/components/orders/OrderTimeline';

const statusConfig = {
  pending: { label: 'Commande reçue', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' },
  design: { label: 'En design', color: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30' },
  production: { label: 'En production', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  quality_control: { label: 'Contrôle qualité', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30' },
  packaging: { label: 'Emballage', color: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
  shipped: { label: 'Expédiée', color: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
  delivered: { label: 'Livrée', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
  cancelled: { label: 'Annulée', color: 'bg-red-600/20 text-red-400 border-red-600/30' }
};

const paymentStatusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' },
  paid: { label: 'Payée', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
  failed: { label: 'Échec', color: 'bg-red-600/20 text-red-400 border-red-600/30' },
  refunded: { label: 'Remboursée', color: 'bg-gray-600/20 text-gray-400 border-gray-600/30' }
};

export default function Orders() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Order.filter({ customer_id: user.id }, '-created_date', 50);
    },
    enabled: !!user,
    initialData: []
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connectez-vous pour voir vos commandes</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mes Commandes</h1>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune commande</h3>
          <p className="text-muted-foreground">
            Vous n'avez pas encore passé de commande
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-muted/30">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg mb-2">
                      Commande {order.order_number}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.created_date), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        {order.total.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[order.status]?.color}>
                      {statusConfig[order.status]?.label}
                    </Badge>
                    <Badge className={paymentStatusConfig[order.payment_status]?.color}>
                      {paymentStatusConfig[order.payment_status]?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Timeline */}
                <div className="mb-6">
                  <OrderTimeline currentStatus={order.status} />
                </div>

                {/* Products */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Produits</h4>
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-muted-foreground">
                            Quantité: {item.quantity} × {item.price.toFixed(2)}€
                          </p>
                        </div>
                        <p className="font-semibold">{item.total.toFixed(2)}€</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Adresse de livraison
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{order.shipping_address?.name}</p>
                      <p>{order.shipping_address?.street}</p>
                      <p>{order.shipping_address?.postal_code} {order.shipping_address?.city}</p>
                      <p>{order.shipping_address?.phone}</p>
                    </div>
                  </div>

                  {/* Tracking */}
                  {order.tracking_number && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        Suivi
                      </h4>
                      <p className="text-sm">
                        Numéro: <span className="font-mono">{order.tracking_number}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex justify-end space-y-2">
                    <div className="text-right space-y-1">
                      <div className="flex justify-between gap-8 text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{order.subtotal?.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between gap-8 text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>{order.shipping_cost?.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between gap-8 text-lg font-bold pt-2">
                        <span>Total</span>
                        <span className="text-primary">{order.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}