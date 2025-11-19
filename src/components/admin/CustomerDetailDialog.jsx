import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  ThumbsUp,
  User,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Upload,
  Image as ImageIcon,
  Save,
  Edit
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const noteTypeConfig = {
  general: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-600/20', border: 'border-blue-600/30', label: 'Général' },
  important: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-600/20', border: 'border-orange-600/30', label: 'Important' },
  warning: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-600/20', border: 'border-red-600/30', label: 'Attention' },
  positive: { icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-600/20', border: 'border-green-600/30', label: 'Positif' }
};

export default function CustomerDetailDialog({ customer, orders, notes, open, onClose, onNoteSaved }) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState(customer);
  const [uploading, setUploading] = useState(false);

  const updateCustomerMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-customers']);
      toast.success('Profil mis à jour');
      setIsEditing(false);
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.CustomerNote.create(noteData),
    onSuccess: () => {
      setNewNote('');
      setNoteType('general');
      onNoteSaved();
      toast.success('Note ajoutée');
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => base44.entities.CustomerNote.delete(noteId),
    onSuccess: () => {
      onNoteSaved();
      toast.success('Note supprimée');
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({
      customer_id: customer.id,
      note: newNote,
      note_type: noteType
    });
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (field === 'custom_images') {
        const currentImages = editedCustomer.custom_images || [];
        setEditedCustomer({
          ...editedCustomer,
          custom_images: [...currentImages, file_url]
        });
      } else {
        setEditedCustomer({
          ...editedCustomer,
          [field]: file_url
        });
      }
      toast.success('Fichier uploadé');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateCustomerMutation.mutate(editedCustomer);
  };

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' },
    processing: { label: 'En cours', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
    shipped: { label: 'Expédiée', color: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
    delivered: { label: 'Livrée', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
    cancelled: { label: 'Annulée', color: 'bg-red-600/20 text-red-400 border-red-600/30' }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Fiche Client</DialogTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={updateCustomerMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-2" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="w-4 h-4 mr-2" />
              Adresses
            </TabsTrigger>
            <TabsTrigger value="custom">
              <FileText className="w-4 h-4 mr-2" />
              Sur Mesure
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Commandes ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notes ({notes.length})
            </TabsTrigger>
          </TabsList>

          {/* Informations Générales */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type de Client</Label>
                    {isEditing ? (
                      <Select 
                        value={editedCustomer.customer_type || 'particulier'}
                        onValueChange={(v) => setEditedCustomer({...editedCustomer, customer_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="particulier">Particulier (Frère)</SelectItem>
                          <SelectItem value="loge">Loge</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm mt-1">
                        {customer.customer_type === 'loge' ? 'Loge' : 'Particulier (Frère)'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Acheteur
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.first_name || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, first_name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.first_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Nom</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.last_name || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, last_name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.last_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm mt-1">{customer.email}</p>
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.phone || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, phone: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.phone || '-'}</p>
                      )}
                    </div>
                    {isEditing && (
                      <div className="col-span-2">
                        <Label>Photo du contact</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo_url')} disabled={uploading} />
                          {editedCustomer.photo_url && (
                            <img src={editedCustomer.photo_url} alt="Photo" className="w-12 h-12 rounded-full object-cover" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informations Loge
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Numéro de Loge</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.lodge_number || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, lodge_number: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.lodge_number || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Nom de la Loge</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.lodge_name || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, lodge_name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.lodge_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Pays de la Loge</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.lodge_country || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, lodge_country: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.lodge_country || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Email de la Loge</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.lodge_email || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, lodge_email: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.lodge_email || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Téléphone de la Loge</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.lodge_phone || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, lodge_phone: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.lodge_phone || '-'}</p>
                      )}
                    </div>
                    {isEditing && (
                      <div>
                        <Label>Logo de la Loge</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'lodge_logo_url')} disabled={uploading} />
                          {editedCustomer.lodge_logo_url && (
                            <img src={editedCustomer.lodge_logo_url} alt="Logo" className="w-12 h-12 rounded object-cover" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Paiement & Source
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mode de Règlement</Label>
                      {isEditing ? (
                        <Select 
                          value={editedCustomer.payment_method || ''}
                          onValueChange={(v) => setEditedCustomer({...editedCustomer, payment_method: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="virement">Virement</SelectItem>
                            <SelectItem value="carte_bancaire">Carte Bancaire</SelectItem>
                            <SelectItem value="cheque">Chèque</SelectItem>
                            <SelectItem value="espece">Espèce sur place</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm mt-1">{customer.payment_method || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Source de Connaissance</Label>
                      {isEditing ? (
                        <Select 
                          value={editedCustomer.acquisition_source || ''}
                          onValueChange={(v) => setEditedCustomer({...editedCustomer, acquisition_source: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_tenue">En Tenue</SelectItem>
                            <SelectItem value="salon">Sur Salon</SelectItem>
                            <SelectItem value="apporteur_affaires">Apporteur d'Affaires</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm mt-1">{customer.acquisition_source || '-'}</p>
                      )}
                    </div>
                    {isEditing && (
                      <div className="col-span-2">
                        <Label>Détails Source</Label>
                        <Input
                          value={editedCustomer.acquisition_details || ''}
                          onChange={(e) => setEditedCustomer({...editedCustomer, acquisition_details: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adresses */}
          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Adresse de Livraison</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Rue</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.shipping_address?.street || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            shipping_address: {...(editedCustomer.shipping_address || {}), street: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.shipping_address?.street || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Ville</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.shipping_address?.city || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            shipping_address: {...(editedCustomer.shipping_address || {}), city: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.shipping_address?.city || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Code Postal</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.shipping_address?.postal_code || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            shipping_address: {...(editedCustomer.shipping_address || {}), postal_code: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.shipping_address?.postal_code || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Pays</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.shipping_address?.country || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            shipping_address: {...(editedCustomer.shipping_address || {}), country: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.shipping_address?.country || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Adresse de Facturation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Rue</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.billing_address?.street || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            billing_address: {...(editedCustomer.billing_address || {}), street: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.billing_address?.street || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Ville</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.billing_address?.city || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            billing_address: {...(editedCustomer.billing_address || {}), city: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.billing_address?.city || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Code Postal</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.billing_address?.postal_code || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            billing_address: {...(editedCustomer.billing_address || {}), postal_code: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.billing_address?.postal_code || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Pays</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.billing_address?.country || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            billing_address: {...(editedCustomer.billing_address || {}), country: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.billing_address?.country || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Coordonnées Bancaires</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>IBAN</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.bank_details?.iban || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            bank_details: {...(editedCustomer.bank_details || {}), iban: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.bank_details?.iban || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>BIC</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.bank_details?.bic || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            bank_details: {...(editedCustomer.bank_details || {}), bic: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.bank_details?.bic || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Nom de la Banque</Label>
                      {isEditing ? (
                        <Input
                          value={editedCustomer.bank_details?.bank_name || ''}
                          onChange={(e) => setEditedCustomer({
                            ...editedCustomer,
                            bank_details: {...(editedCustomer.bank_details || {}), bank_name: e.target.value}
                          })}
                        />
                      ) : (
                        <p className="text-sm mt-1">{customer.bank_details?.bank_name || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sur Mesure */}
          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label>Particularités des Tenus et Accessoires</Label>
                  {isEditing ? (
                    <Textarea
                      rows={4}
                      value={editedCustomer.lodge_specifications || ''}
                      onChange={(e) => setEditedCustomer({...editedCustomer, lodge_specifications: e.target.value})}
                      placeholder="Détails spécifiques pour la loge..."
                    />
                  ) : (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{customer.lodge_specifications || '-'}</p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <Label>Cahier des Charges Sur Mesure</Label>
                  {isEditing ? (
                    <Textarea
                      rows={6}
                      value={editedCustomer.custom_specifications || ''}
                      onChange={(e) => setEditedCustomer({...editedCustomer, custom_specifications: e.target.value})}
                      placeholder="Spécifications détaillées pour fabrications sur mesure..."
                    />
                  ) : (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{customer.custom_specifications || '-'}</p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <Label>Photos et Logos pour Fabrication</Label>
                  {isEditing && (
                    <div className="mt-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'custom_images')} 
                        disabled={uploading}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {(editedCustomer.custom_images || customer.custom_images || []).map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-32 object-cover rounded border" />
                        {isEditing && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              const newImages = [...(editedCustomer.custom_images || [])];
                              newImages.splice(idx, 1);
                              setEditedCustomer({...editedCustomer, custom_images: newImages});
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {(!customer.custom_images || customer.custom_images.length === 0) && !isEditing && (
                    <p className="text-sm text-muted-foreground mt-2">Aucune image</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commandes */}
          <TabsContent value="orders" className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune commande</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">#{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{order.total?.toFixed(2)}€</p>
                          <Badge className={statusConfig[order.status]?.color}>
                            {statusConfig[order.status]?.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(noteTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className={`w-4 h-4 ${config.color}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Ajouter une note sur ce client..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter la note
                  </Button>
                </div>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune note</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const config = noteTypeConfig[note.note_type] || noteTypeConfig.general;
                  const NoteIcon = config.icon;
                  
                  return (
                    <Card key={note.id} className={`border ${config.border}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <NoteIcon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm mb-2">{note.note}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(note.created_date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}