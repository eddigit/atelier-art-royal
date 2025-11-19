import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Save,
  Upload,
  Trash2,
  Image as ImageIcon,
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

export default function ObedienceEditDialog({ obedience, open, onClose, onSaved }) {
  const isNew = !obedience;
  const [formData, setFormData] = useState(obedience || {
    name: '',
    code: '',
    description: '',
    image_url: '',
    order: 0
  });
  const [uploading, setUploading] = useState(false);
  const [newObedienceId, setNewObedienceId] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-obedience-migration'],
    queryFn: () => base44.entities.Product.filter({ obedience_id: obedience?.id }),
    enabled: !isNew && open,
    initialData: []
  });

  const { data: allObediences = [] } = useQuery({
    queryKey: ['obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    enabled: !isNew && open,
    initialData: []
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isNew) {
        return base44.entities.Obedience.create(data);
      } else {
        return base44.entities.Obedience.update(obedience.id, data);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? 'Obédience créée' : 'Obédience mise à jour');
      onSaved();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Migrate products if new obedience is selected
      if (products.length > 0 && newObedienceId) {
        await Promise.all(
          products.map(p => 
            base44.entities.Product.update(p.id, { obedience_id: newObedienceId })
          )
        );
      }
      return base44.entities.Obedience.delete(obedience.id);
    },
    onSuccess: () => {
      toast.success('Obédience supprimée');
      onSaved();
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success('Image uploadée');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (products.length > 0 && !newObedienceId) {
      toast.error('Veuillez sélectionner une obédience de remplacement pour les produits liés');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette obédience ? ${products.length > 0 ? `${products.length} produit(s) seront basculés.` : ''}`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isNew ? 'Nouvelle Obédience' : 'Modifier l\'Obédience'}
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
                      {products.length} produit{products.length > 1 ? 's sont' : ' est'} lié{products.length > 1 ? 's' : ''} à cette obédience
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pour supprimer cette obédience, sélectionnez une obédience de remplacement :
                    </p>
                    <Select value={newObedienceId} onValueChange={setNewObedienceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une obédience" />
                      </SelectTrigger>
                      <SelectContent>
                        {allObediences
                          .filter(r => r.id !== obedience.id)
                          .map(obed => (
                            <SelectItem key={obed.id} value={obed.id}>
                              {obed.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image */}
          <Card>
            <CardContent className="pt-6">
              <Label>Image de l'Obédience</Label>
              <div className="mt-2 space-y-4">
                {formData.image_url ? (
                  <div className="relative group">
                    <img 
                      src={formData.image_url} 
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune image</p>
                    </div>
                  </div>
                )}
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'Obédience *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: GLNF"
                  />
                </div>
                <div>
                  <Label>Code Court *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: GLNF"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description de l'obédience..."
                  />
                </div>
                <div>
                  <Label>Ordre d'Affichage</Label>
                  <Input
                    type="number"
                    value={formData.order || 0}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Les obédiences sont affichées du plus petit au plus grand numéro
                  </p>
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