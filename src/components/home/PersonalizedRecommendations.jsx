import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/catalog/ProductCard';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PersonalizedRecommendations() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me().catch(() => null),
    initialData: null
  });

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Récupérer l'historique d'achat
      const orders = await base44.entities.Order.filter({ customer_id: user.id }, '-created_date', 10);
      
      // Extraire les rite_ids des produits achetés
      const purchasedProductIds = orders.flatMap(o => o.items?.map(i => i.product_id) || []);
      
      if (purchasedProductIds.length === 0) {
        // Pas d'historique : recommander des produits populaires
        return await base44.entities.Product.filter({ 
          is_active: true,
          featured: true 
        }, '-created_date', 4);
      }

      // Récupérer les produits achetés pour connaître leurs rites/grades
      const purchasedProducts = await base44.entities.Product.filter({
        id: { $in: purchasedProductIds }
      });

      const riteIds = [...new Set(purchasedProducts.map(p => p.rite_id).filter(Boolean))];
      const gradeIds = [...new Set(purchasedProducts.map(p => p.grade_id).filter(Boolean))];

      // Recommander des produits similaires (même rite ou grade) non achetés
      const allProducts = await base44.entities.Product.filter({ is_active: true }, '-created_date', 100);
      
      return allProducts
        .filter(p => !purchasedProductIds.includes(p.id))
        .filter(p => riteIds.includes(p.rite_id) || gradeIds.includes(p.grade_id))
        .slice(0, 4);
    },
    enabled: !!user,
    initialData: []
  });

  if (!user || recommendations.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="w-8 h-8" style={{color: '#e5b350'}} />
        <h2 className="text-3xl font-bold">
          Recommandations <span style={{color: '#e5b350'}}>pour vous</span>
        </h2>
      </div>
      <p className="text-muted-foreground mb-8">
        Basées sur vos achats et préférences
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}