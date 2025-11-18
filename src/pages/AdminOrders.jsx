import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock, Package, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
  processing: { label: 'En préparation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: Package },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', icon: Truck },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle }
};

export default function AdminOrders() {
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: async () => {
      const allOrders = await base44.entities.Order.list('-created_date', 500);
      if (filter === 'all') return allOrders;
      return allOrders.filter(o => o.status === filter);
    },
    initialData: []
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Commande mise à jour');
      setSelectedOrder(null);
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        Gestion des <span className="text-gradient">Commandes</span>
      </h1>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="processing">En préparation</TabsTrigger>
          <TabsTrigger value="shipped">Expédiées</TabsTrigger>
          <TabsTrigger value="delivered">Livrées</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{order.order_number}</h3>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(order.created_date), 'PPP', { locale: fr })}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span>
                        <strong>{order.items?.length || 0}</strong> article{order.items?.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-primary font-bold">
                        {order.total?.toFixed(2)}€
                      </span>
                      <span className="text-muted-foreground">
                        {order.shipping_address?.name}
                      </span>
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
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune commande trouvée</p>
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={(data) => updateOrderMutation.mutate({ id: selectedOrder.id, data })}
        />
      )}
    </div>
  );
}

function OrderDetailDialog({ order, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    status: order.status,
    tracking_number: order.tracking_number || '',
    notes: order.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commande {order.order_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status and Tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Numéro de suivi</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                placeholder="Ex: 1Z999AA10123456784"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <Label className="mb-3 block">Articles commandés</Label>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantité: {item.quantity} × {item.price?.toFixed(2)}€
                    </p>
                  </div>
                  <p className="font-bold">{item.total?.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium">{order.subtotal?.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span className="font-medium">{order.shipping_cost?.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{order.total?.toFixed(2)}€</span>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Adresse de livraison</Label>
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-medium">{order.shipping_address?.name}</p>
                <p>{order.shipping_address?.street}</p>
                <p>{order.shipping_address?.postal_code} {order.shipping_address?.city}</p>
                <p>{order.shipping_address?.country}</p>
                <p>{order.shipping_address?.phone}</p>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Adresse de facturation</Label>
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-medium">{order.billing_address?.name}</p>
                <p>{order.billing_address?.street}</p>
                <p>{order.billing_address?.postal_code} {order.billing_address?.city}</p>
                <p>{order.billing_address?.country}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes internes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes pour cette commande..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              Enregistrer les modifications
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}