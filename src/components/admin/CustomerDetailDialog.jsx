import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  ThumbsUp
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

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' },
    processing: { label: 'En cours', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
    shipped: { label: 'Expédiée', color: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
    delivered: { label: 'Livrée', color: 'bg-green-600/20 text-green-400 border-green-600/30' },
    cancelled: { label: 'Annulée', color: 'bg-red-600/20 text-red-400 border-red-600/30' }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Profil Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
                {customer.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{customer.full_name}</h3>
              <p className="text-muted-foreground mb-2">{customer.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  Inscrit le {new Date(customer.created_date).toLocaleDateString('fr-FR')}
                </Badge>
                <Badge variant="outline">
                  Role: {customer.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Commandes</span>
                </div>
                <p className="text-2xl font-bold">{customer.stats.orderCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Total Dépensé</span>
                </div>
                <p className="text-2xl font-bold">{customer.stats.totalSpent.toFixed(2)}€</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Panier Moyen</span>
                </div>
                <p className="text-2xl font-bold">{customer.stats.avgOrderValue.toFixed(2)}€</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="orders" className="flex-1">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Commandes ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Notes ({notes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune commande</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
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

            <TabsContent value="notes" className="space-y-4">
              {/* Add Note Form */}
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

              {/* Notes List */}
              {notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune note</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}