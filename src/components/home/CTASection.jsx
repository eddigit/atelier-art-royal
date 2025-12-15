import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Personnalisation Offerte</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Prêt à Commander Votre <br />
              <span className="text-primary">Création Sur-Mesure ?</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Que vous recherchiez un tablier d'exception, un sautoir personnalisé ou un ensemble complet, 
              nos artisans sont à votre service pour créer la pièce parfaite.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link to={createPageUrl('Catalog')}>
                <Button size="lg" className="group text-lg px-8 py-6">
                  Découvrir le Catalogue
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to={createPageUrl('Contact')}>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Demander un Devis
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Livraison sous 5-7 jours
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Paiement sécurisé
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Garantie qualité
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}