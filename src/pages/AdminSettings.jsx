import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Package, Tag, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminSettings() {
  const sections = [
    {
      title: 'Rites',
      description: 'Gérer les Rites maçonniques',
      icon: Award,
      link: '/admin/rites',
      color: 'bg-blue-500'
    },
    {
      title: 'Grades',
      description: 'Gérer les Grades par Rite',
      icon: Award,
      link: '/admin/grades',
      color: 'bg-purple-500'
    },
    {
      title: 'Catégories',
      description: 'Gérer les catégories de produits',
      icon: Tag,
      link: '/admin/categories',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        <span className="text-gradient">Configuration</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${section.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${section.color.replace('bg-', 'text-')}`} />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                <p className="text-xs text-muted-foreground italic">
                  Configuration disponible via le dashboard Base44
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Import CSV de Produits</h3>
            <p className="text-sm text-muted-foreground">
              Pour importer des produits en masse, utilisez la fonctionnalité d'import CSV disponible dans le dashboard Base44.
              Assurez-vous que vos données incluent les champs obligatoires : <strong>Rite</strong> et <strong>Grade</strong>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Franco de Port</h3>
            <p className="text-sm text-muted-foreground">
              Le franco de port à partir de 500€ est configuré automatiquement dans le système de checkout.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Paiement Stripe</h3>
            <p className="text-sm text-muted-foreground">
              L'intégration Stripe peut être configurée via les fonctions backend pour traiter les paiements de manière sécurisée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}