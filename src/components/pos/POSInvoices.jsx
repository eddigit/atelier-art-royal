import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Download, Mail, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function POSInvoices() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders = [] } = useQuery({
    queryKey: ['pos-orders'],
    queryFn: () => base44.entities.Order.filter({ sales_channel: 'direct' }, '-created_date', 200),
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => base44.entities.User.list('full_name', 500),
    initialData: []
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await base44.functions.invoke('generateInvoice', { orderId });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Facture téléchargée !');
    },
    onError: (error) => {
      toast.error('Erreur : ' + error.message);
    }
  });

  const sendInvoiceByEmailMutation = useMutation({
    mutationFn: async ({ orderId, customerEmail }) => {
      // Générer la facture et l'envoyer par email
      await base44.functions.invoke('generateInvoice', { orderId, sendEmail: true, email: customerEmail });
    },
    onSuccess: () => {
      toast.success('Facture envoyée par email !');
    },
    onError: (error) => {
      toast.error('Erreur : ' + error.message);
    }
  });

  const filteredOrders = orders.filter(o =>
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.full_name || 'Client inconnu';
  };

  const getCustomerEmail = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.email || '';
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factures & Commandes POS</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const customerEmail = getCustomerEmail(order.customer_id);

            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{order.order_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getCustomerName(order.customer_id)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[order.payment_status] || 'bg-gray-100'}>
                          {order.payment_status === 'paid' ? 'Payé' : 
                           order.payment_status === 'pending' ? 'En attente' :
                           order.payment_status === 'cancelled' ? 'Annulé' : 'Remboursé'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.created_date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {order.total?.toFixed(2)}€
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateInvoiceMutation.mutate(order.id)}
                        disabled={generateInvoiceMutation.isPending}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {customerEmail && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvoiceByEmailMutation.mutate({
                            orderId: order.id,
                            customerEmail
                          })}
                          disabled={sendInvoiceByEmailMutation.isPending}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}