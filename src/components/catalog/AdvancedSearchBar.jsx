import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, SlidersHorizontal, X, Tag, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function AdvancedSearchBar({ filters, onFilterChange, onReset }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products-filter-options'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '-created_date', 1000),
    initialData: []
  });

  const { data: allRites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 100),
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

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 100),
    initialData: []
  });

  // Filter only options with available products and deduplicate by name
  const rites = allRites.filter(r => products.some(p => p.rite_id === r.id));
  const obediences = allObediences.filter(o => products.some(p => p.obedience_id === o.id));
  const degreeOrdersFiltered = allDegreeOrders.filter(d => products.some(p => p.degree_order_id === d.id));
  const degreeOrders = degreeOrdersFiltered.filter((deg, index, self) => 
    index === self.findIndex(d => d.name === deg.name)
  );
  const categoriesFiltered = allCategories.filter(c => products.some(p => p.category_id === c.id));
  const categories = categoriesFiltered.filter((cat, index, self) => 
    index === self.findIndex(c => c.name === cat.name)
  );

  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const activeFiltersCount = [
    filters.rite,
    filters.obedience,
    filters.logeType,
    filters.degreeOrder,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.showPromotions,
    filters.showNew,
    filters.inStockOnly
  ].filter(Boolean).length;

  const getActiveFilterLabels = () => {
    const labels = [];
    
    if (filters.rite) {
      const rite = rites.find(r => r.id === filters.rite);
      if (rite) labels.push({ key: 'rite', label: rite.name });
    }
    
    if (filters.obedience) {
      const obedience = obediences.find(o => o.id === filters.obedience);
      if (obedience) labels.push({ key: 'obedience', label: obedience.name });
    }
    
    if (filters.logeType) {
      labels.push({ key: 'logeType', label: filters.logeType });
    }
    
    if (filters.degreeOrder) {
      const degree = degreeOrders.find(d => d.id === filters.degreeOrder);
      if (degree) labels.push({ key: 'degreeOrder', label: degree.name });
    }
    
    if (filters.category) {
      const category = categories.find(c => c.id === filters.category);
      if (category) labels.push({ key: 'category', label: category.name });
    }
    
    if (filters.showPromotions) labels.push({ key: 'showPromotions', label: 'Promotions' });
    if (filters.showNew) labels.push({ key: 'showNew', label: 'Nouveautés' });
    if (filters.inStockOnly) labels.push({ key: 'inStockOnly', label: 'En stock' });
    
    if (filters.minPrice || filters.maxPrice) {
      const priceLabel = `${filters.minPrice || '0'}€ - ${filters.maxPrice || '∞'}€`;
      labels.push({ key: 'price', label: priceLabel });
    }
    
    return labels;
  };

  const activeLabels = getActiveFilterLabels();

  return (
    <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-border pb-4 -mx-4 px-4 mb-6">
      <div className="flex gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit, un rite, un degré..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleChange('search', '')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 relative">
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtres Avancés</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onReset();
                      setIsAdvancedOpen(false);
                    }}
                  >
                    Réinitialiser
                  </Button>
                )}
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

              {/* Obédience */}
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

              {/* Degré & Ordre */}
              <div className="space-y-2">
                <Label>Degré & Ordre</Label>
                <Select value={filters.degreeOrder || 'all'} onValueChange={(v) => handleChange('degreeOrder', v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les degrés" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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
                      degreeOrders.map((degree) => (
                        <SelectItem key={degree.id} value={degree.id}>
                          {degree.name} ({degree.loge_type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Catégorie */}
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

              {/* Prix Range */}
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

              {/* Quick Toggles */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="promotions-adv" 
                    checked={filters.showPromotions || false}
                    onCheckedChange={(checked) => handleChange('showPromotions', checked)}
                  />
                  <label
                    htmlFor="promotions-adv"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <Tag className="w-4 h-4 text-primary" />
                    Promotions uniquement
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="nouveautes-adv" 
                    checked={filters.showNew || false}
                    onCheckedChange={(checked) => handleChange('showNew', checked)}
                  />
                  <label
                    htmlFor="nouveautes-adv"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Nouveautés (30 jours)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stock-adv" 
                    checked={filters.inStockOnly || false}
                    onCheckedChange={(checked) => handleChange('inStockOnly', checked)}
                  />
                  <label
                    htmlFor="stock-adv"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    En stock uniquement
                  </label>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setIsAdvancedOpen(false)}
              >
                Appliquer les filtres
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeLabels.map((filter) => (
            <Badge 
              key={filter.key} 
              variant="secondary" 
              className="gap-1 pr-1"
            >
              {filter.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  if (filter.key === 'price') {
                    handleChange('minPrice', '');
                    handleChange('maxPrice', '');
                  } else {
                    handleChange(filter.key, filter.key === 'showPromotions' || filter.key === 'showNew' || filter.key === 'inStockOnly' ? false : '');
                  }
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}