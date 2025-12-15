import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CategoryShowcase() {
  const { data: categories = [] } = useQuery({
    queryKey: ['home-categories'],
    queryFn: () => base44.entities.Category.list('order', 10),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['home-products-for-categories'],
    queryFn: () => base44.entities.Product.filter({ is_active: true, featured: true }, '-created_date', 50),
    initialData: []
  });

  const categoriesWithImages = categories.slice(0, 4).map(cat => {
    const categoryProducts = products.filter(p => p.category_id === cat.id);
    const imageUrl = categoryProducts[0]?.images?.[0] || cat.image_url || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800';
    return { ...cat, imageUrl };
  });

  if (categoriesWithImages.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nos <span className="text-primary">Collections</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explorez nos gammes complètes de produits maçonniques d'exception
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriesWithImages.map((category) => (
            <Link 
              key={category.id} 
              to={createPageUrl('Catalog') + `?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-muted"
            >
              <img 
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold mb-2 transform transition-transform group-hover:translate-y-[-4px]">
                  {category.name}
                </h3>
                <div className="flex items-center text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Découvrir
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to={createPageUrl('Catalog')}>
            <Button size="lg" variant="outline" className="group">
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}