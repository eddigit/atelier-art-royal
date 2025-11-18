import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const handleSearch = (e) => {
    e.preventDefault();
    const searchQuery = e.target.search.value;
    // TODO: Intégrer Groq AI pour recherche intelligente
    console.log('Recherche:', searchQuery);
  };

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 image-immersive">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691cd26ea8838a859856a6b6/01e4593f1_GeneratedImageNovember182025-9_37PM.png"
          alt="Haute Couture Maçonnique"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Haute Couture Maçonnique
          </span>
        </div>
        
        <h1 className="text-hero text-gradient mb-6">
          Atelier Art Royal
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Création d'exception pour tous les Rites et Grades.<br />
          L'élégance au service de la Tradition.
        </p>

        {/* AI-Powered Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              name="search"
              placeholder="Recherchez un produit, un rite, un grade... (Recherche IA)"
              className="h-16 pl-16 pr-6 text-lg glass border-2 border-border focus:border-primary transition-all rounded-full"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                IA
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Recherche intelligente propulsée par Groq AI
          </p>
        </form>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Livraison 5-7 jours
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Support 24/7
          </div>
        </div>
      </div>
    </section>
  );
}