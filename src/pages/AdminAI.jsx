import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, AlertCircle, CheckCircle2, Brain, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAI() {
  const queryClient = useQueryClient();
  const [systemInstructions, setSystemInstructions] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: () => base44.entities.AIConfig.list('-created_date', 100),
    initialData: [],
    onSuccess: (data) => {
      const instructions = data.find(c => c.config_key === 'system_instructions');
      const knowledge = data.find(c => c.config_key === 'knowledge_base');
      
      if (instructions) setSystemInstructions(instructions.config_value);
      if (knowledge) setKnowledgeBase(knowledge.config_value);
    }
  });

  React.useEffect(() => {
    const instructions = configs.find(c => c.config_key === 'system_instructions');
    const knowledge = configs.find(c => c.config_key === 'knowledge_base');
    
    if (instructions) setSystemInstructions(instructions.config_value);
    if (knowledge) setKnowledgeBase(knowledge.config_value);
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = configs.find(c => c.config_key === key);
      
      if (existing) {
        return base44.entities.AIConfig.update(existing.id, { config_value: value });
      } else {
        return base44.entities.AIConfig.create({
          config_key: key,
          config_value: value,
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-configs']);
      toast.success('Configuration IA sauvegardée');
    }
  });

  const handleSaveInstructions = () => {
    saveMutation.mutate({ key: 'system_instructions', value: systemInstructions });
  };

  const handleSaveKnowledge = () => {
    saveMutation.mutate({ key: 'knowledge_base', value: knowledgeBase });
  };

  const handleSaveAll = () => {
    Promise.all([
      saveMutation.mutateAsync({ key: 'system_instructions', value: systemInstructions }),
      saveMutation.mutateAsync({ key: 'knowledge_base', value: knowledgeBase })
    ]).then(() => {
      toast.success('Toutes les configurations IA sauvegardées');
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
      </div>
    );
  }

  const defaultInstructions = `Tu es l'assistant commercial expert de l'Atelier Art Royal, spécialiste de la haute couture maçonnique française.

RÔLE:
- Conseiller les visiteurs sur les produits adaptés à leur grade et rite
- Renseigner sur la disponibilité et les délais
- Guider vers les pages appropriées du catalogue
- Répondre aux questions sur les produits, matériaux, personnalisations
- Apporter ton expertise sur la tradition maçonnique et l'artisanat

COMPORTEMENT:
- Sois chaleureux, professionnel et respectueux
- Utilise un langage élégant adapté à notre clientèle
- Mentionne toujours le stock disponible
- Propose des alternatives si un produit est indisponible
- Suggère des produits complémentaires pertinents
- N'invente jamais de prix ou de stocks, utilise uniquement les données fournies`;

  const defaultKnowledge = `ATELIER ART ROYAL - BASE DE CONNAISSANCES

À PROPOS:
- Atelier de haute couture maçonnique basé en France
- Fabrication artisanale française (Made in France)
- Spécialiste des décors maçonniques depuis plusieurs générations
- Qualité premium et respect de la tradition

PRODUITS:
- Tabliers maçonniques sur-mesure (tous rites et grades)
- Sautoirs et cordons
- Bijoux et décors
- Gants blancs et accessoires
- Personnalisation broderie possible

RITES PRINCIPAUX:
- REAA (Rite Écossais Ancien et Accepté)
- RER (Rite Écossais Rectifié)
- RF (Rite Français)
- GLDF et autres obédiences

SERVICES:
- Livraison France et international
- Fabrication sur-mesure
- Service client : +33 6 46 68 36 10
- Email : contact@artroyal.fr
- Paiement sécurisé

DÉLAIS:
- Produits en stock : expédition sous 48-72h
- Sur-mesure : 2 à 4 semaines selon complexité
- Précommandes acceptées sur certains produits`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-primary" />
          Intelligence Artificielle
        </h1>
        <p className="text-muted-foreground">
          Configuration de l'assistant virtuel conversationnel
        </p>
      </div>

      <div className="grid gap-6 mb-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Statut de l'IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modèle actif</p>
                <p className="font-semibold">Groq - Llama 3.1 70B</p>
              </div>
              <Badge variant="default" className="bg-green-600">
                Opérationnel
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Instructions Système
            </CardTitle>
            <CardDescription>
              Définit le comportement, le rôle et la personnalité de l'assistant IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={systemInstructions}
              onChange={(e) => setSystemInstructions(e.target.value)}
              placeholder={defaultInstructions}
              rows={15}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveInstructions} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder les instructions
              </Button>
              <Button
                variant="outline"
                onClick={() => setSystemInstructions(defaultInstructions)}
              >
                Réinitialiser par défaut
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Base de Connaissances
            </CardTitle>
            <CardDescription>
              Informations spécifiques sur l'entreprise, services, politiques, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              placeholder={defaultKnowledge}
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveKnowledge} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder la base de connaissances
              </Button>
              <Button
                variant="outline"
                onClick={() => setKnowledgeBase(defaultKnowledge)}
              >
                Réinitialiser par défaut
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save All */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <Button
              onClick={handleSaveAll}
              disabled={saveMutation.isPending}
              size="lg"
              className="w-full"
            >
              <Save className="w-5 h-5 mr-2" />
              Sauvegarder toutes les configurations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Card className="bg-blue-600/10 border-blue-600/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-blue-400">Conseils d'utilisation</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>L'IA a accès en temps réel aux produits, stocks, rites, grades et catégories</li>
                <li>Plus les instructions sont précises, meilleure sera la qualité des réponses</li>
                <li>La base de connaissances enrichit le contexte de l'IA sans modifier son comportement</li>
                <li>Testez régulièrement l'assistant avec des questions types de vos clients</li>
                <li>L'IA peut suggérer des produits et rediriger vers les pages appropriées</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}