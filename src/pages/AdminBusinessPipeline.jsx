import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  Plus,
  Search,
  List,
  LayoutGrid,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Target
} from 'lucide-react';
import BusinessOpportunityDialog from '@/components/admin/BusinessOpportunityDialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

export default function AdminBusinessPipeline() {
  const [view, setView] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['business-opportunities'],
    queryFn: () => base44.entities.BusinessOpportunity.list('-created_date', 500),
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.LeadRequest.list('-created_date', 500),
    initialData: []
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }) => {
      await base44.entities.BusinessOpportunity.update(id, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['business-opportunities']);
      toast.success('Affaire déplacée');
    }
  });

  const activeOpportunities = opportunities.filter(o => o.status === 'active');
  
  const filteredOpportunities = activeOpportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      opp.title?.toLowerCase().includes(query) ||
      opp.contact_name?.toLowerCase().includes(query) ||
      opp.contact_email?.toLowerCase().includes(query)
    );
  });

  const stages = {
    analyse: { title: 'Analyse', color: 'bg-blue-100 border-blue-300' },
    nego: { title: 'Négociation', color: 'bg-yellow-100 border-yellow-300' },
    conclusion: { title: 'Conclusion', color: 'bg-green-100 border-green-300' }
  };

  const getOpportunitiesByStage = (stage) => {
    return filteredOpportunities.filter(o => o.stage === stage);
  };

  const totalValue = activeOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
  const avgProbability = activeOpportunities.length > 0
    ? activeOpportunities.reduce((sum, o) => sum + (o.probability || 0), 0) / activeOpportunities.length
    : 0;
  const expectedRevenue = activeOpportunities.reduce(
    (sum, o) => sum + ((o.amount || 0) * (o.probability || 0) / 100),
    0
  );

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    
    updateStageMutation.mutate({
      id: draggableId,
      stage: newStage
    });
  };

  const priorityColors = {
    basse: 'bg-gray-100 text-gray-800',
    normale: 'bg-blue-100 text-blue-800',
    haute: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800'
  };

  const getCustomerName = (opp) => {
    if (opp.customer_id) {
      const customer = customers.find(c => c.id === opp.customer_id);
      return customer?.full_name || 'Client';
    }
    if (opp.lead_id) {
      const lead = leads.find(l => l.id === opp.lead_id);
      return lead?.contact_name || 'Lead';
    }
    return opp.contact_name || 'Non défini';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8" />
            Portefeuille d'Affaires
          </h2>
          <p className="text-muted-foreground">
            Gérez vos opportunités commerciales
          </p>
        </div>
        <Button onClick={() => {
          setSelectedOpportunity(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Affaire
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Affaires Actives</p>
                <p className="text-2xl font-bold">{activeOpportunities.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur Totale</p>
                <p className="text-2xl font-bold">{totalValue.toFixed(0)}€</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu Attendu</p>
                <p className="text-2xl font-bold">{expectedRevenue.toFixed(0)}€</p>
              </div>
              <Target className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux Moyen</p>
                <p className="text-2xl font-bold">{avgProbability.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              Liste
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stages).map(([stageKey, stageData]) => (
              <Droppable key={stageKey} droppableId={stageKey}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 rounded-lg border-2 ${stageData.color} min-h-[500px]`}
                  >
                    <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                      {stageData.title}
                      <Badge variant="secondary">
                        {getOpportunitiesByStage(stageKey).length}
                      </Badge>
                    </h3>
                    <div className="space-y-3">
                      {getOpportunitiesByStage(stageKey).map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => {
                                setSelectedOpportunity(opp);
                                setIsDialogOpen(true);
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-sm">{opp.title}</h4>
                                  <Badge className={priorityColors[opp.priority] || 'bg-gray-100'}>
                                    {opp.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                  {opp.description}
                                </p>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {getCustomerName(opp)}
                                  </div>
                                  <div className="flex items-center gap-1 font-bold text-green-600">
                                    <DollarSign className="w-3 h-3" />
                                    {opp.amount?.toFixed(0)}€
                                  </div>
                                  {opp.expected_close_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(opp.expected_close_date).toLocaleDateString('fr-FR')}
                                    </div>
                                  )}
                                  <div className="mt-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Probabilité</span>
                                      <span className="font-semibold">{opp.probability}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                      <div
                                        className="bg-blue-600 h-1.5 rounded-full"
                                        style={{ width: `${opp.probability}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold">Titre</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Montant</th>
                    <th className="text-left p-4 font-semibold">Étape</th>
                    <th className="text-left p-4 font-semibold">Probabilité</th>
                    <th className="text-left p-4 font-semibold">Date Prévue</th>
                    <th className="text-left p-4 font-semibold">Priorité</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp) => (
                    <tr
                      key={opp.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedOpportunity(opp);
                        setIsDialogOpen(true);
                      }}
                    >
                      <td className="p-4">
                        <div className="font-semibold">{opp.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {opp.description}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{getCustomerName(opp)}</div>
                        {opp.contact_email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {opp.contact_email}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-green-600">
                          {opp.amount?.toFixed(0)}€
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={stages[opp.stage]?.color}>
                          {stages[opp.stage]?.title}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{opp.probability}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {opp.expected_close_date
                          ? new Date(opp.expected_close_date).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={priorityColors[opp.priority]}>
                          {opp.priority}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <BusinessOpportunityDialog
        opportunity={selectedOpportunity}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedOpportunity(null);
        }}
        customers={customers}
        leads={leads}
      />
    </div>
  );
}