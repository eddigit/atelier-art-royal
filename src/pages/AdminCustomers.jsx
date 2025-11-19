import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Search,
  Eye,
  MessageSquare,
  AlertCircle,
  Star,
  Filter
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import CustomerDetailDialog from '@/components/admin/CustomerDetailDialog';
import CustomerSegmentCard from '@/components/admin/CustomerSegmentCard';

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['all-customers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
    initialData: []
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['customer-notes'],
    queryFn: () => base44.entities.CustomerNote.list('-created_date', 500),
    initialData: []
  });

  // Calculate customer segments and statistics
  const customersWithStats = useMemo(() => {
    return customers.map(customer => {
      const customerOrders = orders.filter(o => o.customer_id === customer.id);
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const orderCount = customerOrders.length;
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      const lastOrder = customerOrders[0]; // Already sorted by -created_date
      const customerNotes = notes.filter(n => n.customer_id === customer.id);

      // Determine segment
      let segment = 'new';
      if (totalSpent > 5000) segment = 'vip';
      else if (totalSpent > 2000) segment = 'loyal';
      else if (orderCount > 3) segment = 'regular';
      else if (orderCount === 0) segment = 'no-purchase';

      return {
        ...customer,
        stats: {
          totalSpent,
          orderCount,
          avgOrderValue,
          lastOrderDate: lastOrder?.created_date,
          notesCount: customerNotes.length,
          segment
        }
      };
    });
  }, [customers, orders, notes]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customersWithStats.filter(customer => {
      const matchesSearch = 
        customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSegment = 
        segmentFilter === 'all' || 
        customer.stats.segment === segmentFilter;

      return matchesSearch && matchesSegment;
    });
  }, [customersWithStats, searchQuery, segmentFilter]);

  // Calculate global stats
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const customersWithOrders = customersWithStats.filter(c => c.stats.orderCount > 0).length;
    const totalRevenue = customersWithStats.reduce((sum, c) => sum + c.stats.totalSpent, 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const segments = {
      vip: customersWithStats.filter(c => c.stats.segment === 'vip').length,
      loyal: customersWithStats.filter(c => c.stats.segment === 'loyal').length,
      regular: customersWithStats.filter(c => c.stats.segment === 'regular').length,
      new: customersWithStats.filter(c => c.stats.segment === 'new').length,
      noPurchase: customersWithStats.filter(c => c.stats.segment === 'no-purchase').length
    };

    return { totalCustomers, customersWithOrders, totalRevenue, avgLifetimeValue, segments };
  }, [customers, customersWithStats]);

  const segmentColors = {
    vip: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    loyal: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    regular: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    new: 'bg-green-600/20 text-green-400 border-green-600/30',
    'no-purchase': 'bg-gray-600/20 text-gray-400 border-gray-600/30'
  };

  const segmentLabels = {
    vip: 'VIP',
    loyal: 'Fidèle',
    regular: 'Régulier',
    new: 'Nouveau',
    'no-purchase': 'Sans achat'
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
          <h1 className="text-4xl font-bold mb-2">Gestion des Clients</h1>
          <p className="text-muted-foreground">
            {stats.totalCustomers} client{stats.totalCustomers > 1 ? 's' : ''} • {stats.customersWithOrders} actif{stats.customersWithOrders > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
              <Badge variant="outline">{stats.totalCustomers}</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalCustomers}</h3>
            <p className="text-sm text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-green-600" />
              <Badge variant="outline" className="bg-green-600/10">
                {Math.round((stats.customersWithOrders / stats.totalCustomers) * 100)}%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.customersWithOrders}</h3>
            <p className="text-sm text-muted-foreground">Clients Actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <Badge variant="outline" className="bg-blue-600/10">Total</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalRevenue.toFixed(0)}€</h3>
            <p className="text-sm text-muted-foreground">Revenu Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-yellow-600" />
              <Badge variant="outline" className="bg-yellow-600/10">LTV</Badge>
            </div>
            <h3 className="text-2xl font-bold">{stats.avgLifetimeValue.toFixed(0)}€</h3>
            <p className="text-sm text-muted-foreground">Valeur Moyenne</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Tous les Clients
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Filter className="w-4 h-4 mr-2" />
            Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tous les segments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les segments</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="loyal">Fidèles</SelectItem>
                    <SelectItem value="regular">Réguliers</SelectItem>
                    <SelectItem value="new">Nouveaux</SelectItem>
                    <SelectItem value="no-purchase">Sans achat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCustomers ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : filteredCustomers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun client trouvé</p>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div 
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{customer.full_name}</h3>
                            <Badge className={segmentColors[customer.stats.segment]}>
                              {segmentLabels[customer.stats.segment]}
                            </Badge>
                            {customer.stats.notesCount > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {customer.stats.notesCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{customer.stats.orderCount} commande{customer.stats.orderCount > 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{customer.stats.totalSpent.toFixed(2)}€ dépensés</span>
                            {customer.stats.lastOrderDate && (
                              <>
                                <span>•</span>
                                <span>Dernier achat: {new Date(customer.stats.lastOrderDate).toLocaleDateString('fr-FR')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CustomerSegmentCard
              segment="vip"
              label="Clients VIP"
              description="Plus de 5000€ dépensés"
              count={stats.segments.vip}
              customers={customersWithStats.filter(c => c.stats.segment === 'vip')}
              icon={Star}
              color="yellow"
              onViewCustomer={setSelectedCustomer}
            />
            <CustomerSegmentCard
              segment="loyal"
              label="Clients Fidèles"
              description="2000€ - 5000€ dépensés"
              count={stats.segments.loyal}
              customers={customersWithStats.filter(c => c.stats.segment === 'loyal')}
              icon={TrendingUp}
              color="purple"
              onViewCustomer={setSelectedCustomer}
            />
            <CustomerSegmentCard
              segment="regular"
              label="Clients Réguliers"
              description="Plus de 3 commandes"
              count={stats.segments.regular}
              customers={customersWithStats.filter(c => c.stats.segment === 'regular')}
              icon={ShoppingBag}
              color="blue"
              onViewCustomer={setSelectedCustomer}
            />
            <CustomerSegmentCard
              segment="new"
              label="Nouveaux Clients"
              description="1-2 commandes"
              count={stats.segments.new}
              customers={customersWithStats.filter(c => c.stats.segment === 'new')}
              icon={Users}
              color="green"
              onViewCustomer={setSelectedCustomer}
            />
            <CustomerSegmentCard
              segment="no-purchase"
              label="Sans Achat"
              description="Aucune commande"
              count={stats.segments.noPurchase}
              customers={customersWithStats.filter(c => c.stats.segment === 'no-purchase')}
              icon={AlertCircle}
              color="gray"
              onViewCustomer={setSelectedCustomer}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          orders={orders.filter(o => o.customer_id === selectedCustomer.id)}
          notes={notes.filter(n => n.customer_id === selectedCustomer.id)}
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onNoteSaved={() => queryClient.invalidateQueries(['customer-notes'])}
        />
      )}
    </div>
  );
}