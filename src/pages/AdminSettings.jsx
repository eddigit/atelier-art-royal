import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';

function GeneralSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.AppSettings.list(),
    initialData: []
  });

  const bellSetting = settings.find(s => s.setting_key === 'visitor_notification_sound');
  const isBellEnabled = bellSetting?.setting_value === 'true';

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = settings.find(s => s.setting_key === key);
      if (existing) {
        await base44.entities.AppSettings.update(existing.id, {
          setting_value: value
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: key,
          setting_value: value,
          description: 'Notification sonore pour nouveaux visiteurs'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['app-settings']);
      toast.success('Paramètre mis à jour');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres Généraux</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Notification sonore</p>
              <p className="text-sm text-muted-foreground">
                Jouer un son de cloche lors de l'arrivée d'un nouveau visiteur
              </p>
            </div>
          </div>
          <Switch
            checked={isBellEnabled}
            onCheckedChange={(checked) => 
              updateSettingMutation.mutate({ 
                key: 'visitor_notification_sound', 
                value: String(checked) 
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSettings() {
  const queryClient = useQueryClient();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        <span className="text-gradient">Configuration</span>
      </h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="rites">Rites</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="rites">
          <RitesManager />
        </TabsContent>

        <TabsContent value="grades">
          <GradesManager />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RitesManager() {
  const [newRite, setNewRite] = useState({ name: '', code: '', description: '', order: 0 });
  const queryClient = useQueryClient();

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Rite.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rites']);
      setNewRite({ name: '', code: '', description: '', order: 0 });
      toast.success('Rite créé');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Rite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rites']);
      toast.success('Rite supprimé');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Rite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nom (ex: REAA)"
              value={newRite.name}
              onChange={(e) => setNewRite({ ...newRite, name: e.target.value })}
            />
            <Input
              placeholder="Code (ex: reaa)"
              value={newRite.code}
              onChange={(e) => setNewRite({ ...newRite, code: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newRite.description}
              onChange={(e) => setNewRite({ ...newRite, description: e.target.value })}
            />
            <Button
              onClick={() => createMutation.mutate(newRite)}
              disabled={!newRite.name || !newRite.code}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rites existants ({rites.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rites.map((rite) => (
              <div key={rite.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{rite.name}</p>
                  <p className="text-sm text-muted-foreground">{rite.code}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Supprimer ce rite ?')) {
                      deleteMutation.mutate(rite.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GradesManager() {
  const [newGrade, setNewGrade] = useState({ name: '', level: 1, rite_id: '', description: '' });
  const queryClient = useQueryClient();

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => base44.entities.Grade.list('level', 100),
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Grade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['grades']);
      setNewGrade({ name: '', level: 1, rite_id: '', description: '' });
      toast.success('Grade créé');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Grade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['grades']);
      toast.success('Grade supprimé');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nom"
              value={newGrade.name}
              onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Niveau"
              value={newGrade.level}
              onChange={(e) => setNewGrade({ ...newGrade, level: parseInt(e.target.value) })}
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newGrade.rite_id}
              onChange={(e) => setNewGrade({ ...newGrade, rite_id: e.target.value })}
            >
              <option value="">Sélectionner un rite</option>
              {rites.map((rite) => (
                <option key={rite.id} value={rite.id}>{rite.name}</option>
              ))}
            </select>
            <Button
              onClick={() => createMutation.mutate(newGrade)}
              disabled={!newGrade.name}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grades existants ({grades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {grades.map((grade) => {
              const rite = rites.find(r => r.id === grade.rite_id);
              return (
                <div key={grade.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{grade.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Niveau {grade.level} {rite ? `- ${rite.name}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Supprimer ce grade ?')) {
                        deleteMutation.mutate(grade.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesManager() {
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', order: 0 });
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setNewCategory({ name: '', slug: '', description: '', order: 0 });
      toast.success('Catégorie créée');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Catégorie supprimée');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Nom (ex: Tabliers)"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <Input
              placeholder="Slug (ex: tabliers)"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <Button
              onClick={() => createMutation.mutate(newCategory)}
              disabled={!newCategory.name || !newCategory.slug}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégories existantes ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Supprimer cette catégorie ?')) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}