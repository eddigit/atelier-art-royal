import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Tag, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DynamicGallery() {
  const { data: newProducts = [], isLoading: loadingNew } = useQuery({
    queryKey: ['new-products'],
    queryFn: async () => {
      return await base44.entities.Product.filter({ is_active: true }, '-created_date', 6);
    },
    initialData: []
  });

  const { data: promoProducts = [], isLoading: loadingPromo } = useQuery({
    queryKey: ['promo-products'],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ is_active: true }, '-created_date', 100);
      const now = new Date();
      return products.filter(p => {
        const hasDiscount = p.compare_at_price && p.compare_at_price > p.price;
        if (!hasDiscount) return false;
        
        if (p.promo_start_date && new Date(p.promo_start_date) > now) return false;
        if (p.promo_end_date && new Date(p.promo_end_date) < now) return false;
        
        return true;
      }).slice(0, 6);
    },
    initialData: []
  });

  const isLoading = loadingNew || loadingPromo;

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-20">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const featuredProducts = [...promoProducts, ...newProducts].slice(0, 6);

  if (featuredProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="w-8 h-8" style={{color: '#e5b350'}} />
        <h2 className="text-3xl font-bold">
          Nouveautés & <span style={{color: '#e5b350'}}>Promotions</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {featuredProducts.map((product, idx) => {
          const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
          const discountPercent = hasDiscount 
            ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
            : 0;
          const isNew = newProducts.includes(product);
          
          return (
            <Link
              key={product.id}
              to={createPageUrl('ProductDetail') + `?id=${product.id}`}
              className={`group relative overflow-hidden rounded-lg ${
                idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div className={`relative w-full ${idx === 0 ? 'h-[500px]' : 'h-64'} overflow-hidden`}>
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=2105'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {isNew && (
                    <Badge className="bg-blue-600 text-white">
                      Nouveau
                    </Badge>
                  )}
                  {hasDiscount && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      -{discountPercent}%
                    </Badge>
                  )}
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className={`font-bold ${idx === 0 ? 'text-2xl' : 'text-lg'} mb-2 line-clamp-2`}>
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasDiscount && (
                      <span className="text-sm line-through opacity-70">
                        {product.compare_at_price.toFixed(2)}€
                      </span>
                    )}
                    <span className={`font-bold ${idx === 0 ? 'text-xl' : 'text-lg'}`} style={{color: '#e5b350'}}>
                      {product.price.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}