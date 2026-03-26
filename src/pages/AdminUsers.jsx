import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, Search, Plus, Shield, ShieldCheck, UserCog, Key,
  Loader2, CheckCircle, XCircle, Eye, EyeOff, UserPlus, Ban
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

async function fetchUsers(search, role) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role && role !== 'all') params.set('role', role);
  const res = await fetch(`${API_URL}/api/auth/admin-users?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

async function createUser(data) {
  const res = await fetch(`${API_URL}/api/auth/admin-users`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create user');
  return json;
}

async function updateUser(id, data) {
  const res = await fetch(`${API_URL}/api/auth/admin-users?id=${id}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update user');
  return json;
}

async function disableUser(id) {
  const res = await fetch(`${API_URL}/api/auth/admin-users?id=${id}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to disable user');
  return json;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editUser, setEditUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', full_name: '', password: '', role: 'user' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => fetchUsers(search, roleFilter),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setShowCreateDialog(false);
      setCreateForm({ email: '', full_name: '', password: '', role: 'user' });
      toast.success('Utilisateur créé avec succès');
    },
    onError: (err) => toast.error(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setEditUser(null);
      toast.success('Utilisateur mis à jour');
    },
    onError: (err) => toast.error(err.message)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }) => updateUser(id, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setShowPasswordDialog(null);
      setNewPassword('');
      toast.success('Mot de passe mis à jour');
    },
    onError: (err) => toast.error(err.message)
  });

  const disableMutation = useMutation({
    mutationFn: disableUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Utilisateur désactivé');
    },
    onError: (err) => toast.error(err.message)
  });

  const admins = users.filter(u => u.role === 'admin');
  const clients = users.filter(u => u.role !== 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            Gestion des utilisateurs
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
            {' '}- {admins.length} admin{admins.length > 1 ? 's' : ''}
            {' '}- {clients.length} client{clients.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Nouveau utilisateur
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email ou nom..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Mot de passe</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => (
                    <TableRow key={user.id} className={user.disabled ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Users className="w-4 h-4 text-muted-foreground" />
                          )}
                          {user.full_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Client'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.has_password ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-3.5 h-3.5" /> Défini
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive text-sm">
                            <XCircle className="w-3.5 h-3.5" /> Non défini
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.disabled ? (
                          <Badge variant="destructive">Désactivé</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200">Actif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setEditUser(user)}
                            title="Modifier"
                          >
                            <UserCog className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setShowPasswordDialog(user); setNewPassword(''); }}
                            title="Réinitialiser le mot de passe"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          {!user.disabled && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(`Désactiver ${user.full_name || user.email} ?`)) {
                                  disableMutation.mutate(user.id);
                                }
                              }}
                              title="Désactiver"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Edit User Dialog ────────────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={editUser.full_name || ''}
                  onChange={e => setEditUser({ ...editUser, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editUser.email}
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={editUser.role} onValueChange={v => setEditUser({ ...editUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Client
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={editUser.disabled ? 'disabled' : 'active'}
                  onValueChange={v => setEditUser({ ...editUser, disabled: v === 'disabled' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="disabled">Désactivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Annuler</Button>
            <Button
              onClick={() => updateMutation.mutate({
                id: editUser.id,
                full_name: editUser.full_name,
                email: editUser.email,
                role: editUser.role,
                disabled: editUser.disabled
              })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ───────────────────────────────────── */}
      <Dialog open={!!showPasswordDialog} onOpenChange={(open) => !open && setShowPasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {showPasswordDialog?.full_name || showPasswordDialog?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(null)}>Annuler</Button>
            <Button
              onClick={() => resetPasswordMutation.mutate({ id: showPasswordDialog.id, password: newPassword })}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
            >
              {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create User Dialog ──────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={createForm.full_name}
                onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={createMutation.isPending || !createForm.email}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
