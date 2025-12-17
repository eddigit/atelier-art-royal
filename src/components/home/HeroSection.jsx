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
      // Récupérer les données de référence pour le mapping
      const [ritesData, obediencesData, degreeOrdersData, categoriesData] = await Promise.all([
      base44.entities.Rite.list('order', 100),
      base44.entities.Obedience.list('order', 100),
      base44.entities.DegreeOrder.list('level', 200),
      base44.entities.Category.list('order', 100)]
      );

      // Utiliser l'IA pour analyser la requête et extraire les critères de recherche
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant de recherche expert pour l'Atelier Art Royal, spécialisé dans la haute couture maçonnique.

HIÉRARCHIE DE RECHERCHE:
1. RITE → 2. OBÉDIENCE → 3. TYPE DE LOGE → 4. DEGRÉ & ORDRE → 5. CATÉGORIE

DONNÉES DISPONIBLES:

RITES:
${ritesData.map((r) => `- ${r.name} (code: ${r.code})`).join('\n')}

OBÉDIENCES:
${obediencesData.map((o) => `- ${o.name} (code: ${o.code})`).join('\n')}

DEGRÉS & ORDRES:
Loge Symbolique: ${degreeOrdersData.filter((d) => d.loge_type === 'Loge Symbolique').map((d) => d.name).join(', ')}
Loge Hauts Grades: ${degreeOrdersData.filter((d) => d.loge_type === 'Loge Hauts Grades').map((d) => d.name).join(', ')}

CATÉGORIES:
${categoriesData.map((c) => c.name).join(', ')}

ANALYSE cette requête et extrais TOUS les critères (utilise les NOMS EXACTS):
"${searchQuery}"

RÈGLES:
- Utilise les noms EXACTS des rites, obédiences, degrés (majuscules/accents inclus)
- Si un degré 1-3 est mentionné → logeType: "Loge Symbolique"
- Si un degré 4+ ou ordre est mentionné → logeType: "Loge Hauts Grades"
- "tablier" = Tabliers, "sautoir" = Sautoirs, "bijou" = Bijoux, "gant" = Gants, "décor" = Décors
- "promo/promotion/réduction" → showPromotions: true
- "nouveau/nouveauté" → showNew: true

EXEMPLES:
- "tablier REAA maître" → {rite: "REAA", degreeOrder: "Maître", category: "Tabliers", logeType: "Loge Symbolique"}
- "sautoir 18ème" → {degreeOrder: "18ème degré", category: "Sautoirs", logeType: "Loge Hauts Grades"}
- "bijoux apprenti GLNF" → {obedience: "GLNF", degreeOrder: "Apprenti", category: "Bijoux", logeType: "Loge Symbolique"}`,
        response_json_schema: {
          type: "object",
          properties: {
            search: { type: "string" },
            rite: { type: "string" },
            obedience: { type: "string" },
            logeType: { type: "string" },
            degreeOrder: { type: "string" },
            category: { type: "string" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            showPromotions: { type: "boolean" },
            showNew: { type: "boolean" }
          }
        }
      });

      // Mapper les noms aux IDs
      const params = new URLSearchParams();

      if (response.rite) {
        const rite = ritesData.find((r) =>
        r.name.toLowerCase() === response.rite.toLowerCase() ||
        r.code.toLowerCase() === response.rite.toLowerCase()
        );
        if (rite) params.append('rite', rite.id);
      }

      if (response.obedience) {
        const obedience = obediencesData.find((o) =>
        o.name.toLowerCase() === response.obedience.toLowerCase() ||
        o.code.toLowerCase() === response.obedience.toLowerCase()
        );
        if (obedience) params.append('obedience', obedience.id);
      }

      if (response.degreeOrder) {
        const degreeOrder = degreeOrdersData.find((d) =>
        d.name.toLowerCase().includes(response.degreeOrder.toLowerCase()) ||
        response.degreeOrder.toLowerCase().includes(d.name.toLowerCase())
        );
        if (degreeOrder) params.append('degreeOrder', degreeOrder.id);
      }

      if (response.category) {
        const category = categoriesData.find((c) =>
        c.name.toLowerCase().includes(response.category.toLowerCase()) ||
        response.category.toLowerCase().includes(c.name.toLowerCase())
        );
        if (category) params.append('category', category.id);
      }

      if (response.logeType) params.append('logeType', response.logeType);
      if (response.search) params.append('search', response.search);
      if (response.minPrice) params.append('minPrice', response.minPrice.toString());
      if (response.maxPrice) params.append('maxPrice', response.maxPrice.toString());
      if (response.showPromotions) params.append('showPromotions', 'true');
      if (response.showNew) params.append('showNew', 'true');

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
        <div className="absolute inset-0" style={{ backgroundColor: '#0a182d', opacity: 0.6 }} />
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