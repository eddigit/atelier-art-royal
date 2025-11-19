import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Calendar, Save, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Account() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: ''
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const u = await base44.auth.me();
      setFormData({ full_name: u.full_name || '' });
      return u;
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Order.filter({ customer_id: user.id }, '-created_date', 5);
    },
    enabled: !!user,
    initialData: []
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setIsEditing(false);
      toast.success('Profil mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries(['user']);
      toast.success('Photo de profil mise à jour');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 w-full" />
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connectez-vous pour accéder à votre compte</h2>
        <Button onClick={() => base44.auth.redirectToLogin()}>
          Se connecter
        </Button>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mon Compte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative group">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                  )}
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nom complet</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{user.full_name || 'Non renseigné'}</p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{user.email}</p>
                  </div>
                </div>

                <div>
                  <Label>Membre depuis</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">
                      {format(new Date(user.created_date), 'MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ full_name: user.full_name || '' });
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier le profil
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{orders.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Commandes</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalSpent.toFixed(0)}€</p>
                  <p className="text-sm text-muted-foreground mt-1">Dépensé</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {user.role === 'admin' ? 'Admin' : 'Client'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Statut</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune commande
                </p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{order.total.toFixed(2)}€</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}