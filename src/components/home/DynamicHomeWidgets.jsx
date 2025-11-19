import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProductCard from '@/components/catalog/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

function PromotionsWidget({ widget }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['promo-products', widget.id],
    queryFn: async () => {
      const allProducts = await base44.entities.Product.filter({ is_active: true }, '-created_date', 500);
      
      // Filter products with active promotions and available stock
      const now = new Date();
      const promoProducts = allProducts.filter(product => {
        // Check stock availability
        const stock = product.stock_quantity || 0;
        if (stock === 0 && !product.allow_backorders) return false;
        
        const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
        if (!hasDiscount) return false;
        
        if (product.promo_start_date && new Date(product.promo_start_date) > now) return false;
        if (product.promo_end_date && new Date(product.promo_end_date) < now) return false;
        
        return true;
      });
      
      return promoProducts.slice(0, widget.config?.limit || 8);
    },
    initialData: []
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-24 container mx-auto px-4 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {widget.title}
        </h2>
        {widget.subtitle && (
          <p className="text-muted-foreground text-lg">{widget.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          ))
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      <div className="text-center">
        <Link to={createPageUrl('Catalog') + '?showPromotions=true'}>
          <Button size="lg" className="gap-2">
            Voir toutes les promotions
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function NouveautesWidget({ widget }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['new-products', widget.id],
    queryFn: async () => {
      const allProducts = await base44.entities.Product.filter({ is_active: true }, '-created_date', 500);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newProducts = allProducts.filter(product => {
        // Check stock availability
        const stock = product.stock_quantity || 0;
        if (stock === 0 && !product.allow_backorders) return false;
        
        const productDate = new Date(product.created_date);
        return productDate >= thirtyDaysAgo;
      });
      
      return newProducts.slice(0, widget.config?.limit || 8);
    },
    initialData: []
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-24 container mx-auto px-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {widget.title}
        </h2>
        {widget.subtitle && (
          <p className="text-muted-foreground text-lg">{widget.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          ))
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      <div className="text-center">
        <Link to={createPageUrl('Catalog') + '?showNew=true'}>
          <Button size="lg" className="gap-2">
            Voir toutes les nouveautés
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function FeaturedProductsWidget({ widget }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['featured-products', widget.id],
    queryFn: async () => {
      let query = { featured: true, is_active: true };
      
      if (widget.config?.rite_id) query.rite_id = widget.config.rite_id;
      if (widget.config?.category_id) query.category_id = widget.config.category_id;
      
      const allProducts = await base44.entities.Product.filter(query, '-created_date', widget.config?.limit || 50);
      
      // Filter by stock availability
      const availableProducts = allProducts.filter(product => {
        const stock = product.stock_quantity || 0;
        return stock > 0 || product.allow_backorders;
      });
      
      return availableProducts.slice(0, widget.config?.limit || 8);
    },
    initialData: []
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-24 container mx-auto px-4 bg-muted/20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          {widget.title}
        </h2>
        {widget.subtitle && (
          <p className="text-muted-foreground text-lg">{widget.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-80 w-full rounded-lg" />
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

function BannerWidget({ widget }) {
  if (!widget.config?.banner_image) return null;

  return (
    <section className="py-12 container mx-auto px-4">
      <Link 
        to={widget.config?.banner_link || createPageUrl('Catalog')}
        className="block relative rounded-2xl overflow-hidden group shadow-2xl"
      >
        <div className="relative h-96 image-immersive">
          <img
            src={widget.config.banner_image}
            alt={widget.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        </div>
        
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-8">
            <h2 className="text-5xl font-bold text-white mb-4">
              {widget.title}
            </h2>
            {widget.subtitle && (
              <p className="text-xl text-white/90 mb-6 max-w-lg">
                {widget.subtitle}
              </p>
            )}
            {widget.config?.banner_cta && (
              <Button size="lg" className="gap-2 group-hover:gap-3 transition-all">
                {widget.config.banner_cta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
}

export default function DynamicHomeWidgets() {
  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['active-home-widgets'],
    queryFn: () => base44.entities.HomeWidget.filter({ is_active: true }, 'display_order', 50),
    initialData: []
  });

  if (isLoading) {
    return (
      <div className="py-24">
        <Skeleton className="h-96 container mx-auto" />
      </div>
    );
  }

  return (
    <>
      {widgets.map((widget) => {
        switch (widget.widget_type) {
          case 'promotions':
            return <PromotionsWidget key={widget.id} widget={widget} />;
          case 'nouveautes':
            return <NouveautesWidget key={widget.id} widget={widget} />;
          case 'featured_products':
            return <FeaturedProductsWidget key={widget.id} widget={widget} />;
          case 'banner':
            return <BannerWidget key={widget.id} widget={widget} />;
          default:
            return null;
        }
      })}
    </>
  );
}