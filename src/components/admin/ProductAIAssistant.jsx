import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProductAIAssistant({ product, onApply }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [copied, setCopied] = useState({});

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const productContext = `
Produit: ${product.name}
Description actuelle: ${product.description || 'Aucune'}
Prix: ${product.price}€
Catégorie: ${product.category_id || 'Non définie'}
Tags actuels: ${product.tags?.join(', ') || 'Aucun'}
      `.trim();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert en marketing et SEO pour une boutique de haute couture maçonnique française (Atelier Art Royal).

Contexte du produit:
${productContext}

Génère des suggestions optimisées pour ce produit:

1. **Titre accrocheur** (max 60 caractères) : Un titre vendeur qui capture l'essence du produit
2. **Description courte** (max 160 caractères) : Pour les aperçus et meta descriptions
3. **Description longue SEO** (200-300 mots) : 
   - Optimisée pour le référencement
   - Utilise des mots-clés pertinents (haute couture maçonnique, fait en France, qualité artisanale)
   - Met en valeur l'artisanat français
   - Ton élégant et professionnel
4. **Tags pertinents** : 5-8 tags SEO (ex: "tablier-reaa", "haute-couture", "fait-main", etc.)
5. **Meta title SEO** (max 60 caractères)
6. **Meta description SEO** (max 160 caractères)

Réponds en JSON avec cette structure exacte.`,
        response_json_schema: {
          type: "object",
          properties: {
            titre_accrocheur: { type: "string" },
            description_courte: { type: "string" },
            description_longue: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            meta_title: { type: "string" },
            meta_description: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      toast.success('Suggestions IA générées avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération des suggestions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied({ [field]: true });
    setTimeout(() => setCopied({}), 2000);
  };

  const applyAllSuggestions = () => {
    if (!suggestions) return;
    
    onApply({
      name: suggestions.titre_accrocheur,
      short_description: suggestions.description_courte,
      description: suggestions.description_longue,
      tags: suggestions.tags
    });
    
    toast.success('Suggestions appliquées au produit');
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Assistant IA Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Utilisez l'IA pour générer des descriptions optimisées SEO, des titres accrocheurs et des tags pertinents pour ce produit.
            </p>
            <Button
              onClick={generateSuggestions}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer les suggestions IA
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Titre accrocheur */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Titre accrocheur</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.titre_accrocheur, 'titre')}
                >
                  {copied.titre ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm bg-muted p-3 rounded-lg">{suggestions.titre_accrocheur}</p>
            </div>

            {/* Description courte */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Description courte</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.description_courte, 'courte')}
                >
                  {copied.courte ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm bg-muted p-3 rounded-lg">{suggestions.description_courte}</p>
            </div>

            {/* Description longue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Description longue SEO</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.description_longue, 'longue')}
                >
                  {copied.longue ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm bg-muted p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-line">
                {suggestions.description_longue}
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tags recommandés</h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="bg-primary/10">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Meta SEO */}
            <div className="space-y-2 border-t border-border pt-4">
              <h4 className="font-semibold text-sm">Meta SEO (pour référence)</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><strong>Title:</strong> {suggestions.meta_title}</p>
                <p><strong>Description:</strong> {suggestions.meta_description}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={applyAllSuggestions}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Appliquer toutes les suggestions
              </Button>
              <Button
                variant="outline"
                onClick={() => setSuggestions(null)}
              >
                Régénérer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}