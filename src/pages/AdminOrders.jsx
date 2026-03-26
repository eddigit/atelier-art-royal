import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Eye, Truck, User, Download, Bell, Star } from 'lucide-react';
import OrderReturns from '@/components/admin/OrderReturns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { downloadOrderPdf } from '@/utils/generatePdf';

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

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', search, filterStatus, filterChannel],
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

      if (filterChannel !== 'all') {
        allOrders = allOrders.filter(o => o.sales_channel === filterChannel);
      }
      
      return allOrders;
    },
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers-all'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const { data: productionItems = [] } = useQuery({
    queryKey: ['admin-production-all'],
    queryFn: () => base44.entities.ProductionItem.list(),
    initialData: []
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, data, sendNotification }) => {
      await base44.entities.Order.update(orderId, data);
      
      if (sendNotification && data.status) {
        try {
          await base44.functions.invoke('notifyOrderStatus', {
            orderId,
            status: data.status,
            trackingNumber: data.tracking_number
          });
        } catch (error) {
          console.error('Erreur notification:', error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Commande mise à jour');
      setSelectedOrder(null);
    }
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (order) => {
      const customer = customers.find(c => c.id === order.customer_id);
      downloadOrderPdf(order, customer);
    },
    onSuccess: () => {
      toast.success('Document PDF généré');
    },
    onError: (error) => {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  });

  const getCustomerFullName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.full_name : 'Client Invité';
  };

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const webRevenue = orders
    .filter(o => o.payment_status === 'paid' && o.sales_channel === 'website')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const directRevenue = orders
    .filter(o => o.payment_status === 'paid' && o.sales_channel === 'direct')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        Gestion des <span className="text-gradient">Commandes</span>
      </h1>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="returns">Retours</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">

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
                {orders.filter(o => ['design', 'production', 'quality_control', 'packaging'].includes(o.status)).length}
              </p>
              <p className="text-sm text-muted-foreground">En fabrication</p>
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
              <div className="flex gap-2 mt-2 justify-center text-xs">
                <Badge variant="outline" className="bg-blue-600/10">Web: {webRevenue.toFixed(0)}€</Badge>
                <Badge variant="outline" className="bg-orange-600/10">Direct: {directRevenue.toFixed(0)}€</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <SelectItem value="pending">Commande reçue</SelectItem>
            <SelectItem value="design">En design</SelectItem>
            <SelectItem value="production">En production</SelectItem>
            <SelectItem value="quality_control">Contrôle qualité</SelectItem>
            <SelectItem value="packaging">Emballage</SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les canaux</SelectItem>
            <SelectItem value="website">Web</SelectItem>
            <SelectItem value="direct">Direct (Usine/Téléphone)</SelectItem>
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
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                          Payée
                        </Badge>
                      )}
                      <Badge variant="outline" className={order.sales_channel === 'website' ? 'bg-blue-600/10' : 'bg-orange-600/10'}>
                        {order.sales_channel === 'website' ? 'Web' : 'Direct'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>Date: {format(new Date(order.created_date), 'dd/MM/yyyy', { locale: fr })}</p>
                      <p>
                        Client:{' '}
                        {order.customer_id && !order.customer_id.startsWith('guest_') ? (
                          <Link to={createPageUrl('AdminCustomers') + `?customer_id=${order.customer_id}`} className="text-primary hover:underline">
                            {getCustomerFullName(order.customer_id)}
                          </Link>
                        ) : (
                          <span>{order.shipping_address?.name || 'Client Invité'}</span>
                        )}
                      </p>
                      <div className="col-span-2">
                        <p className="font-medium text-foreground mb-1">
                          {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''} :
                        </p>
                        <ul className="space-y-0.5">
                          {order.items?.slice(0, 3).map((item, idx) => {
                            const variants = [item.selected_size, item.selected_color].filter(Boolean).join(' / ');
                            return (
                              <li key={idx} className="text-xs">
                                {item.quantity}x {item.product_name}
                                {item.product_sku && <span className="font-mono text-primary ml-1">({item.product_sku})</span>}
                                {variants && <span className="ml-1">- {variants}</span>}
                              </li>
                            );
                          })}
                          {(order.items?.length || 0) > 3 && (
                            <li className="text-xs italic">+{order.items.length - 3} autre(s)...</li>
                          )}
                        </ul>
                      </div>
                      <p className="font-bold text-primary col-span-2">Total: {order.total?.toFixed(2)}€</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateInvoiceMutation.mutate(order)}
                      disabled={generateInvoiceMutation.isPending}
                      title={order.payment_status === 'paid' ? 'Télécharger la facture' : 'Télécharger le bon de commande'}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {order.status === 'delivered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await base44.functions.invoke('requestReview', { orderId: order.id });
                            toast.success('Email d\'avis envoyé');
                          } catch (error) {
                            toast.error('Erreur lors de l\'envoi');
                          }
                        }}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                  </div>
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
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <User className="w-10 h-10 p-2 bg-muted rounded-full" />
                    <div>
                      {selectedOrder.customer_id && !selectedOrder.customer_id.startsWith('guest_') ? (
                        <Link to={createPageUrl('AdminCustomers') + `?customer_id=${selectedOrder.customer_id}`} className="font-semibold text-primary hover:underline">
                          {getCustomerFullName(selectedOrder.customer_id)}
                        </Link>
                      ) : (
                        <p className="font-semibold">{selectedOrder.shipping_address?.name || 'Client Invité'}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.shipping_address?.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                        <SelectItem value="pending">Commande reçue</SelectItem>
                        <SelectItem value="design">En design</SelectItem>
                        <SelectItem value="production">En production</SelectItem>
                        <SelectItem value="quality_control">Contrôle qualité</SelectItem>
                        <SelectItem value="packaging">Emballage</SelectItem>
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
                        variant="outline"
                        onClick={() => {
                          updateOrderMutation.mutate({
                            orderId: selectedOrder.id,
                            data: { tracking_number: selectedOrder.tracking_number },
                            sendNotification: false
                          });
                        }}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        onClick={() => {
                          updateOrderMutation.mutate({
                            orderId: selectedOrder.id,
                            data: { 
                              status: selectedOrder.status,
                              tracking_number: selectedOrder.tracking_number 
                            },
                            sendNotification: true
                          });
                        }}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Notifier
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
                  {productionItems.filter(p => p.order_id === selectedOrder.id).length > 0 && (
                    <div className="mb-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                      <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Articles en production
                      </h4>
                      <ul className="text-sm space-y-1">
                        {productionItems.filter(p => p.order_id === selectedOrder.id).map(prod => (
                          <li key={prod.id} className="flex justify-between items-center">
                            <span>{prod.product_name} - <span className="capitalize">{prod.status.replace('en_', 'en ').replace('_', ' ')}</span></span>
                            <Link to={createPageUrl('AdminProduction')} className="text-primary hover:underline text-xs">
                              Voir détails
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => {
                      const variantParts = [
                        item.selected_size && `Taille: ${item.selected_size}`,
                        item.selected_color && `Couleur: ${item.selected_color}`,
                        item.selected_material && `Matière: ${item.selected_material}`
                      ].filter(Boolean);
                      return (
                        <div key={idx} className="flex justify-between text-sm">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.product_sku && (
                              <p className="text-xs text-primary font-mono font-semibold">
                                Réf: {item.product_sku}
                              </p>
                            )}
                            {variantParts.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {variantParts.join(' • ')}
                              </p>
                            )}
                            <p className="text-muted-foreground">
                              {item.quantity} x {item.price?.toFixed(2)}€
                            </p>
                          </div>
                          <p className="font-bold">{item.total?.toFixed(2)}€</p>
                        </div>
                      );
                    })}
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
        </TabsContent>

        <TabsContent value="returns">
          <OrderReturns />
        </TabsContent>
      </Tabs>
    </div>
  );
}