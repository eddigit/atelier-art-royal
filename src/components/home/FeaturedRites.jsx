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
    <section className="py-24 container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Parcourir par <span className="text-gradient">Rite</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          Sélectionnez votre Rite pour découvrir nos créations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : (
          rites.map((rite) => (
            <Link 
              key={rite.id} 
              to={createPageUrl('Catalog') + `?rite=${rite.id}`}
            >
              <Button
                variant="outline"
                className="w-full h-auto py-6 px-8 justify-between group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                    <Award className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">{rite.name}</div>
                    {rite.description && (
                      <div className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 line-clamp-1">
                        {rite.description}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}