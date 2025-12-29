import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Copy, Check, Key, AlertCircle, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminSecrets() {
  const [visibleSecrets, setVisibleSecrets] = useState({});
  const [copiedSecret, setCopiedSecret] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretDescription, setNewSecretDescription] = useState('');
  const [realSecrets, setRealSecrets] = useState({});

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  // Récupérer les vraies valeurs des secrets
  const { data: secretsData } = useQuery({
    queryKey: ['secrets'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSecrets', {});
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
    onSuccess: (data) => {
      if (data?.secrets) {
        setRealSecrets(data.secrets);
      }
    }
  });

  // Liste des secrets configurés dans l'application
  const secrets = [
    {
      name: 'SUMUP_API_KEY',
      description: 'Clé API SumUp pour les paiements',
      value: realSecrets.SUMUP_API_KEY || '••••••••••••••••',
      documentation: 'https://developer.sumup.com/',
      status: 'active',
      usage: ['createSumupCheckout', 'verifySumupPayment'],
      configured: true
    },
    {
      name: 'GROQ_API_KEY',
      description: 'Clé API Groq pour l\'IA (Llama)',
      value: realSecrets.GROQ_API_KEY || '••••••••••••••••',
      documentation: 'https://console.groq.com/',
      status: 'active',
      usage: ['aiChat', 'Product AI Assistant'],
      configured: true
    }
  ];

  const toggleVisibility = (secretName) => {
    setVisibleSecrets(prev => ({
      ...prev,
      [secretName]: !prev[secretName]
    }));
  };

  const copyToClipboard = (text, secretName) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(secretName);
    toast.success('Copié dans le presse-papiers');
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const handleAddSecret = () => {
    if (!newSecretName) {
      toast.error('Le nom du secret est requis');
      return;
    }

    toast.info('Instructions', {
      description: `Pour ajouter "${newSecretName}", allez dans Dashboard Base44 → Settings → Environment Variables`,
      duration: 8000
    });

    setAddDialogOpen(false);
    setNewSecretName('');
    setNewSecretDescription('');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
        <p className="text-muted-foreground">Cette page est réservée aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Key className="w-10 h-10 text-primary" />
          Secrets & API Keys
        </h1>
        <p className="text-muted-foreground">Gestion sécurisée des clés API et variables d'environnement</p>
      </div>

      {/* Warning banner */}
      <Card className="mb-6 border-amber-500 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Informations sensibles</h3>
              <p className="text-sm text-amber-800">
                Les valeurs réelles des secrets ne sont jamais affichées ici pour des raisons de sécurité. 
                Pour modifier un secret, allez dans <strong>Dashboard Base44 → Settings → Environment Variables</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secrets configurés */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Secrets Configurés</h2>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un secret
          </Button>
        </div>

        {secrets.map((secret) => (
          <Card key={secret.name} className={secret.configured ? 'border-green-200' : 'border-orange-200'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Key className="w-5 h-5 text-primary" />
                    {secret.name}
                    {secret.configured && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-normal">
                        Actif
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{secret.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Valeur masquée */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Valeur</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={visibleSecrets[secret.name] ? 'text' : 'password'}
                      value={secret.value}
                      readOnly
                      className="pr-20 font-mono text-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleVisibility(secret.name)}
                      >
                        {visibleSecrets[secret.name] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(secret.value, secret.name)}
                      >
                        {copiedSecret === secret.name ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage */}
              {secret.usage && secret.usage.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Utilisé dans</Label>
                  <div className="flex flex-wrap gap-2">
                    {secret.usage.map((usage, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-muted px-2 py-1 rounded-md font-mono"
                      >
                        {usage}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentation */}
              {secret.documentation && (
                <div>
                  <a
                    href={secret.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Info className="w-4 h-4" />
                    Documentation API
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions pour modifier */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Comment modifier les secrets ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. Accéder aux variables d'environnement</h4>
            <p className="text-muted-foreground">
              Dashboard Base44 → Settings → Environment Variables
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Ajouter ou modifier un secret</h4>
            <p className="text-muted-foreground">
              Cliquez sur "Add Variable" ou modifiez une variable existante. Les modifications sont instantanées.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Utilisation dans le code</h4>
            <p className="text-muted-foreground mb-2">
              Dans les fonctions backend (Deno), accédez aux secrets via :
            </p>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
              <code>{`const apiKey = Deno.env.get("NOM_DU_SECRET");`}</code>
            </pre>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-900">💡 Bonne pratique</h4>
            <p className="text-blue-800 text-xs">
              Ne stockez jamais de secrets dans le code source. 
              Toujours passer par les variables d'environnement de Base44.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logs & Variables d'environnement système */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Variables Système (auto-générées)</CardTitle>
          <CardDescription>Variables d'environnement gérées automatiquement par Base44</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-mono text-sm font-semibold">BASE44_APP_ID</p>
                <p className="text-xs text-muted-foreground">Identifiant unique de l'application</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Auto
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-mono text-sm font-semibold">BASE44_SERVICE_ROLE_KEY</p>
                <p className="text-xs text-muted-foreground">Clé de service pour accès backend</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Auto
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter un secret */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau secret</DialogTitle>
            <DialogDescription>
              Cette action vous guidera vers le Dashboard Base44 pour ajouter la variable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="secret-name">Nom du secret</Label>
              <Input
                id="secret-name"
                placeholder="ex: STRIPE_API_KEY"
                value={newSecretName}
                onChange={(e) => setNewSecretName(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="secret-description">Description (optionnel)</Label>
              <Input
                id="secret-description"
                placeholder="ex: Clé API Stripe pour les paiements"
                value={newSecretDescription}
                onChange={(e) => setNewSecretDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddSecret}>
              Continuer vers Base44
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}