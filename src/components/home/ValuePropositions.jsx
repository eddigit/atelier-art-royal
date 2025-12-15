import React from 'react';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';

export default function ValuePropositions() {
  const values = [
    {
      icon: Shield,
      title: 'Qualité Garantie',
      description: 'Fabrication artisanale française avec les meilleurs matériaux'
    },
    {
      icon: Sparkles,
      title: 'Sur-Mesure',
      description: 'Personnalisation complète selon vos spécifications exactes'
    },
    {
      icon: Truck,
      title: 'Livraison Rapide',
      description: 'Expédition soignée sous 5-7 jours ouvrés partout en France'
    },
    {
      icon: Award,
      title: 'Excellence Reconnue',
      description: 'Des milliers de clients satisfaits dans toutes les obédiences'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <value.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}