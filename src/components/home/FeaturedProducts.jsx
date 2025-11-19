import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/catalog/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeaturedProducts() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const allProducts = await base44.entities.Product.filter({ featured: true, is_active: true }, '-created_date', 50);
      
      // Filter by stock availability
      const availableProducts = allProducts.filter(product => {
        const stock = product.stock_quantity || 0;
        return stock > 0 || product.allow_backorders;
      });
      
      return availableProducts.slice(0, 8);
    },
    initialData: []
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-24 container mx-auto px-4 bg-muted/20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Nos <span className="text-gradient">Créations</span> d'Exception
        </h2>
        <p className="text-muted-foreground text-lg">
          Une sélection de nos plus belles pièces
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-80 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
}