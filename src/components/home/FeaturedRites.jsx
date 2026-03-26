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
    <section className="py-12 relative" style={{
      backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691cd26ea8838a859856a6b6/a2afeeff0_background-sectionparrituel.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            Parcourir par <span className="text-gradient">Rite</span>
          </h2>
          <p className="text-slate-200 text-sm">
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
                  className="w-full min-h-12 h-auto px-4 py-2 justify-start group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all whitespace-normal text-left"
                >
                  <Award className="w-4 h-4 mr-2 shrink-0 text-primary group-hover:text-primary-foreground" />
                  <span className="font-semibold text-sm">{rite.name}</span>
                </Button>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}