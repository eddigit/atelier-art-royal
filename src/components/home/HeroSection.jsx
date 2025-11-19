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

    setIsSearching(true);
    
    try {
      // Utiliser l'IA pour analyser la requête et extraire les critères de recherche
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant de recherche pour une boutique de produits maçonniques (tabliers, sautoirs, bijoux, décors).
        
Analyse cette requête utilisateur et extrais les critères de recherche pertinents :
"${searchQuery}"

Retourne un objet JSON avec les champs suivants (uniquement ceux qui sont pertinents) :
- search: terme de recherche général (string)
- rite: ID ou nom du rite maçonnique mentionné (REAA, RER, GLDF, etc.) (string)
- category: catégorie de produit (Tabliers, Sautoirs, Bijoux, Gants, Décors) (string)
- grade: grade maçonnique mentionné (Apprenti, Compagnon, Maître, etc.) (string)
- minPrice: prix minimum si mentionné (number)
- maxPrice: prix maximum si mentionné (number)
- showPromotions: true si l'utilisateur recherche des promotions/réductions (boolean)
- showNew: true si l'utilisateur recherche des nouveautés (boolean)

Si aucun critère spécifique n'est identifié, retourne juste { "search": "requête originale" }`,
        response_json_schema: {
          type: "object",
          properties: {
            search: { type: "string" },
            rite: { type: "string" },
            category: { type: "string" },
            grade: { type: "string" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            showPromotions: { type: "boolean" },
            showNew: { type: "boolean" }
          }
        }
      });

      // Construire l'URL avec les paramètres
      const params = new URLSearchParams();
      
      Object.entries(response).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Rediriger vers le catalogue avec les paramètres
      window.location.href = createPageUrl('Catalog') + '?' + params.toString();
      
    } catch (error) {
      console.error('Erreur recherche IA:', error);
      toast.error('Erreur lors de la recherche');
      // Fallback: recherche simple
      window.location.href = createPageUrl('Catalog') + '?search=' + encodeURIComponent(searchQuery);
    } finally {
      setIsSearching(false);
    }
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
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Haute Couture Maçonnique
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
        
        <h1 className="text-hero text-gradient mb-6 drop-shadow-lg">
          Atelier Art Royal
        </h1>
        
        <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg">
          Création d'exception pour tous les Rites et Grades.<br />
          L'élégance au service de la Tradition.
        </p>

        {/* AI-Powered Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative group">
            {isSearching ? (
              <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-spin z-10" />
            ) : (
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-hover:text-primary group-focus-within:text-primary transition-colors z-10" />
            )}
            <Input
              type="text"
              name="search"
              placeholder="Ex: tablier REAA en promotion, sautoir maître, nouveautés RER..."
              disabled={isSearching}
              className="h-16 pl-16 pr-32 text-lg bg-black/60 hover:bg-black/80 focus:bg-black/90 text-white placeholder:text-gray-300 border-2 border-white/20 hover:border-primary/50 focus:border-primary transition-all rounded-full backdrop-blur-sm disabled:opacity-70"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                {isSearching ? 'Analyse...' : 'Recherche IA'}
              </div>
            </div>
          </div>
          <p className="text-sm text-white mt-3 text-center drop-shadow-lg">
            Décrivez ce que vous cherchez en langage naturel
          </p>
        </form>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white drop-shadow-lg">
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