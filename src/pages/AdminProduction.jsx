import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Factory,
  AlertCircle,
  Search,
  Plus,
  Eye,
  Filter,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import ProductionDetailDialog from '@/components/admin/ProductionDetailDialog';
import ProductionStatsCards from '@/components/admin/ProductionStatsCards';
import ProductionToStockDialog from '@/components/admin/ProductionToStockDialog';

export default function AdminProduction() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [stockProduction, setStockProduction] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['productions'],
    queryFn: () => base44.entities.ProductionItem.list('-created_date', 500),
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['all-customers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const deleteProductionMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductionItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['productions']);
      toast.success('Projet supprimé');
    }
  });

  const statusConfig = {
    en_attente: { 
      label: 'En Attente', 
      color: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
      icon: Clock
    },
    en_design: { 
      label: 'En Design', 
      color: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      icon: Loader2
    },
    en_fabrication: { 
      label: 'En Fabrication', 
      color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      icon: Factory
    },
    terminee: { 
      label: 'Terminée', 
      color: 'bg-green-600/20 text-green-400 border-green-600/30',
      icon: CheckCircle2
    },
    livree: { 
      label: 'Livrée', 
      color: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
      icon: CheckCircle2
    }
  };

  const priorityConfig = {
    basse: { label: 'Basse', color: 'bg-gray-600/20 text-gray-400' },
    normale: { label: 'Normale', color: 'bg-blue-600/20 text-blue-400' },
    haute: { label: 'Haute', color: 'bg-orange-600/20 text-orange-400' },
    urgente: { label: 'Urgente', color: 'bg-red-600/20 text-red-400' }
  };

  const filteredProductions = productions.filter(prod => {
    const customer = customers.find(c => c.id === prod.customer_id);
    const matchesSearch = 
      prod.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.lodge_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.full_name || customer?.lodge_name || 'Client inconnu';
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion de Production</h1>
          <p className="text-muted-foreground">
            {productions.length} projet{productions.length > 1 ? 's' : ''} de fabrication
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Projet
        </Button>
      </div>

      <ProductionStatsCards productions={productions} />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="en_attente">En Attente</TabsTrigger>
          <TabsTrigger value="en_design">En Design</TabsTrigger>
          <TabsTrigger value="en_fabrication">En Fabrication</TabsTrigger>
          <TabsTrigger value="terminee">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par produit ou client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En Attente</SelectItem>
                    <SelectItem value="en_design">En Design</SelectItem>
                    <SelectItem value="en_fabrication">En Fabrication</SelectItem>
                    <SelectItem value="terminee">Terminée</SelectItem>
                    <SelectItem value="livree">Livrée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : filteredProductions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun projet trouvé</p>
              ) : (
                <div className="space-y-3">
                  {filteredProductions.map((production) => {
                    const StatusIcon = statusConfig[production.status]?.icon || Factory;
                    
                    return (
                      <div 
                        key={production.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg ${statusConfig[production.status]?.color.replace('text-', 'bg-').replace('400', '600/20')} flex items-center justify-center`}>
                            <StatusIcon className={`w-6 h-6 ${statusConfig[production.status]?.color.split(' ')[1]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{production.product_name}</h3>
                              <Badge className={statusConfig[production.status]?.color}>
                                {statusConfig[production.status]?.label}
                              </Badge>
                              {production.priority && production.priority !== 'normale' && (
                                <Badge className={priorityConfig[production.priority]?.color}>
                                  {priorityConfig[production.priority]?.label}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Client: {getCustomerName(production.customer_id)}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Créé le {new Date(production.created_date).toLocaleDateString('fr-FR')}</span>
                              {production.due_date && (
                                <>
                                  <span>•</span>
                                  <span>Livraison: {new Date(production.due_date).toLocaleDateString('fr-FR')}</span>
                                </>
                              )}
                              {production.design_images?.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{production.design_images.length} image{production.design_images.length > 1 ? 's' : ''}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {production.status === 'terminee' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setStockProduction(production)}
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Stock
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProduction(production)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Supprimer ce projet de production ?')) {
                                deleteProductionMutation.mutate(production.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {['en_attente', 'en_design', 'en_fabrication', 'terminee'].map(status => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {productions.filter(p => p.status === status).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun projet avec le statut "{statusConfig[status]?.label}"
                    </p>
                  ) : (
                    productions.filter(p => p.status === status).map((production) => {
                      const StatusIcon = statusConfig[production.status]?.icon || Factory;
                      
                      return (
                        <div 
                          key={production.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-lg ${statusConfig[production.status]?.color.replace('text-', 'bg-').replace('400', '600/20')} flex items-center justify-center`}>
                              <StatusIcon className={`w-6 h-6 ${statusConfig[production.status]?.color.split(' ')[1]}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{production.product_name}</h3>
                                {production.priority && production.priority !== 'normale' && (
                                  <Badge className={priorityConfig[production.priority]?.color}>
                                    {priorityConfig[production.priority]?.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Client: {getCustomerName(production.customer_id)}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {production.due_date && (
                                  <span>Livraison: {new Date(production.due_date).toLocaleDateString('fr-FR')}</span>
                                )}
                                {production.design_images?.length > 0 && (
                                  <>
                                    {production.due_date && <span>•</span>}
                                    <span>{production.design_images.length} image{production.design_images.length > 1 ? 's' : ''}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProduction(production)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Production Detail Dialog */}
      {(selectedProduction || showNewDialog) && (
        <ProductionDetailDialog
          production={selectedProduction}
          customers={customers}
          open={!!(selectedProduction || showNewDialog)}
          onClose={() => {
            setSelectedProduction(null);
            setShowNewDialog(false);
          }}
          onSaved={() => {
            queryClient.invalidateQueries(['productions']);
            setSelectedProduction(null);
            setShowNewDialog(false);
          }}
        />
      )}

      {/* Stock Dialog */}
      {stockProduction && (
        <ProductionToStockDialog
          production={stockProduction}
          open={!!stockProduction}
          onClose={() => setStockProduction(null)}
        />
      )}
    </div>
  );
}