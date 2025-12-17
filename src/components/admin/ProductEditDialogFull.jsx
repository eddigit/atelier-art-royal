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
    // Validation détaillée
    const missingFields = [];
    if (!formData.name || formData.name.trim() === '') missingFields.push('Nom du produit');
    if (!formData.price || formData.price <= 0) missingFields.push('Prix');
    
    if (missingFields.length > 0) {
      toast.error(`Champs manquants : ${missingFields.join(', ')}`, {
        description: 'Veuillez remplir tous les champs obligatoires pour continuer.',
        duration: 5000
      });
      return;
    }

    setSaving(true);
    try {
      if (product?.id) {
        await base44.entities.Product.update(product.id, formData);
        toast.success('✓ Produit mis à jour avec succès', {
          description: `Le produit "${formData.name}" a été modifié.`,
          duration: 3000
        });
      } else {
        await base44.entities.Product.create(formData);
        toast.success('✓ Produit créé avec succès', {
          description: `Le produit "${formData.name}" a été ajouté au catalogue.`,
          duration: 3000
        });
      }
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['products-for-filters']);
      onSaved();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement', {
        description: error.message,
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{product?.id ? 'Éditer le produit' : 'Nouveau produit'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
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
              <label className="text-sm font-medium">Rites (plusieurs possibles)</label>
              <div className="mt-1 border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {rites.map(rite => (
                  <div key={rite.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.rite_ids || []).includes(rite.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = formData.rite_ids || [];
                        const newIds = checked
                          ? [...currentIds, rite.id]
                          : currentIds.filter(id => id !== rite.id);
                        setFormData({ ...formData, rite_ids: newIds });
                      }}
                    />
                    <label className="text-sm cursor-pointer">{rite.name}</label>
                  </div>
                ))}
              </div>
              {(formData.rite_ids || []).length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {formData.rite_ids.map(id => {
                    const rite = rites.find(r => r.id === id);
                    return rite ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {rite.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              rite_ids: formData.rite_ids.filter(rid => rid !== id) 
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
              <label className="text-sm font-medium">Degrés & Ordres (plusieurs possibles)</label>
              <div className="mt-1 border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                <div className="px-2 py-1 text-xs font-semibold text-primary">Loge Symbolique</div>
                {degreeOrders.filter(d => d.loge_type === 'Loge Symbolique').map(degree => (
                  <div key={degree.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.degree_order_ids || []).includes(degree.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = formData.degree_order_ids || [];
                        const newIds = checked
                          ? [...currentIds, degree.id]
                          : currentIds.filter(id => id !== degree.id);
                        setFormData({ ...formData, degree_order_ids: newIds });
                      }}
                    />
                    <label className="text-sm cursor-pointer">{degree.name}</label>
                  </div>
                ))}
                <div className="px-2 py-1 text-xs font-semibold text-primary mt-2">Loge Hauts Grades</div>
                {degreeOrders.filter(d => d.loge_type === 'Loge Hauts Grades').map(degree => (
                  <div key={degree.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.degree_order_ids || []).includes(degree.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = formData.degree_order_ids || [];
                        const newIds = checked
                          ? [...currentIds, degree.id]
                          : currentIds.filter(id => id !== degree.id);
                        setFormData({ ...formData, degree_order_ids: newIds });
                      }}
                    />
                    <label className="text-sm cursor-pointer">{degree.name}</label>
                  </div>
                ))}
              </div>
              {(formData.degree_order_ids || []).length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {formData.degree_order_ids.map(id => {
                    const degree = degreeOrders.find(d => d.id === id);
                    return degree ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {degree.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              degree_order_ids: formData.degree_order_ids.filter(did => did !== id) 
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
              <label className="text-sm font-medium">Catégories (plusieurs possibles)</label>
              <div className="mt-1 border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={(formData.category_ids || []).includes(category.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = formData.category_ids || [];
                        const newIds = checked
                          ? [...currentIds, category.id]
                          : currentIds.filter(id => id !== category.id);
                        setFormData({ ...formData, category_ids: newIds });
                      }}
                    />
                    <label className="text-sm cursor-pointer">{category.name}</label>
                  </div>
                ))}
              </div>
              {(formData.category_ids || []).length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {formData.category_ids.map(id => {
                    const category = categories.find(c => c.id === id);
                    return category ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {category.name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              category_ids: formData.category_ids.filter(cid => cid !== id) 
                            });
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
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