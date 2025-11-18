import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Account() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const u = await base44.auth.me();
      setFormData({
        full_name: u.full_name || '',
        email: u.email || ''
      });
      return u;
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success('Profil mis à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ full_name: formData.full_name });
  };

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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Mon Compte</h1>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {user.role === 'admin' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Statut Administrateur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Vous avez accès au panneau d'administration.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}