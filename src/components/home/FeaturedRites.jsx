import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Award } from 'lucide-react';

export default function FeaturedRites() {
  const { data: rites = [], isLoading } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  return (
    <section className="py-12 container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Parcourir par <span className="text-gradient">Rite</span>
        </h2>
        <p className="text-muted-foreground text-sm">
          Sélectionnez votre Rite pour découvrir nos créations
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))
        ) : (
          rites.map((rite) => (
            <Link 
              key={rite.id} 
              to={createPageUrl('Catalog') + `?rite=${rite.id}`}
            >
              <Button
                variant="outline"
                className="w-full h-12 px-4 justify-start group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                <Award className="w-4 h-4 mr-2 text-primary group-hover:text-primary-foreground" />
                <span className="font-semibold text-sm truncate">{rite.name}</span>
              </Button>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}