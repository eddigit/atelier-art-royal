import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Mail, Phone, MapPin, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function POSCustomers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    },
    lodge_number: '',
    lodge_name: '',
    lodge_city: '',
    rite_id: '',
    obedience_id: '',
    degree_order_id: '',
    customer_source: 'pos'
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
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
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', postal_code: '', country: 'France' },
        lodge_number: '',
        lodge_name: '',
        lodge_city: '',
        rite_id: '',
        obedience_id: '',
        degree_order_id: '',
        customer_source: 'pos'
      });
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
                  <div className="space-y-4">
                    <Label className="text-lg">Adresse</Label>
                    <Input
                      placeholder="Rue"
                      value={formData.address.street}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                      className="h-14 text-lg border-2"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Code postal"
                        value={formData.address.postal_code}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, postal_code: e.target.value}})}
                        className="h-14 text-lg border-2"
                      />
                      <Input
                        placeholder="Ville"
                        value={formData.address.city}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                        className="h-14 text-lg border-2"
                      />
                    </div>
                  </div>

                  <div className="border-t-2 pt-6">
                    <h3 className="text-lg font-bold mb-4">Informations Maçonniques</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rite" className="text-lg">Rite</Label>
                        <Select value={formData.rite_id} onValueChange={(value) => setFormData({...formData, rite_id: value})}>
                          <SelectTrigger className="h-14 text-lg mt-2 border-2">
                            <SelectValue placeholder="Sélectionner un rite" />
                          </SelectTrigger>
                          <SelectContent>
                            {rites.map(rite => (
                              <SelectItem key={rite.id} value={rite.id} className="text-lg">
                                {rite.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="obedience" className="text-lg">Obédience</Label>
                        <Select value={formData.obedience_id} onValueChange={(value) => setFormData({...formData, obedience_id: value})}>
                          <SelectTrigger className="h-14 text-lg mt-2 border-2">
                            <SelectValue placeholder="Sélectionner une obédience" />
                          </SelectTrigger>
                          <SelectContent>
                            {obediences.map(obedience => (
                              <SelectItem key={obedience.id} value={obedience.id} className="text-lg">
                                {obedience.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="degree" className="text-lg">Degré & Ordre</Label>
                        <Select value={formData.degree_order_id} onValueChange={(value) => setFormData({...formData, degree_order_id: value})}>
                          <SelectTrigger className="h-14 text-lg mt-2 border-2">
                            <SelectValue placeholder="Sélectionner un degré" />
                          </SelectTrigger>
                          <SelectContent>
                            {degreeOrders.map(degree => (
                              <SelectItem key={degree.id} value={degree.id} className="text-lg">
                                {degree.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="lodge_number" className="text-lg">Numéro de Loge</Label>
                        <Input
                          id="lodge_number"
                          value={formData.lodge_number}
                          onChange={(e) => setFormData({...formData, lodge_number: e.target.value})}
                          placeholder="Ex: 123"
                          className="h-14 text-lg mt-2 border-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lodge_name" className="text-lg">Nom de la Loge</Label>
                        <Input
                          id="lodge_name"
                          value={formData.lodge_name}
                          onChange={(e) => setFormData({...formData, lodge_name: e.target.value})}
                          placeholder="Ex: La Lumière"
                          className="h-14 text-lg mt-2 border-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lodge_city" className="text-lg">Ville de la Loge</Label>
                        <Input
                          id="lodge_city"
                          value={formData.lodge_city}
                          onChange={(e) => setFormData({...formData, lodge_city: e.target.value})}
                          placeholder="Ex: Paris"
                          className="h-14 text-lg mt-2 border-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-16 text-xl" disabled={createCustomerMutation.isPending}>
                    {createCustomerMutation.isPending ? 'Création...' : 'Créer le client'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => {
          const rite = rites.find(r => r.id === customer.rite_id);
          const obedience = obediences.find(o => o.id === customer.obedience_id);
          const degree = degreeOrders.find(d => d.id === customer.degree_order_id);

          return (
            <div key={customer.id} className="bg-card border-2 border-border rounded-2xl p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl mb-3 truncate">{customer.full_name}</h3>
                  <div className="space-y-2 mb-4">
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

                  {(customer.lodge_number || customer.lodge_name || rite || obedience || degree) && (
                    <div className="mb-4 pb-4 border-b-2 space-y-1">
                      {customer.lodge_number && (
                        <p className="text-sm"><span className="font-semibold">Loge N°:</span> {customer.lodge_number}</p>
                      )}
                      {customer.lodge_name && (
                        <p className="text-sm"><span className="font-semibold">Loge:</span> {customer.lodge_name}</p>
                      )}
                      {customer.lodge_city && (
                        <p className="text-sm"><span className="font-semibold">Ville:</span> {customer.lodge_city}</p>
                      )}
                      {rite && (
                        <p className="text-sm"><span className="font-semibold">Rite:</span> {rite.name}</p>
                      )}
                      {obedience && (
                        <p className="text-sm"><span className="font-semibold">Obédience:</span> {obedience.name}</p>
                      )}
                      {degree && (
                        <p className="text-sm"><span className="font-semibold">Degré:</span> {degree.name}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {customer.customer_source === 'pos' ? '🏪 POS' : 
                       customer.customer_source === 'direct' ? '🤝 Direct' :
                       customer.customer_source === 'phone' ? '📞 Tél' : '🌐 Web'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(customer.created_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}