import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Save,
  Upload,
  Trash2,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function ProductionDetailDialog({ production, customers, open, onClose, onSaved }) {
  const isNew = !production;
  const [formData, setFormData] = useState(production || {
    customer_id: '',
    product_name: '',
    status: 'en_attente',
    priority: 'normale',
    specifications: '',
    design_images: [],
    due_date: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isNew) {
        return base44.entities.ProductionItem.create(data);
      } else {
        return base44.entities.ProductionItem.update(production.id, data);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? 'Projet créé' : 'Projet mis à jour');
      onSaved();
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ProductionItem.delete(production.id),
    onSuccess: () => {
      toast.success('Projet supprimé');
      onSaved();
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const currentImages = formData.design_images || [];
      setFormData({
        ...formData,
        design_images: [...currentImages, file_url]
      });
      toast.success('Image uploadée');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...(formData.design_images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, design_images: newImages });
  };

  const handleSave = () => {
    if (!formData.customer_id || !formData.product_name) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    saveMutation.mutate(formData);
  };

  const statusConfig = {
    en_attente: { label: 'En Attente', color: 'bg-gray-600/20 text-gray-400' },
    en_design: { label: 'En Design', color: 'bg-blue-600/20 text-blue-400' },
    en_fabrication: { label: 'En Fabrication', color: 'bg-yellow-600/20 text-yellow-400' },
    terminee: { label: 'Terminée', color: 'bg-green-600/20 text-green-400' },
    livree: { label: 'Livrée', color: 'bg-purple-600/20 text-purple-400' }
  };

  const priorityConfig = {
    basse: { label: 'Basse', color: 'bg-gray-600/20 text-gray-400' },
    normale: { label: 'Normale', color: 'bg-blue-600/20 text-blue-400' },
    haute: { label: 'Haute', color: 'bg-orange-600/20 text-orange-400' },
    urgente: { label: 'Urgente', color: 'bg-red-600/20 text-red-400' }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isNew ? 'Nouveau Projet de Production' : 'Détails du Projet'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Client *</Label>
                  <Select 
                    value={formData.customer_id}
                    onValueChange={(v) => setFormData({...formData, customer_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {customer.full_name || customer.lodge_name || customer.email}
                            {customer.lodge_name && customer.full_name && (
                              <span className="text-xs text-muted-foreground">
                                ({customer.lodge_name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Nom du Produit *</Label>
                  <Input
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    placeholder="Ex: Tablier sur mesure REAA 33ème degré"
                  />
                </div>

                <div>
                  <Label>Statut</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(v) => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <Badge className={config.color}>{config.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priorité</Label>
                  <Select 
                    value={formData.priority}
                    onValueChange={(v) => setFormData({...formData, priority: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <Badge className={config.color}>{config.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Date de Livraison Prévue</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.due_date || ''}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Cahier des Charges</Label>
                <Textarea
                  rows={6}
                  value={formData.specifications || ''}
                  onChange={(e) => setFormData({...formData, specifications: e.target.value})}
                  placeholder="Détails techniques, dimensions, matériaux, spécificités..."
                />
              </div>

              {selectedCustomer?.custom_specifications && (
                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Spécifications Client
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedCustomer.custom_specifications}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Images et Dessins du Projet</Label>
                <div className="mt-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                  />
                </div>
              </div>

              {formData.design_images?.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.design_images.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={url} 
                        alt={`Design ${idx + 1}`} 
                        className="w-full h-40 object-cover rounded border" 
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomer?.custom_images?.length > 0 && (
                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Images Client</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedCustomer.custom_images.map((url, idx) => (
                      <img 
                        key={idx}
                        src={url} 
                        alt={`Client ${idx + 1}`} 
                        className="w-full h-32 object-cover rounded border" 
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6">
              <Label>Notes Internes</Label>
              <Textarea
                rows={4}
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes et commentaires internes pour l'équipe de production..."
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {!isNew && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
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