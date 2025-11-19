import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Phone,
  Mail,
  User,
  Calendar,
  Filter,
  ArrowUpDown,
  MessageSquare,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Target,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-500', icon: AlertCircle },
  contacte: { label: 'Contacté', color: 'bg-yellow-500', icon: Phone },
  en_cours: { label: 'En Cours', color: 'bg-orange-500', icon: Clock },
  converti: { label: 'Converti', color: 'bg-green-500', icon: CheckCircle2 },
  perdu: { label: 'Perdu', color: 'bg-gray-500', icon: XCircle }
};

const priorityConfig = {
  basse: { label: 'Basse', color: 'bg-slate-500' },
  normale: { label: 'Normale', color: 'bg-blue-500' },
  haute: { label: 'Haute', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' }
};

export default function AdminLeads() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-created_date');
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', sortBy],
    queryFn: () => base44.entities.LeadRequest.list(sortBy, 500),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-leads'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '-created_date', 500),
    initialData: []
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead mis à jour');
    }
  });

  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
    if (filterPriority !== 'all' && lead.priority !== filterPriority) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        lead.contact_name?.toLowerCase().includes(search) ||
        lead.contact_email?.toLowerCase().includes(search) ||
        lead.contact_phone?.includes(search) ||
        lead.request_details?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: leads.length,
    nouveau: leads.filter(l => l.status === 'nouveau').length,
    en_cours: leads.filter(l => l.status === 'en_cours' || l.status === 'contacte').length,
    converti: leads.filter(l => l.status === 'converti').length,
    urgente: leads.filter(l => l.priority === 'urgente' || l.priority === 'haute').length
  };

  const handleStatusChange = (leadId, newStatus) => {
    updateLeadMutation.mutate({ 
      id: leadId, 
      data: { status: newStatus } 
    });
  };

  const handlePriorityChange = (leadId, newPriority) => {
    updateLeadMutation.mutate({ 
      id: leadId, 
      data: { priority: newPriority } 
    });
  };

  const handleNotesUpdate = (leadId, notes) => {
    updateLeadMutation.mutate({ 
      id: leadId, 
      data: { admin_notes: notes } 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Gestion des Leads</h2>
        <p className="text-muted-foreground">
          Suivez et gérez toutes les demandes de prospects
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.nouveau}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.en_cours}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Convertis</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.converti}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prioritaires</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgente}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">Plus récents</SelectItem>
                <SelectItem value="created_date">Plus anciens</SelectItem>
                <SelectItem value="-priority">Priorité haute</SelectItem>
                <SelectItem value="priority">Priorité basse</SelectItem>
                <SelectItem value="status">Statut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card><CardContent className="p-6">Chargement...</CardContent></Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun lead trouvé
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => {
            const StatusIcon = statusConfig[lead.status]?.icon || AlertCircle;
            const product = products.find(p => p.id === lead.product_id);
            
            return (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {lead.contact_name || 'Prospect Sans Nom'}
                        </h3>
                        <Badge className={priorityConfig[lead.priority].color}>
                          {priorityConfig[lead.priority].label}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[lead.status].label}
                        </Badge>
                        {lead.source && (
                          <Badge variant="secondary">{lead.source}</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        {lead.contact_email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${lead.contact_email}`} className="hover:text-primary">
                              {lead.contact_email}
                            </a>
                          </div>
                        )}
                        {lead.contact_phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${lead.contact_phone}`} className="hover:text-primary">
                              {lead.contact_phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(lead.created_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      {(lead.rite || lead.obedience || lead.degree_order) && (
                        <div className="flex flex-wrap gap-2">
                          {lead.rite && <Badge variant="outline">Rite: {lead.rite}</Badge>}
                          {lead.obedience && <Badge variant="outline">Obédience: {lead.obedience}</Badge>}
                          {lead.degree_order && <Badge variant="outline">Degré: {lead.degree_order}</Badge>}
                        </div>
                      )}

                      {product && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Produit d'intérêt:</span>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      )}

                      <p className="text-sm bg-muted/50 p-3 rounded">
                        {lead.request_details}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Détails
                      </Button>

                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={lead.priority}
                        onValueChange={(value) => handlePriorityChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Lead</DialogTitle>
            <DialogDescription>
              Informations complètes et gestion du lead
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <Select
                    value={selectedLead.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedLead.id, value);
                      setSelectedLead({ ...selectedLead, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priorité</label>
                  <Select
                    value={selectedLead.priority}
                    onValueChange={(value) => {
                      handlePriorityChange(selectedLead.id, value);
                      setSelectedLead({ ...selectedLead, priority: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedLead.conversation_context && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Contexte de Conversation</label>
                  <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">
                    {selectedLead.conversation_context}
                  </pre>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Notes Admin</label>
                <Textarea
                  value={selectedLead.admin_notes || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, admin_notes: e.target.value })}
                  placeholder="Ajoutez des notes internes..."
                  rows={4}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => handleNotesUpdate(selectedLead.id, selectedLead.admin_notes)}
                >
                  Enregistrer les notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}