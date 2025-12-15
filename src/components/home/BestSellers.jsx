import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/catalog/ProductCard';
import { TrendingUp } from 'lucide-react';

export default function BestSellers() {
  const { data: products = [] } = useQuery({
    queryKey: ['bestsellers'],
    queryFn: async () => {
      const featured = await base44.entities.Product.filter({ 
        is_active: true, 
        featured: true 
      }, '-created_date', 8);
      return featured;
    },
    initialData: []
  });

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Produits <span className="text-primary">Phares</span>
            </h2>
            <p className="text-muted-foreground">Les créations les plus prisées</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}