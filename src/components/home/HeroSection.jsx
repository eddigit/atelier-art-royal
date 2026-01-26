import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function HeroSection() {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchQuery = e.target.search.value.trim();

    if (!searchQuery) {
      toast.error('Veuillez saisir une recherche');
      return;
    }

    // Redirection DIRECTE avec recherche textuelle uniquement
    window.location.href = createPageUrl('Catalog') + '?search=' + encodeURIComponent(searchQuery);
  };

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://res.cloudinary.com/dkvhbcuaz/video/upload/background_hero_video_raji06.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ backgroundColor: '#0a0a0a', opacity: 0.6 }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium uppercase tracking-wider" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
              HAUTE COUTURE MAÇONNIQUE
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-5 bg-blue-600 rounded-l"></div>
              <div className="w-1.5 h-5 bg-white border-x border-gray-200"></div>
              <div className="w-1.5 h-5 bg-red-600 rounded-r"></div>
            </div>
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Sur-Mesure • Made in France</span>
          </div>
        </div>
        
        <h1 className="text-hero text-white mb-6" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6)' }}>
          Atelier Art Royal
        </h1>
        
        <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto mb-10 leading-relaxed" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}>
          Création d'exception pour tous les Rites et Grades.<br />
          L'élégance au service de la Tradition.
        </p>

        {/* AI-Powered Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative group">
            {isSearching ?
            <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-spin z-10" /> :

            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-hover:text-primary group-focus-within:text-primary transition-colors z-10" />
            }
            <Input
              type="text"
              name="search"
              placeholder="Ex: tablier REAA maître, sautoir 18ème degré GLNF, bijoux apprenti..."
              disabled={isSearching}
              className="h-16 pl-16 pr-32 text-lg bg-black/60 hover:bg-black/80 focus:bg-black/90 text-white placeholder:text-gray-300 border-2 border-white/20 hover:border-primary/50 focus:border-primary transition-all rounded-full backdrop-blur-sm disabled:opacity-70" />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                {isSearching ? 'Analyse...' : 'Recherche IA'}
              </div>
            </div>
          </div>
          <p className="text-sm text-white mt-3 text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            Décrivez ce que vous cherchez en langage naturel
          </p>
        </form>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
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
    </section>);

}