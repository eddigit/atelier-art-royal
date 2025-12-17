import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function POSQuotes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['pos-quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date', 200),
    initialData: []
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (quoteId) => {
      const quote = quotes.find(q => q.id === quoteId);
      const response = await base44.functions.invoke('generateQuotePdf', { quoteId: quote.id });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        toast.success('PDF du devis généré');
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du PDF');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ quoteId, status }) => 
      base44.entities.Quote.update(quoteId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-quotes']);
      toast.success('Statut mis à jour');
    }
  });

  const convertToOrderMutation = useMutation({
    mutationFn: async (quoteId) => {
      const quote = quotes.find(q => q.id === quoteId);
      
      const orderData = {
        customer_id: quote.customer_id,
        order_number: `CMD-${Date.now()}`,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'phone_validation',
        sales_channel: 'direct',
        items: quote.items,
        subtotal: quote.subtotal,
        shipping_cost: quote.shipping_cost || 0,
        total: quote.total,
        shipping_address: quote.shipping_address,
        billing_address: quote.billing_address,
        notes: `Converti depuis le devis ${quote.quote_number}`
      };

      const order = await base44.entities.Order.create(orderData);
      await base44.entities.Quote.update(quoteId, { 
        status: 'converted',
        order_id: order.id 
      });
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pos-quotes']);
      toast.success('Devis converti en commande');
    }
  });

  const statusConfig = {
    draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-800', icon: Clock },
    sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Send },
    accepted: { label: 'Accepté', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
    expired: { label: 'Expiré', color: 'bg-orange-100 text-orange-800', icon: Clock },
    converted: { label: 'Converti', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Devis ({filteredQuotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Rechercher par numéro, nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="converted">Converti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des devis */}
      <div className="grid gap-4">
        {filteredQuotes.map(quote => {
          const StatusIcon = statusConfig[quote.status]?.icon || Clock;
          const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
          
          return (
            <Card key={quote.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{quote.quote_number}</h3>
                      <Badge className={statusConfig[quote.status]?.color}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {statusConfig[quote.status]?.label}
                      </Badge>
                      {isExpired && quote.status !== 'converted' && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Clock className="w-4 h-4 mr-1" />
                          Expiré
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-semibold">{quote.customer_name}</p>
                        {quote.customer_email && (
                          <p className="text-sm text-muted-foreground">{quote.customer_email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date de création</p>
                        <p className="font-semibold">
                          {new Date(quote.created_date).toLocaleDateString('fr-FR')}
                        </p>
                        {quote.valid_until && (
                          <>
                            <p className="text-muted-foreground text-sm mt-1">Valide jusqu'au</p>
                            <p className="text-sm font-semibold">
                              {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
                            </p>
                          </>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Articles</p>
                        <p className="font-semibold">{quote.items?.length || 0} produit(s)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Montant</p>
                        <p className="text-2xl font-bold text-primary">
                          {quote.total?.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setSelectedQuote(quote);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Voir
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => generatePdfMutation.mutate(quote.id)}
                      disabled={generatePdfMutation.isPending}
                    >
                      {generatePdfMutation.isPending ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5 mr-2" />
                      )}
                      PDF
                    </Button>

                    {quote.status === 'draft' && (
                      <Button
                        size="lg"
                        onClick={() => updateStatusMutation.mutate({ quoteId: quote.id, status: 'sent' })}
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Envoyer
                      </Button>
                    )}

                    {quote.status === 'accepted' && (
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => convertToOrderMutation.mutate(quote.id)}
                        disabled={convertToOrderMutation.isPending}
                      >
                        {convertToOrderMutation.isPending ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                        )}
                        Convertir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredQuotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">Aucun devis trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de visualisation */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du devis {selectedQuote?.quote_number}</DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">{selectedQuote.customer_name}</p>
                  {selectedQuote.customer_email && (
                    <p className="text-sm">{selectedQuote.customer_email}</p>
                  )}
                  {selectedQuote.customer_phone && (
                    <p className="text-sm">{selectedQuote.customer_phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={statusConfig[selectedQuote.status]?.color}>
                    {statusConfig[selectedQuote.status]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Articles</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Produit</th>
                        <th className="text-right p-3">Qté</th>
                        <th className="text-right p-3">Prix</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items?.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{item.product_name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            )}
                          </td>
                          <td className="text-right p-3">{item.quantity}</td>
                          <td className="text-right p-3">{item.price?.toFixed(2)} €</td>
                          <td className="text-right p-3 font-semibold">{item.total?.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-semibold">
                      <tr>
                        <td colSpan="3" className="text-right p-3">Sous-total</td>
                        <td className="text-right p-3">{selectedQuote.subtotal?.toFixed(2)} €</td>
                      </tr>
                      {selectedQuote.shipping_cost > 0 && (
                        <tr>
                          <td colSpan="3" className="text-right p-3">Frais de port</td>
                          <td className="text-right p-3">{selectedQuote.shipping_cost?.toFixed(2)} €</td>
                        </tr>
                      )}
                      {selectedQuote.discount > 0 && (
                        <tr>
                          <td colSpan="3" className="text-right p-3">Remise</td>
                          <td className="text-right p-3">-{selectedQuote.discount?.toFixed(2)} €</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="text-right p-3">TVA ({selectedQuote.tax_rate}%)</td>
                        <td className="text-right p-3">{selectedQuote.tax_amount?.toFixed(2)} €</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan="3" className="text-right p-3">Total TTC</td>
                        <td className="text-right p-3 text-primary">{selectedQuote.total?.toFixed(2)} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedQuote.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedQuote.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}