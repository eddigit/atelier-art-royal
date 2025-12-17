import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Filter, Tag, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Filters({ filters, onFilterChange, onReset }) {
  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-filters'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '-created_date', 1000),
    initialData: []
  });

  const { data: allRites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const { data: allObediences = [] } = useQuery({
    queryKey: ['obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    initialData: []
  });

  const { data: allDegreeOrders = [] } = useQuery({
    queryKey: ['degreeOrders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    initialData: []
  });

  // Filter only options with available products and deduplicate by name
  const rites = allRites.filter(r => products.some(p => {
    const riteIds = Array.isArray(p.rite_ids) ? p.rite_ids : [];
    return riteIds.includes(r.id);
  }));
  
  const categoriesFiltered = allCategories.filter(c => products.some(p => {
    const categoryIds = Array.isArray(p.category_ids) ? p.category_ids : [];
    return categoryIds.includes(c.id);
  }));
  const categories = categoriesFiltered.filter((cat, index, self) => 
    index === self.findIndex(c => c.name === cat.name)
  );
  
  const obediences = allObediences.filter(o => 
    products.some(p => {
      const obedienceIds = Array.isArray(p.obedience_ids) ? p.obedience_ids : [];
      return obedienceIds.includes(o.id);
    })
  );
  
  const degreeOrdersFiltered = allDegreeOrders.filter(d => products.some(p => {
    const degreeIds = Array.isArray(p.degree_order_ids) ? p.degree_order_ids : [];
    return degreeIds.includes(d.id);
  }));
  const degreeOrders = degreeOrdersFiltered.filter((deg, index, self) => 
    index === self.findIndex(d => d.name === deg.name)
  );

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
          {(filters.rite || filters.obedience || filters.degreeOrder || filters.logeType || filters.category || filters.search || filters.minPrice || filters.maxPrice || filters.showPromotions || filters.showNew) && (
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
            placeholder="Nom, description, matière, couleur..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Quick Filters */}
        <div className="space-y-3 pt-2 pb-2 border-t border-b border-border">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="promotions" 
              checked={filters.showPromotions || false}
              onCheckedChange={(checked) => handleChange('showPromotions', checked)}
            />
            <label
              htmlFor="promotions"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
            >
              <Tag className="w-4 h-4" style={{color: '#e5b350'}} />
              Promotions uniquement
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="nouveautes" 
              checked={filters.showNew || false}
              onCheckedChange={(checked) => handleChange('showNew', checked)}
            />
            <label
              htmlFor="nouveautes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" style={{color: '#e5b350'}} />
              Nouveautés (30 jours)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="stock" 
              checked={filters.inStockOnly || false}
              onCheckedChange={(checked) => handleChange('inStockOnly', checked)}
            />
            <label
              htmlFor="stock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              En stock uniquement
            </label>
          </div>
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

        {/* Obedience */}
        <div className="space-y-2">
          <Label>Obédience</Label>
          <Select value={filters.obedience || 'all'} onValueChange={(v) => handleChange('obedience', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les Obédiences" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les Obédiences</SelectItem>
              {obediences.map((obedience) => (
                <SelectItem key={obedience.id} value={obedience.id}>
                  {obedience.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type de Loge */}
        <div className="space-y-2">
          <Label>Type de Loge</Label>
          <Select value={filters.logeType || 'all'} onValueChange={(v) => handleChange('logeType', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Loge Symbolique">Loge Symbolique</SelectItem>
              <SelectItem value="Loge Hauts Grades">Loge Hauts Grades</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Degree & Order */}
        <div className="space-y-2">
          <Label>Degré & Ordre</Label>
          <Select value={filters.degreeOrder || 'all'} onValueChange={(v) => handleChange('degreeOrder', v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les degrés" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">Tous les degrés</SelectItem>
              {filters.logeType && filters.logeType !== 'all' ? (
                degreeOrders
                  .filter(d => d.loge_type === filters.logeType)
                  .map((degree) => (
                    <SelectItem key={degree.id} value={degree.id}>
                      {degree.name}
                    </SelectItem>
                  ))
              ) : (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary">Loge Symbolique</div>
                  {degreeOrders.filter(d => d.loge_type === 'Loge Symbolique').map((degree) => (
                    <SelectItem key={degree.id} value={degree.id}>
                      {degree.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary mt-2">Loge Hauts Grades</div>
                  {degreeOrders.filter(d => d.loge_type === 'Loge Hauts Grades').map((degree) => (
                    <SelectItem key={degree.id} value={degree.id}>
                      {degree.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

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