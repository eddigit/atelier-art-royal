import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award,
  AlertCircle,
  Edit,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import RiteEditDialog from '@/components/admin/RiteEditDialog';

export default function AdminRites() {
  const queryClient = useQueryClient();
  const [selectedRite, setSelectedRite] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: rites = [], isLoading } = useQuery({
    queryKey: ['admin-rites'],
    queryFn: () => base44.entities.Rite.list('order', 100),
    initialData: []
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
          <h1 className="text-4xl font-bold mb-2">Gestion des Rites</h1>
          <p className="text-muted-foreground">
            {rites.length} rite{rites.length > 1 ? 's' : ''} configuré{rites.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Rite
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Rites</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : rites.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun rite configuré</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rites.map((rite) => (
                <Card key={rite.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                  <div className="aspect-video relative bg-muted">
                    {rite.image_url ? (
                      <img 
                        src={rite.image_url} 
                        alt={rite.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur">
                        {rite.code}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2">{rite.name}</h3>
                    {rite.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {rite.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        Ordre: {rite.order || 0}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRite(rite)}
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
      {(selectedRite || showNewDialog) && (
        <RiteEditDialog
          rite={selectedRite}
          open={!!(selectedRite || showNewDialog)}
          onClose={() => {
            setSelectedRite(null);
            setShowNewDialog(false);
          }}
          onSaved={() => {
            queryClient.invalidateQueries(['admin-rites']);
            queryClient.invalidateQueries(['rites']);
            setSelectedRite(null);
            setShowNewDialog(false);
          }}
        />
      )}
    </div>
  );
}