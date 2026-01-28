import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  AlertCircle,
  Edit,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import ObedienceEditDialog from '@/components/admin/ObedienceEditDialog';

export default function AdminObediences() {
  const queryClient = useQueryClient();
  const [selectedObedience, setSelectedObedience] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: obediences = [], isLoading } = useQuery({
    queryKey: ['admin-obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    initialData: [],
    enabled: !!user && user.role === 'admin'
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
    initialData: [],
    enabled: !!user && user.role === 'admin'
  });

  const getProductCount = (obedienceId) => {
    return products.filter(p => p.obedience_id === obedienceId).length;
  };

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold mb-2">Gestion des Obédiences</h1>
          <p className="text-muted-foreground">
            {obediences.length} obédience{obediences.length > 1 ? 's' : ''} configurée{obediences.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Obédience
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Obédiences</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : obediences.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune obédience configurée</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {obediences.map((obedience) => (
                <Card key={obedience.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                  <div className="aspect-video relative bg-muted">
                    {obedience.image_url ? (
                      <img 
                        src={obedience.image_url} 
                        alt={obedience.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur">
                        {obedience.code}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2">{obedience.name}</h3>
                    {obedience.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {obedience.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">
                        Ordre: {obedience.order || 0}
                      </Badge>
                      <Badge className="bg-primary/20 text-primary">
                        {getProductCount(obedience.id)} produit{getProductCount(obedience.id) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedObedience(obedience)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {(selectedObedience || showNewDialog) && (
        <ObedienceEditDialog
          obedience={selectedObedience}
          open={!!(selectedObedience || showNewDialog)}
          onClose={() => {
            setSelectedObedience(null);
            setShowNewDialog(false);
          }}
          onSaved={() => {
            queryClient.invalidateQueries(['admin-obediences']);
            queryClient.invalidateQueries(['obediences']);
            setSelectedObedience(null);
            setShowNewDialog(false);
          }}
        />
      )}
    </div>
  );
}