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
  Image as ImageIcon
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function RiteEditDialog({ rite, open, onClose, onSaved }) {
  const isNew = !rite;
  const [formData, setFormData] = useState(rite || {
    name: '',
    code: '',
    description: '',
    image_url: '',
    order: 0
  });
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isNew) {
        return base44.entities.Rite.create(data);
      } else {
        return base44.entities.Rite.update(rite.id, data);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? 'Rite créé' : 'Rite mis à jour');
      onSaved();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Rite.delete(rite.id),
    onSuccess: () => {
      toast.success('Rite supprimé');
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isNew ? 'Nouveau Rite' : 'Modifier le Rite'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <Card>
            <CardContent className="pt-6">
              <Label>Image du Rite</Label>
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
                <p className="text-xs text-muted-foreground">
                  Cette image sera affichée sur la page d'accueil pour permettre aux utilisateurs de commander par rite.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du Rite *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: REAA"
                  />
                </div>
                <div>
                  <Label>Code Court *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: REAA"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description du rite..."
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
                    Les rites sont affichés du plus petit au plus grand numéro
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
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce rite ?')) {
                      deleteMutation.mutate();
                    }
                  }}
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