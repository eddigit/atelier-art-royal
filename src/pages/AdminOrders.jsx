import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Eye, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  processing: { label: 'En préparation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
};

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', search, filterStatus],
    queryFn: async () => {
      let allOrders = await base44.entities.Order.list('-created_date', 500);
      
      if (search) {
        allOrders = allOrders.filter(o => 
          o.order_number.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (filterStatus !== 'all') {
        allOrders = allOrders.filter(o => o.status === filterStatus);
      }
      
      return allOrders;
    },
    initialData: []
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }) => base44.entities.Order.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Commande mise à jour');
      setSelectedOrder(null);
    }
  });

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        Gestion des <span className="text-gradient">Commandes</span>
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'processing').length}
              </p>
              <p className="text-sm text-muted-foreground">En préparation</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {totalRevenue.toFixed(0)}€
              </p>
              <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro de commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="processing">En préparation</SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status] || statusConfig.pending;
          
          return (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{order.order_number}</h3>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                      {order.payment_status === 'paid' && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Payée
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>Date: {format(new Date(order.created_date), 'dd/MM/yyyy', { locale: fr })}</p>
                      <p>Articles: {order.items?.length || 0}</p>
                      <p>Client: {order.shipping_address?.name}</p>
                      <p className="font-bold text-primary">Total: {order.total?.toFixed(2)}€</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {orders.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune commande trouvée</p>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Commande {selectedOrder.order_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Statut de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Statut</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(v) => {
                        updateOrderMutation.mutate({
                          orderId: selectedOrder.id,
                          data: { status: v }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="processing">En préparation</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Numéro de suivi</Label>
                    <div className="flex gap-2">
                      <Input
                        value={selectedOrder.tracking_number || ''}
                        onChange={(e) => {
                          setSelectedOrder({
                            ...selectedOrder,
                            tracking_number: e.target.value
                          });
                        }}
                        placeholder="Ex: FR123456789"
                      />
                      <Button
                        onClick={() => {
                          updateOrderMutation.mutate({
                            orderId: selectedOrder.id,
                            data: { tracking_number: selectedOrder.tracking_number }
                          });
                        }}
                      >
                        <Truck className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Produits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-muted-foreground">
                            {item.quantity} × {item.price?.toFixed(2)}€
                          </p>
                        </div>
                        <p className="font-bold">{item.total?.toFixed(2)}€</p>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">{selectedOrder.total?.toFixed(2)}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.shipping_address?.name}</p>
                    <p>{selectedOrder.shipping_address?.street}</p>
                    <p>{selectedOrder.shipping_address?.postal_code} {selectedOrder.shipping_address?.city}</p>
                    <p>{selectedOrder.shipping_address?.country}</p>
                    <p>{selectedOrder.shipping_address?.phone}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Facturation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.billing_address?.name}</p>
                    <p>{selectedOrder.billing_address?.street}</p>
                    <p>{selectedOrder.billing_address?.postal_code} {selectedOrder.billing_address?.city}</p>
                    <p>{selectedOrder.billing_address?.country}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}