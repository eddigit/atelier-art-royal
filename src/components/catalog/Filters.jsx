import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Filters({ filters, onFilterChange, onReset }) {
  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', filters.rite],
    queryFn: async () => {
      if (!filters.rite) return [];
      return await base44.entities.Grade.filter({ rite_id: filters.rite }, 'level', 50);
    },
    enabled: !!filters.rite,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-filters'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '-created_date', 1000),
    initialData: []
  });

  // Extract unique values from products
  const availableSizes = [...new Set(products.flatMap(p => p.sizes || []))].sort();
  const availableColors = [...new Set(products.flatMap(p => p.colors || []))].sort();
  const availableMaterials = [...new Set(products.flatMap(p => p.materials || []))].sort();

  return (
    <Card className="glass sticky top-24">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Filtres
          </CardTitle>
          {(filters.rite || filters.grade || filters.category || filters.search || filters.minPrice || filters.maxPrice) && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>Recherche</Label>
          <Input
            placeholder="Nom du produit..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Rite */}
        <div className="space-y-2">
          <Label>Rite</Label>
          <Select value={filters.rite || 'all'} onValueChange={(v) => handleChange('rite', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les Rites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les Rites</SelectItem>
              {rites.map((rite) => (
                <SelectItem key={rite.id} value={rite.id}>
                  {rite.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grade */}
        {filters.rite && grades.length > 0 && (
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select value={filters.grade || 'all'} onValueChange={(v) => handleChange('grade', v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Grades</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category */}
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select value={filters.category || 'all'} onValueChange={(v) => handleChange('category', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les Catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        {availableSizes.length > 0 && (
          <div className="space-y-2">
            <Label>Taille</Label>
            <Select value={filters.size || 'all'} onValueChange={(v) => handleChange('size', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes tailles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes tailles</SelectItem>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Color */}
        {availableColors.length > 0 && (
          <div className="space-y-2">
            <Label>Couleur</Label>
            <Select value={filters.color || 'all'} onValueChange={(v) => handleChange('color', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes couleurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes couleurs</SelectItem>
                {availableColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Material */}
        {availableMaterials.length > 0 && (
          <div className="space-y-2">
            <Label>Matière</Label>
            <Select value={filters.material || 'all'} onValueChange={(v) => handleChange('material', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes matières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes matières</SelectItem>
                {availableMaterials.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Prix</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handleChange('minPrice', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}