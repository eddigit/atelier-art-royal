import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Filters from '@/components/catalog/Filters';
import Breadcrumb from '@/components/catalog/Breadcrumb';
import AdvancedSearchBar from '@/components/catalog/AdvancedSearchBar';
import ProductCard from '@/components/catalog/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Phone, Wrench } from 'lucide-react';

export default function Catalog() {
  const [filters, setFilters] = useState({
    rite: '',
    obedience: '',
    degreeOrder: '',
    logeType: '',
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    size: 'all',
    color: 'all',
    material: 'all',
    showPromotions: false,
    showNew: false,
    inStockOnly: false
  });
  const [sortBy, setSortBy] = useState('-created_date');

  // SEO Meta Tags
  React.useEffect(() => {
    document.title = 'Catalogue - Atelier Art Royal | Haute Couture Maçonnique';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Découvrez notre collection de produits maçonniques d\'exception : tabliers, sautoirs, bijoux et accessoires de haute qualité, fabriqués en France.';
    
    return () => {
      document.title = 'Atelier Art Royal';
    };
  }, []);

  // Sync filters with URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {
      rite: urlParams.get('rite') || '',
      obedience: urlParams.get('obedience') || '',
      degreeOrder: urlParams.get('degreeOrder') || '',
      logeType: urlParams.get('logeType') || '',
      category: urlParams.get('category') || '',
      search: urlParams.get('search') || '',
      minPrice: urlParams.get('minPrice') || '',
      maxPrice: urlParams.get('maxPrice') || '',
      size: urlParams.get('size') || 'all',
      color: urlParams.get('color') || 'all',
      material: urlParams.get('material') || 'all',
      showPromotions: urlParams.get('showPromotions') === 'true',
      showNew: urlParams.get('showNew') === 'true',
      inStockOnly: urlParams.get('inStockOnly') === 'true'
    };
    setFilters(params);
  }, [window.location.search]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all' && value !== false) {
        params.set(key, value.toString());
      }
    });
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', filters, sortBy],
    queryFn: async () => {
      let allProducts = await base44.entities.Product.filter({ is_active: true }, sortBy, 500);
      
      // Filter by stock availability if requested
      if (filters.inStockOnly) {
        allProducts = allProducts.filter(product => {
          const stock = product.stock_quantity || 0;
          return stock > 0;
        });
      } else {
        // Filter out products that are out of stock and don't allow backorders
        allProducts = allProducts.filter(product => {
          const stock = product.stock_quantity || 0;
          if (stock === 0 && !product.allow_backorders) {
            return false;
          }
          return true;
        });
      }
      
      // Apply filters
      return allProducts.filter(product => {
        if (filters.rite) {
          const riteIds = Array.isArray(product.rite_ids) && product.rite_ids.length > 0
            ? product.rite_ids 
            : (product.rite_id ? [product.rite_id] : []);
          if (!riteIds.includes(filters.rite)) return false;
        }
        if (filters.obedience) {
          const obedienceIds = Array.isArray(product.obedience_ids) && product.obedience_ids.length > 0
            ? product.obedience_ids 
            : (product.obedience_id ? [product.obedience_id] : []);
          if (!obedienceIds.includes(filters.obedience)) return false;
        }
        if (filters.degreeOrder) {
          const degreeIds = Array.isArray(product.degree_order_ids) && product.degree_order_ids.length > 0
            ? product.degree_order_ids 
            : (product.degree_order_id ? [product.degree_order_id] : []);
          if (!degreeIds.includes(filters.degreeOrder)) return false;
        }
        if (filters.category) {
          const categoryIds = Array.isArray(product.category_ids) && product.category_ids.length > 0
            ? product.category_ids 
            : (product.category_id ? [product.category_id] : []);
          if (!categoryIds.includes(filters.category)) return false;
        }
        
        // Promotions filter
        if (filters.showPromotions) {
          const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
          if (!hasDiscount) return false;
          
          const now = new Date();
          if (product.promo_start_date && new Date(product.promo_start_date) > now) return false;
          if (product.promo_end_date && new Date(product.promo_end_date) < now) return false;
        }
        
        // New products filter (last 30 days)
        if (filters.showNew) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const productDate = new Date(product.created_date);
          if (productDate < thirtyDaysAgo) return false;
        }
        
        // Enhanced search
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchableText = [
            product.name,
            product.description,
            product.short_description,
            ...(product.materials || []),
            ...(product.colors || []),
            ...(product.tags || [])
          ].filter(Boolean).join(' ').toLowerCase();
          
          if (!searchableText.includes(searchTerm)) return false;
        }
        
        if (filters.minPrice && product.price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && product.price > parseFloat(filters.maxPrice)) return false;
        if (filters.size !== 'all' && (!product.sizes || !product.sizes.includes(filters.size))) return false;
        if (filters.color !== 'all' && (!product.colors || !product.colors.includes(filters.color))) return false;
        if (filters.material !== 'all' && (!product.materials || !product.materials.includes(filters.material))) return false;
        return true;
      });
    },
    initialData: []
  });

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      ...(newFilters.logeType && newFilters.logeType !== prev.logeType ? { degreeOrder: '' } : {})
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      rite: '',
      obedience: '',
      degreeOrder: '',
      logeType: '',
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      size: 'all',
      color: 'all',
      material: 'all',
      showPromotions: false,
      showNew: false,
      inStockOnly: false
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Breadcrumb filters={filters} />
      
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Notre <span className="text-primary">Catalogue</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Découvrez l'excellence de nos créations maçonniques
            </p>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 lg:max-w-md">
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-primary">Création Sur-Mesure</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Toutes nos pièces peuvent être réalisées sur-mesure selon vos besoins spécifiques.
            </p>
            <a href="tel:+33646683610" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm">
              <Phone className="w-4 h-4" />
              +33 6 46 68 36 10
            </a>
          </div>
        </div>
      </div>

      <AdvancedSearchBar 
        filters={filters} 
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Filters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {/* Sort and Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {isLoading ? '...' : `${products.length} produit${products.length > 1 ? 's' : ''}`}
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Pertinence</SelectItem>
                <SelectItem value="-created_date">Nouveautés</SelectItem>
                <SelectItem value="price">Prix croissant</SelectItem>
                <SelectItem value="-price">Prix décroissant</SelectItem>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="-name">Nom Z-A</SelectItem>
                <SelectItem value="-featured">Popularité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(9).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-80 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos filtres
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}