import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function DegreeOrderEditDialog({ degreeOrder, rites, open, onClose, onSaved }) {
  const isNew = !degreeOrder;
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    loge_type: 'Loge Symbolique',
    description: '',
    order: 0,
    ...degreeOrder
  });
  const [newDegreeOrderId, setNewDegreeOrderId] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-degree-migration'],
    queryFn: () => base44.entities.Product.filter({ degree_order_id: degreeOrder?.id }),
    enabled: !isNew && open,
    initialData: []
  });

  const { data: allDegreeOrders = [] } = useQuery({
    queryKey: ['degreeOrders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    enabled: !isNew && open,
    initialData: []
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isNew) {
        return base44.entities.DegreeOrder.create(data);
      } else {
        return base44.entities.DegreeOrder.update(degreeOrder.id, data);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? 'Degré & Ordre créé' : 'Degré & Ordre mis à jour');
      onSaved();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Migrate products if new degree is selected
      if (products.length > 0 && newDegreeOrderId) {
        await Promise.all(
          products.map(p => 
            base44.entities.Product.update(p.id, { degree_order_id: newDegreeOrderId })
          )
        );
      }
      return base44.entities.DegreeOrder.delete(degreeOrder.id);
    },
    onSuccess: () => {
      toast.success('Degré & Ordre supprimé');
      onSaved();
    }
  });

  const handleSave = () => {
    if (!formData.name || !formData.level || !formData.loge_type) {
      toast.error('Veuillez remplir tous les champs obligatoires (Nom, Niveau, Type de Loge)');
      return;
    }
    
    const dataToSave = {
      name: formData.name,
      level: parseInt(formData.level),
      loge_type: formData.loge_type,
      description: formData.description || '',
      order: parseInt(formData.order) || 0
    };
    
    saveMutation.mutate(dataToSave);
  };

  const handleDelete = () => {
    if (products.length > 0 && !newDegreeOrderId) {
      toast.error('Veuillez sélectionner un degré & ordre de remplacement pour les produits liés');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce degré & ordre ? ${products.length > 0 ? `${products.length} produit(s) seront basculés.` : ''}`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isNew ? 'Nouveau Degré & Ordre' : 'Modifier le Degré & Ordre'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Migration Warning */}
          {!isNew && products.length > 0 && (
            <Card className="border-yellow-600/30 bg-yellow-600/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-600 mb-2">
                      {products.length} produit{products.length > 1 ? 's sont' : ' est'} lié{products.length > 1 ? 's' : ''} à ce degré
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pour supprimer ce degré, sélectionnez un degré de remplacement :
                    </p>
                    <Select value={newDegreeOrderId} onValueChange={setNewDegreeOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un degré & ordre" />
                      </SelectTrigger>
                      <SelectContent>
                        {allDegreeOrders
                          .filter(d => d.id !== degreeOrder.id)
                          .map(deg => (
                            <SelectItem key={deg.id} value={deg.id}>
                              {deg.name} (Niveau {deg.level})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nom du Degré & Ordre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Apprenti, Compagnon, Maître..."
                  />
                </div>
                <div>
                  <Label>Niveau Hiérarchique *</Label>
                  <Input
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) || 1})}
                    placeholder="Ex: 1, 2, 3..."
                  />
                </div>
                <div>
                  <Label>Type de Loge *</Label>
                  <Select 
                    value={formData.loge_type || 'Loge Symbolique'} 
                    onValueChange={(v) => setFormData({...formData, loge_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Loge Symbolique">Loge Symbolique (1er - 3ème degré)</SelectItem>
                      <SelectItem value="Loge Hauts Grades">Loge Hauts Grades (4ème+ & Ordres)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description du degré & ordre..."
                  />
                </div>
                <div>
                  <Label>Ordre d'Affichage</Label>
                  <Input
                    type="number"
                    value={formData.order || 0}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {!isNew && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {isNew ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}