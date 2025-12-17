import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProductEditDialog({ product, open, onClose, onSaved }) {
  const [formData, setFormData] = useState(product || {});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    // Validation
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Le nom du produit est requis', {
        duration: 4000
      });
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Le prix doit être supérieur à 0', {
        duration: 4000
      });
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Product.update(product.id, formData);
      toast.success('✓ Produit mis à jour avec succès', {
        description: `"${formData.name}" a été modifié.`,
        duration: 3000
      });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Éditer le produit</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Images */}
          <div>
            <label className="text-sm font-medium">Images du produit</label>
            <div className="grid grid-cols-4 gap-4 mt-2">
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
              <label className="text-sm font-medium">Nom du produit</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Prix (€)</label>
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
                checked={formData.is_active || false}
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