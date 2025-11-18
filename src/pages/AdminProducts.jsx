import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      const allProducts = await base44.entities.Product.list('-created_date', 500);
      if (!search) return allProducts;
      return allProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    },
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => base44.entities.Grade.list('level', 100),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Produit supprimé');
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">
          Gestion des <span className="text-gradient">Produits</span>
        </h1>
        <ProductDialog
          product={null}
          rites={rites}
          grades={grades}
          categories={categories}
          onSuccess={() => queryClient.invalidateQueries(['admin-products'])}
        >
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </ProductDialog>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square bg-muted relative">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {!product.is_active && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="secondary">Inactif</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary">
                  {product.price.toFixed(2)}€
                </span>
                <span className="text-sm text-muted-foreground">
                  Stock: {product.stock_quantity}
                </span>
              </div>
              <div className="flex gap-2">
                <ProductDialog
                  product={product}
                  rites={rites}
                  grades={grades}
                  categories={categories}
                  onSuccess={() => queryClient.invalidateQueries(['admin-products'])}
                >
                  <Button variant="outline" size="sm" className="flex-1">
                    <Pencil className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                </ProductDialog>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Supprimer ce produit ?')) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
}

function ProductDialog({ product, rites, grades, categories, onSuccess, children }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(
    product || {
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: 0,
      compare_at_price: 0,
      rite_id: '',
      grade_id: '',
      category_id: '',
      images: [],
      stock_quantity: 0,
      low_stock_threshold: 5,
      sku: '',
      is_active: true,
      featured: false,
      tags: []
    }
  );

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (product) {
        return base44.entities.Product.update(product.id, data);
      } else {
        return base44.entities.Product.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(product ? 'Produit modifié' : 'Produit créé');
      setOpen(false);
      if (onSuccess) onSuccess();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Modifier' : 'Créer'} un Produit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nom *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Prix (€) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Stock *</Label>
              <Input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Rite *</Label>
              <Select
                value={formData.rite_id}
                onValueChange={(v) => setFormData({ ...formData, rite_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {rites.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade *</Label>
              <Select
                value={formData.grade_id}
                onValueChange={(v) => setFormData({ ...formData, grade_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description courte</Label>
              <Input
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label htmlFor="is_active">Actif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(v) => setFormData({ ...formData, featured: v })}
                />
                <Label htmlFor="featured">Coup de cœur</Label>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}