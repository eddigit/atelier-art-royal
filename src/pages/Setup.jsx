import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Settings, 
  Mail, 
  Key, 
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Server,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SUPER_ADMIN_PASSWORD = '557577';

export default function Setup() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    contactEmail: 'contact@artroyal.fr',
    supportEmail: 'contact@artroyal.fr',
    commercialPhone: '+33 6 46 68 36 10',
    smtpProvider: 'Base44 (Intégré)',
    smtpStatus: 'Actif'
  });

  const [ecommerceConfig, setEcommerceConfig] = useState({
    siteName: 'Atelier Art Royal',
    currency: 'EUR',
    shippingCost: 15,
    freeShippingThreshold: 500,
    taxRate: 20,
    orderPrefix: 'AR-',
    allowGuestCheckout: true,
    enableReviews: true
  });

  const [secrets, setSecrets] = useState([
    { id: 1, name: 'STRIPE_API_KEY', value: '', description: 'Clé API Stripe pour les paiements', visible: false },
    { id: 2, name: 'STRIPE_WEBHOOK_SECRET', value: '', description: 'Secret webhook Stripe', visible: false },
    { id: 3, name: 'SMTP_API_KEY', value: '', description: 'Clé API pour service email externe (si nécessaire)', visible: false }
  ]);

  const [newSecret, setNewSecret] = useState({ name: '', value: '', description: '' });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === SUPER_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('Accès autorisé');
    } else {
      toast.error('Mot de passe incorrect');
      setPassword('');
    }
  };

  const handleSaveEmailConfig = () => {
    // In production, this would save to a database or configuration file
    toast.success('Configuration email sauvegardée');
  };

  const handleSaveEcommerceConfig = () => {
    // In production, this would save to a database or configuration file
    toast.success('Configuration e-commerce sauvegardée');
  };

  const toggleSecretVisibility = (id) => {
    setSecrets(secrets.map(s => s.id === id ? {...s, visible: !s.visible} : s));
  };

  const handleSaveSecrets = () => {
    toast.success('Secrets sauvegardés avec succès');
  };

  const handleAddSecret = () => {
    if (!newSecret.name || !newSecret.value) {
      toast.error('Veuillez remplir le nom et la valeur');
      return;
    }
    setSecrets([...secrets, { ...newSecret, id: Date.now(), visible: false }]);
    setNewSecret({ name: '', value: '', description: '' });
    toast.success('Secret ajouté');
  };

  const handleDeleteSecret = (id) => {
    setSecrets(secrets.filter(s => s.id !== id));
    toast.success('Secret supprimé');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Accès Super Admin</CardTitle>
            <CardDescription>
              Cette page contient des configurations techniques sensibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe super admin"
                  className="mt-2"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Accéder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Configuration Technique</h1>
        </div>
        <p className="text-muted-foreground">
          Paramètres avancés et configuration du système
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl">
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email & SMTP
          </TabsTrigger>
          <TabsTrigger value="ecommerce">
            <ShoppingCart className="w-4 h-4 mr-2" />
            E-commerce
          </TabsTrigger>
          <TabsTrigger value="secrets">
            <Key className="w-4 h-4 mr-2" />
            Secrets
          </TabsTrigger>
          <TabsTrigger value="technical">
            <Server className="w-4 h-4 mr-2" />
            Technique
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Email</CardTitle>
              <CardDescription>
                Paramètres de messagerie et notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email de Contact</Label>
                  <Input
                    id="contactEmail"
                    value={emailConfig.contactEmail}
                    onChange={(e) => setEmailConfig({...emailConfig, contactEmail: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Email Support</Label>
                  <Input
                    id="supportEmail"
                    value={emailConfig.supportEmail}
                    onChange={(e) => setEmailConfig({...emailConfig, supportEmail: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="commercialPhone">Téléphone Commercial</Label>
                <Input
                  id="commercialPhone"
                  value={emailConfig.commercialPhone}
                  onChange={(e) => setEmailConfig({...emailConfig, commercialPhone: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Serveur SMTP</Label>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {emailConfig.smtpStatus}
                  </Badge>
                </div>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fournisseur:</span>
                    <span className="text-sm text-muted-foreground">{emailConfig.smtpProvider}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le système utilise le service SMTP intégré de Base44 pour l'envoi d'emails.
                    Tous les emails sont envoyés depuis {emailConfig.contactEmail}
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveEmailConfig}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Sauvegarder la configuration email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* E-commerce Configuration */}
        <TabsContent value="ecommerce" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration E-commerce</CardTitle>
              <CardDescription>
                Paramètres de la boutique en ligne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Nom du Site</Label>
                  <Input
                    id="siteName"
                    value={ecommerceConfig.siteName}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, siteName: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <Input
                    id="currency"
                    value={ecommerceConfig.currency}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, currency: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingCost">Frais de Livraison (€)</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    value={ecommerceConfig.shippingCost}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, shippingCost: parseFloat(e.target.value)})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="freeShipping">Livraison Gratuite à partir de (€)</Label>
                  <Input
                    id="freeShipping"
                    type="number"
                    value={ecommerceConfig.freeShippingThreshold}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, freeShippingThreshold: parseFloat(e.target.value)})}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={ecommerceConfig.taxRate}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, taxRate: parseFloat(e.target.value)})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="orderPrefix">Préfixe Numéro de Commande</Label>
                  <Input
                    id="orderPrefix"
                    value={ecommerceConfig.orderPrefix}
                    onChange={(e) => setEcommerceConfig({...ecommerceConfig, orderPrefix: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label>Achat Invité</Label>
                  <Badge variant={ecommerceConfig.allowGuestCheckout ? "default" : "outline"}>
                    {ecommerceConfig.allowGuestCheckout ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Avis Clients</Label>
                  <Badge variant={ecommerceConfig.enableReviews ? "default" : "outline"}>
                    {ecommerceConfig.enableReviews ? 'Activé' : 'Désactivé'}
                  </Badge>
                </div>
              </div>

              <Button onClick={handleSaveEcommerceConfig}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Sauvegarder la configuration e-commerce
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secrets Configuration */}
        <TabsContent value="secrets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Secrets</CardTitle>
              <CardDescription>
                Clés API, mots de passe et variables sensibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-400 mb-1">Important</p>
                  <p className="text-muted-foreground">
                    Ces secrets sont stockés localement dans cette session. Pour une configuration en production,
                    utilisez les variables d'environnement du dashboard Base44.
                  </p>
                </div>
              </div>

              {/* Existing Secrets */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Secrets Configurés
                </h4>
                <div className="space-y-2">
                  {secrets.map((secret) => (
                    <div key={secret.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono font-semibold text-sm mb-1">{secret.name}</div>
                          {secret.description && (
                            <p className="text-xs text-muted-foreground">{secret.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSecret(secret.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type={secret.visible ? 'text' : 'password'}
                          value={secret.value}
                          onChange={(e) => setSecrets(secrets.map(s => s.id === secret.id ? {...s, value: e.target.value} : s))}
                          placeholder="Entrez la valeur..."
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecretVisibility(secret.id)}
                        >
                          {secret.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Secret */}
              <div className="border-t pt-6">
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4" />
                  Ajouter un Secret
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>Nom du Secret</Label>
                    <Input
                      value={newSecret.name}
                      onChange={(e) => setNewSecret({...newSecret, name: e.target.value})}
                      placeholder="Ex: PAYMENT_API_KEY"
                      className="mt-2 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <Input
                      type="password"
                      value={newSecret.value}
                      onChange={(e) => setNewSecret({...newSecret, value: e.target.value})}
                      placeholder="Entrez la valeur secrète..."
                      className="mt-2 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Description (optionnel)</Label>
                    <Textarea
                      value={newSecret.description}
                      onChange={(e) => setNewSecret({...newSecret, description: e.target.value})}
                      placeholder="Description du secret..."
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleAddSecret}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter le Secret
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSecrets} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Sauvegarder tous les secrets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Configuration */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Technique</CardTitle>
              <CardDescription>
                Informations système et variables d'environnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Secrets et Variables</h4>
                    <p className="text-sm text-muted-foreground">
                      Les secrets et clés API sont gérés via le dashboard Base44.
                      Accédez au dashboard → Settings → Environment Variables pour les configurer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Services Intégrés
                </h4>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Base44 SDK</span>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Base44 SMTP</span>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Base44 Storage</span>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Base44 Auth</span>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informations Système</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground mb-1">Plateforme</div>
                    <div className="font-semibold">Base44 Platform V3</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground mb-1">Framework</div>
                    <div className="font-semibold">React + Tailwind CSS</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground mb-1">Base de données</div>
                    <div className="font-semibold">Base44 Database</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-muted-foreground mb-1">Stockage</div>
                    <div className="font-semibold">Base44 Storage</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}