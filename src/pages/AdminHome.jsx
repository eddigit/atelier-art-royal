import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, EyeOff, Edit, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import HomeWidgetDialog from '@/components/admin/HomeWidgetDialog';

export default function AdminHome() {
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['home-widgets'],
    queryFn: () => base44.entities.HomeWidget.list('display_order', 100),
    initialData: []
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.HomeWidget.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['home-widgets']);
      toast.success('Widget mis à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeWidget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['home-widgets']);
      toast.success('Widget supprimé');
    }
  });

  const handleEdit = (widget) => {
    setSelectedWidget(widget);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedWidget(null);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
      deleteMutation.mutate(id);
    }
  };

  const widgetTypeLabels = {
    promotions: 'Promotions',
    nouveautes: 'Nouveautés',
    featured_products: 'Produits Mis en Avant',
    banner: 'Bannière'
  };

  const widgetTypeColors = {
    promotions: 'bg-red-100 text-red-800',
    nouveautes: 'bg-blue-100 text-blue-800',
    featured_products: 'bg-purple-100 text-purple-800',
    banner: 'bg-green-100 text-green-800'
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Accès Refusé</h2>
        <p className="text-muted-foreground">Vous devez être administrateur</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion Page d'Accueil</h1>
          <p className="text-muted-foreground">
            Configurez les widgets et promotions de la page d'accueil
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Widget
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {widgets.filter(w => w.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Promotions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {widgets.filter(w => w.widget_type === 'promotions').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nouveautés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {widgets.filter(w => w.widget_type === 'nouveautes').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets List */}
      <Card>
        <CardHeader>
          <CardTitle>Widgets Configurés</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : widgets.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun widget configuré</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier widget pour la page d'accueil
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un Widget
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{widget.title}</h3>
                      <Badge className={widgetTypeColors[widget.widget_type]}>
                        {widgetTypeLabels[widget.widget_type]}
                      </Badge>
                      {!widget.is_active && (
                        <Badge variant="outline">Inactif</Badge>
                      )}
                    </div>
                    {widget.subtitle && (
                      <p className="text-sm text-muted-foreground">{widget.subtitle}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Ordre: {widget.display_order}</span>
                      {widget.config?.limit && (
                        <span>Limite: {widget.config.limit} produits</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActiveMutation.mutate({ 
                        id: widget.id, 
                        is_active: !widget.is_active 
                      })}
                    >
                      {widget.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(widget)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(widget.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <HomeWidgetDialog
        widget={selectedWidget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}