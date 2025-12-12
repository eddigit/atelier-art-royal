import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProductAIAssistant from './ProductAIAssistant';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function ProductEditDialogFull({ product, open, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(product || {
    sizes: [],
    colors: [],
    materials: []
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

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

  const { data: obediences = [] } = useQuery({
    queryKey: ['obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    initialData: []
  });

  const { data: degreeOrders = [] } = useQuery({
    queryKey: ['degreeOrders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    initialData: []
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newImages = [...(formData.images || []), file_url];
      setFormData({ ...formData, images: newImages });
      toast.success('Image ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const addSize = () => {
    if (newSize && !formData.sizes?.includes(newSize)) {
      setFormData({ ...formData, sizes: [...(formData.sizes || []), newSize] });
      setNewSize('');
    }
  };

  const removeSize = (size) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (newColor && !formData.colors?.includes(newColor)) {
      setFormData({ ...formData, colors: [...(formData.colors || []), newColor] });
      setNewColor('');
    }
  };

  const removeColor = (color) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  const addMaterial = () => {
    if (newMaterial && !formData.materials?.includes(newMaterial)) {
      setFormData({ ...formData, materials: [...(formData.materials || []), newMaterial] });
      setNewMaterial('');
    }
  };

  const removeMaterial = (material) => {
    setFormData({ ...formData, materials: formData.materials.filter(m => m !== material) });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.rite_id || !formData.degree_order_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      if (product) {
        await base44.entities.Product.update(product.id, formData);
        toast.success('Produit mis à jour');
      } else {
        await base44.entities.Product.create(formData);
        toast.success('Produit créé');
      }
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['products-for-filters']);
      onSaved();
      onClose();
    } catch (error) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Éditer le produit' : 'Nouveau produit'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Assistant */}
          <ProductAIAssistant 
            product={formData}
            onApply={(aiData) => setFormData({ ...formData, ...aiData })}
          />

          {/* Images */}
          <div>
            <label className="text-sm font-medium">Images du produit</label>
            <div className="grid grid-cols-5 gap-4 mt-2">
              {formData.images?.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              <label className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Ajouter</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nom du produit *</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">SKU</label>
              <Input
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Rite, Obedience, Degree & Order, Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Rite *</label>
              <Select 
                value={formData.rite_id || ''} 
                onValueChange={(v) => setFormData({ ...formData, rite_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un rite" />
                </SelectTrigger>
                <SelectContent>
                  {rites.map(rite => (
                    <SelectItem key={rite.id} value={rite.id}>
                      {rite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Obédiences (plusieurs possibles)</label>
              <div className="mt-1 border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {obediences.map(obedience => (
                  <div key={obedience.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.obedience_ids || []).includes(obedience.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = formData.obedience_ids || [];
                        const newIds = checked
                          ? [...currentIds, obedience.id]
                          : currentIds.filter(id => id !== obedience.id);
                        setFormData({ ...formData, obedience_ids: newIds });
                      }}
                    />
                    <label className="text-sm cursor-pointer">{obedience.name}</label>
                  </div>
                ))}
              </div>
              {(formData.obedience_ids || []).length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {formData.obedience_ids.map(id => {
                    const obedience = obediences.find(o => o.id === id);
                    return obedience ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {obedience.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              obedience_ids: formData.obedience_ids.filter(oid => oid !== id) 
                            });
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Degré & Ordre *</label>
              <Select 
                value={formData.degree_order_id || ''} 
                onValueChange={(v) => setFormData({ ...formData, degree_order_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un degré" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary">Loge Symbolique</div>
                  {degreeOrders.filter(d => d.loge_type === 'Loge Symbolique').map(degree => (
                    <SelectItem key={degree.id} value={degree.id}>
                      {degree.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary mt-2">Loge Hauts Grades</div>
                  {degreeOrders.filter(d => d.loge_type === 'Loge Hauts Grades').map(degree => (
                    <SelectItem key={degree.id} value={degree.id}>
                      {degree.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Catégorie</label>
              <Select 
                value={formData.category_id || ''} 
                onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Prix (€) *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prix comparaison (€)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.compare_at_price || ''}
                onChange={(e) => setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Stock</label>
              <Input
                type="number"
                value={formData.stock_quantity || 0}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Seuil stock faible</label>
              <Input
                type="number"
                value={formData.low_stock_threshold || 5}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-sm font-medium">Tailles disponibles</label>
            <div className="flex gap-2 mt-2 mb-2 flex-wrap">
              {formData.sizes?.map((size, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {size}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeSize(size)} 
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Ex: S, M, L, 42, 44..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
              />
              <Button type="button" onClick={addSize} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-sm font-medium">Couleurs disponibles</label>
            <div className="flex gap-2 mt-2 mb-2 flex-wrap">
              {formData.colors?.map((color, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {color}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeColor(color)} 
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Ex: Or, Argent, Noir..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
              />
              <Button type="button" onClick={addColor} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="text-sm font-medium">Matières disponibles</label>
            <div className="flex gap-2 mt-2 mb-2 flex-wrap">
              {formData.materials?.map((material, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {material}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeMaterial(material)} 
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Ex: Soie, Velours, Coton..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
              />
              <Button type="button" onClick={addMaterial} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="text-sm font-medium">Description courte</label>
            <Textarea
              value={formData.short_description || ''}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_active !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <label className="text-sm font-medium">Actif</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.featured || false}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <label className="text-sm font-medium">Mis en avant</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.allow_backorders !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, allow_backorders: checked })}
              />
              <label className="text-sm font-medium">Autoriser vente si rupture</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}