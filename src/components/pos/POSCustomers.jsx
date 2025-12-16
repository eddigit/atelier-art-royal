import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Mail, Phone, MapPin, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function POSCustomers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data) => {
      // Appel à la fonction backend pour créer le client
      const response = await base44.functions.invoke('createBackendCustomer', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-customers'] });
      toast.success('Client créé avec succès !');
      setDialogOpen(false);
      setFormData({ full_name: '', email: '', phone: '', address: '' });
    },
    onError: (error) => {
      toast.error('Erreur : ' + error.message);
    }
  });

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      toast.error('Nom et email sont obligatoires');
      return;
    }
    createCustomerMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-16 h-16 text-xl border-2"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 px-8 text-xl ml-4">
              <Plus className="w-6 h-6 mr-3" />
              Nouveau Client
            </Button>
          </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Créer un nouveau client</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="full_name" className="text-lg">Nom complet *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Jean Dupont"
                      className="h-14 text-lg mt-2 border-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-lg">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="jean.dupont@email.com"
                      className="h-14 text-lg mt-2 border-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-lg">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+33 6 12 34 56 78"
                      className="h-14 text-lg mt-2 border-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-lg">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Rue de la Paix, Paris"
                      className="h-14 text-lg mt-2 border-2"
                    />
                  </div>
                  <Button type="submit" className="w-full h-16 text-xl" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? 'Création...' : 'Créer le client'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-card border-2 border-border rounded-2xl p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl mb-3 truncate">{customer.full_name}</h3>
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center gap-3 text-base text-muted-foreground">
                      <Mail className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-3 text-base text-muted-foreground">
                      <Phone className="w-5 h-5 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t-2">
                  <span className="text-sm text-muted-foreground">
                    Client depuis {new Date(customer.created_date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}