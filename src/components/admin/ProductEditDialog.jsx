import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
    setSaving(true);
    try {
      await base44.entities.Product.update(product.id, formData);
      toast.success('Produit mis à jour');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Éditer le produit</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Images */}
          <div>
            <Label>Images du produit</Label>
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
              <Label>Nom du produit</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prix (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Prix comparaison (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.compare_at_price || ''}
                onChange={(e) => setFormData({ ...formData, compare_at_price: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.stock_quantity || 0}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Seuil stock faible</Label>
              <Input
                type="number"
                value={formData.low_stock_threshold || 5}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Description courte</Label>
            <Textarea
              value={formData.short_description || ''}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Actif</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.featured || false}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label>Mis en avant</Label>
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