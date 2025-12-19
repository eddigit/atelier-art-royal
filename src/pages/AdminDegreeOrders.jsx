import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Award,
  AlertCircle,
  Edit,
  Plus,
  Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DegreeOrderEditDialog from '@/components/admin/DegreeOrderEditDialog';

export default function AdminDegreeOrders() {
  const queryClient = useQueryClient();
  const [selectedDegreeOrder, setSelectedDegreeOrder] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRite, setFilterRite] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: degreeOrders = [], isLoading } = useQuery({
    queryKey: ['admin-degree-orders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 100),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
    initialData: []
  });

  const getProductCount = (degreeOrderId) => {
    return products.filter(p => {
      const degreeIds = Array.isArray(p.degree_order_ids) && p.degree_order_ids.length > 0
        ? p.degree_order_ids 
        : (p.degree_order_id ? [p.degree_order_id] : []);
      return degreeIds.includes(degreeOrderId);
    }).length;
  };

  const getRiteName = (riteId) => {
    const rite = rites.find(r => r.id === riteId);
    return rite ? rite.name : 'Non spécifié';
  };

  const filteredDegreeOrders = degreeOrders.filter(deg => {
    const matchesSearch = search === '' || 
      deg.name.toLowerCase().includes(search.toLowerCase());
    const matchesRite = filterRite === 'all' || deg.rite_id === filterRite;
    return matchesSearch && matchesRite;
  });

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
          <h1 className="text-4xl font-bold mb-2">Gestion des Degrés & Ordres</h1>
          <p className="text-muted-foreground">
            {filteredDegreeOrders.length} degré{filteredDegreeOrders.length > 1 ? 's' : ''} & ordre{filteredDegreeOrders.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Degré & Ordre
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un degré..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRite} onValueChange={setFilterRite}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par rite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rites</SelectItem>
                {rites.map(rite => (
                  <SelectItem key={rite.id} value={rite.id}>
                    {rite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Degrés & Ordres</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredDegreeOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun degré trouvé</p>
          ) : (
            <div className="space-y-3">
              {filteredDegreeOrders.map((degree) => (
                <Card key={degree.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-lg">{degree.name}</h3>
                          <Badge variant="outline">
                            Niveau {degree.level}
                          </Badge>
                        </div>
                        {degree.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {degree.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          {degree.rite_id && (
                            <Badge className="bg-blue-600/20 text-blue-400">
                              {getRiteName(degree.rite_id)}
                            </Badge>
                          )}
                          <Badge className="bg-primary/20 text-primary">
                            {getProductCount(degree.id)} produit{getProductCount(degree.id) !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline">
                            Ordre: {degree.order || 0}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDegreeOrder(degree)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {(selectedDegreeOrder || showNewDialog) && (
        <DegreeOrderEditDialog
          degreeOrder={selectedDegreeOrder}
          rites={rites}
          open={!!(selectedDegreeOrder || showNewDialog)}
          onClose={() => {
            setSelectedDegreeOrder(null);
            setShowNewDialog(false);
          }}
          onSaved={() => {
            queryClient.invalidateQueries(['admin-degree-orders']);
            queryClient.invalidateQueries(['degreeOrders']);
            setSelectedDegreeOrder(null);
            setShowNewDialog(false);
          }}
        />
      )}
    </div>
  );
}