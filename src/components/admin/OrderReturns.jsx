import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PackageX, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig = {
  requested: { label: 'Demandé', color: 'bg-yellow-600/20 text-yellow-600 border-yellow-600/30', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-blue-600/20 text-blue-600 border-blue-600/30', icon: CheckCircle },
  received: { label: 'Reçu', color: 'bg-purple-600/20 text-purple-600 border-purple-600/30', icon: PackageX },
  refunded: { label: 'Remboursé', color: 'bg-green-600/20 text-green-600 border-green-600/30', icon: CheckCircle },
  rejected: { label: 'Refusé', color: 'bg-red-600/20 text-red-600 border-red-600/30', icon: XCircle }
};

export default function OrderReturns() {
  const queryClient = useQueryClient();
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: returns = [] } = useQuery({
    queryKey: ['order-returns'],
    queryFn: () => base44.entities.OrderReturn.list('-created_date', 100),
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.asServiceRole.entities.User.list('', 1000),
    initialData: []
  });

  const updateReturnMutation = useMutation({
    mutationFn: async ({ returnId, status, notes }) => {
      await base44.entities.OrderReturn.update(returnId, {
        status,
        admin_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order-returns']);
      toast.success('Retour mis à jour');
      setSelectedReturn(null);
    }
  });

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.full_name || customer?.email || 'Client inconnu';
  };

  const handleStatusUpdate = (status) => {
    if (!selectedReturn) return;
    updateReturnMutation.mutate({
      returnId: selectedReturn.id,
      status,
      notes: adminNotes
    });
  };

  const stats = {
    total: returns.length,
    requested: returns.filter(r => r.status === 'requested').length,
    approved: returns.filter(r => r.status === 'approved').length,
    refunded: returns.filter(r => r.status === 'refunded').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total retours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.requested}</p>
              <p className="text-sm text-muted-foreground mt-1">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.approved}</p>
              <p className="text-sm text-muted-foreground mt-1">Approuvés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.refunded}</p>
              <p className="text-sm text-muted-foreground mt-1">Remboursés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de retour</CardTitle>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune demande de retour
            </p>
          ) : (
            <div className="space-y-4">
              {returns.map((returnItem) => {
                const config = statusConfig[returnItem.status];
                const Icon = config.icon;

                return (
                  <div
                    key={returnItem.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedReturn(returnItem);
                      setAdminNotes(returnItem.admin_notes || '');
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Commande #{returnItem.order_id?.substring(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getCustomerName(returnItem.customer_id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(returnItem.created_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Detail Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du retour</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{getCustomerName(selectedReturn.customer_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={statusConfig[selectedReturn.status].color}>
                    {statusConfig[selectedReturn.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedReturn.created_date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                {selectedReturn.refund_amount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-medium text-primary">
                      {selectedReturn.refund_amount.toFixed(2)}€
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Raison du retour</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedReturn.reason}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Produits</p>
                <div className="space-y-2">
                  {selectedReturn.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm border border-border p-2 rounded">
                      <span>{item.product_name}</span>
                      <span className="text-muted-foreground">Qté: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes administrateur</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes internes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                {selectedReturn.status === 'requested' && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate('approved')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={updateReturnMutation.isPending}
                    >
                      Approuver
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('rejected')}
                      variant="destructive"
                      className="flex-1"
                      disabled={updateReturnMutation.isPending}
                    >
                      Refuser
                    </Button>
                  </>
                )}
                {selectedReturn.status === 'approved' && (
                  <Button
                    onClick={() => handleStatusUpdate('received')}
                    className="flex-1"
                    disabled={updateReturnMutation.isPending}
                  >
                    Marquer comme reçu
                  </Button>
                )}
                {selectedReturn.status === 'received' && (
                  <Button
                    onClick={() => handleStatusUpdate('refunded')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={updateReturnMutation.isPending}
                  >
                    Marquer comme remboursé
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}