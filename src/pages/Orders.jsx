import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
  processing: { label: 'En préparation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: Package },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', icon: Truck },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle }
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

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Aucune commande</h2>
          <p className="text-muted-foreground">
            Vous n'avez pas encore passé de commande
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        Commande {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_date), 'PPP', { locale: fr })}
                      </p>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product_name} x{item.quantity}
                        </span>
                        <span className="font-medium">{item.total?.toFixed(2)}€</span>
                      </div>
                    ))}
                    
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary text-lg">
                        {order.total?.toFixed(2)}€
                      </span>
                    </div>

                    {order.tracking_number && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">
                          <Truck className="w-4 h-4 inline mr-2" />
                          Numéro de suivi : <strong>{order.tracking_number}</strong>
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <p><strong>Livraison :</strong></p>
                      <p>{order.shipping_address?.name}</p>
                      <p>{order.shipping_address?.street}</p>
                      <p>{order.shipping_address?.postal_code} {order.shipping_address?.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}