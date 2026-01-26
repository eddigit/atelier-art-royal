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

  // Read URL params and apply filters on mount and navigation
  useEffect(() => {
    const syncFiltersFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Si aucun paramètre URL, on reset tout
      if (urlParams.toString() === '') {
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
      } else {
        // Sinon on applique les paramètres de l'URL
        setFilters({
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
        });
      }
    };

    // Initial sync
    syncFiltersFromUrl();

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', syncFiltersFromUrl);

    // Listen for custom urlchange event (from layout links)
    window.addEventListener('urlchange', syncFiltersFromUrl);

    return () => {
      window.removeEventListener('popstate', syncFiltersFromUrl);
      window.removeEventListener('urlchange', syncFiltersFromUrl);
    };
  }, []);

  // Update URL when filters change (but don't create a new history entry)
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.rite) params.set('rite', filters.rite);
    if (filters.obedience) params.set('obedience', filters.obedience);
    if (filters.degreeOrder) params.set('degreeOrder', filters.degreeOrder);
    if (filters.logeType) params.set('logeType', filters.logeType);
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.size && filters.size !== 'all') params.set('size', filters.size);
    if (filters.color && filters.color !== 'all') params.set('color', filters.color);
    if (filters.material && filters.material !== 'all') params.set('material', filters.material);
    if (filters.showPromotions) params.set('showPromotions', 'true');
    if (filters.showNew) params.set('showNew', 'true');
    if (filters.inStockOnly) params.set('inStockOnly', 'true');
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    
    // Only update if URL actually changed to avoid infinite loops
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [filters]);

  const { data: allDegreeOrders = [] } = useQuery({
    queryKey: ['degreeOrders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    initialData: []
  });

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
        // Normaliser les IDs des relations (supporter anciens et nouveaux formats)
        const riteIds = Array.isArray(product.rite_ids) && product.rite_ids.length > 0
          ? product.rite_ids 
          : (product.rite_id ? [product.rite_id] : []);
        
        const obedienceIds = Array.isArray(product.obedience_ids) && product.obedience_ids.length > 0
          ? product.obedience_ids 
          : (product.obedience_id ? [product.obedience_id] : []);
        
        const degreeIds = Array.isArray(product.degree_order_ids) && product.degree_order_ids.length > 0
          ? product.degree_order_ids 
          : (product.degree_order_id ? [product.degree_order_id] : []);
        
        const categoryIds = Array.isArray(product.category_ids) && product.category_ids.length > 0
          ? product.category_ids 
          : (product.category_id ? [product.category_id] : []);
        
        // Filtres sur les relations
        if (filters.rite && !riteIds.includes(filters.rite)) return false;
        if (filters.obedience && !obedienceIds.includes(filters.obedience)) return false;
        if (filters.degreeOrder && !degreeIds.includes(filters.degreeOrder)) return false;
        if (filters.category && !categoryIds.includes(filters.category)) return false;
        // Filtre Type de Loge (indirect via DegreeOrder)
        if (filters.logeType) {
          if (degreeIds.length === 0) return false;
          const productDegrees = allDegreeOrders.filter(d => degreeIds.includes(d.id));
          if (productDegrees.length === 0) return false;
          if (!productDegrees.some(d => d.loge_type === filters.logeType)) return false;
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
        
        // Enhanced search with normalization
        if (filters.search) {
          // Mots à ignorer (mots de conversation courants)
          const stopWords = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'ce', 'cette', 'ces',
            'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
            'cherche', 'chercher', 'veux', 'vouloir', 'besoin', 'ai', 'as', 'a',
            'pour', 'avec', 'sans', 'sur', 'sous', 'dans', 'chez', 'en'];

          // Normaliser le terme de recherche : enlever accents, apostrophes, tirets, espaces multiples
          const normalizeText = (text) => {
            return text
              .toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
              .replace(/['\-_]/g, ' ') // Remplacer apostrophes, tirets par espaces
              .replace(/\s+/g, ' ') // Espaces multiples → espace simple
              .trim();
          };

          const searchTerm = normalizeText(filters.search);
          const searchableText = normalizeText([
            product.name,
            product.description,
            product.short_description,
            ...(product.materials || []),
            ...(product.colors || []),
            ...(product.tags || [])
          ].filter(Boolean).join(' '));

          // Filtrer les mots de recherche pour enlever les stop words
          const searchWords = searchTerm
            .split(' ')
            .filter(w => w.length > 1 && !stopWords.includes(w));

          // Si aucun mot pertinent, ne pas filtrer
          if (searchWords.length === 0) return true;

          // Vérifier que tous les mots pertinents sont présents
          const allWordsPresent = searchWords.every(word => searchableText.includes(word));

          if (!allWordsPresent) return false;
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
    // Si l'utilisateur tape dans la recherche, on utilise UNIQUEMENT le texte de recherche
    // et on efface tous les autres filtres automatiques
    if (newFilters.search !== undefined) {
      setFilters(prev => ({
        ...prev,
        search: newFilters.search,
        // Ne PAS appliquer d'autres filtres automatiques
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
        ...(newFilters.logeType && newFilters.logeType !== prev.logeType ? { degreeOrder: '' } : {})
      }));
    }
  };

  const handleResetFilters = () => {
    // Clear URL
    window.history.pushState({}, '', window.location.pathname);
    
    // Clear filters
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