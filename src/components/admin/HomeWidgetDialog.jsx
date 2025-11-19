import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

export default function HomeWidgetDialog({ widget, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    widget_type: 'promotions',
    title: '',
    subtitle: '',
    is_active: true,
    display_order: 0,
    config: {}
  });

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products-widget'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '-created_date', 200),
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 100),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 100),
    initialData: []
  });

  useEffect(() => {
    if (widget) {
      setFormData(widget);
    } else {
      setFormData({
        widget_type: 'promotions',
        title: '',
        subtitle: '',
        is_active: true,
        display_order: 0,
        config: {}
      });
    }
  }, [widget, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (widget) {
        return base44.entities.HomeWidget.update(widget.id, data);
      }
      return base44.entities.HomeWidget.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['home-widgets']);
      toast.success(widget ? 'Widget mis à jour' : 'Widget créé');
      onOpenChange(false);
    }
  });

  const handleSave = () => {
    if (!formData.title) {
      toast.error('Le titre est requis');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        config: { ...prev.config, banner_image: file_url }
      }));
      toast.success('Image uploadée');
    } catch (error) {
      toast.error('Erreur upload image');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {widget ? 'Modifier le Widget' : 'Nouveau Widget'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type de Widget</Label>
            <Select
              value={formData.widget_type}
              onValueChange={(v) => setFormData({ ...formData, widget_type: v, config: {} })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promotions">Promotions</SelectItem>
                <SelectItem value="nouveautes">Nouveautés</SelectItem>
                <SelectItem value="featured_products">Produits Mis en Avant</SelectItem>
                <SelectItem value="banner">Bannière</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Promotions du moment"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label>Sous-titre</Label>
            <Input
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Ex: Profitez de nos offres exceptionnelles"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <label htmlFor="active" className="text-sm font-medium cursor-pointer">
              Widget actif
            </label>
          </div>

          {/* Config based on type */}
          {(formData.widget_type === 'promotions' || formData.widget_type === 'nouveautes' || formData.widget_type === 'featured_products') && (
            <>
              <div className="space-y-2">
                <Label>Nombre de produits à afficher</Label>
                <Input
                  type="number"
                  value={formData.config?.limit || 8}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, limit: parseInt(e.target.value) }
                  })}
                />
              </div>

              {formData.widget_type === 'featured_products' && (
                <>
                  <div className="space-y-2">
                    <Label>Filtrer par Rite (optionnel)</Label>
                    <Select
                      value={formData.config?.rite_id || 'all'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        config: { ...formData.config, rite_id: v === 'all' ? undefined : v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les rites" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les rites</SelectItem>
                        {rites.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Filtrer par Catégorie (optionnel)</Label>
                    <Select
                      value={formData.config?.category_id || 'all'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        config: { ...formData.config, category_id: v === 'all' ? undefined : v }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          {formData.widget_type === 'banner' && (
            <>
              <div className="space-y-2">
                <Label>Image de la bannière</Label>
                {formData.config?.banner_image ? (
                  <div className="relative">
                    <img 
                      src={formData.config.banner_image} 
                      alt="Banner" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({
                        ...formData,
                        config: { ...formData.config, banner_image: undefined }
                      })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Lien de la bannière</Label>
                <Input
                  value={formData.config?.banner_link || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, banner_link: e.target.value }
                  })}
                  placeholder="Ex: /catalog?showPromotions=true"
                />
              </div>

              <div className="space-y-2">
                <Label>Texte du bouton CTA</Label>
                <Input
                  value={formData.config?.banner_cta || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, banner_cta: e.target.value }
                  })}
                  placeholder="Ex: Découvrir les promotions"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}