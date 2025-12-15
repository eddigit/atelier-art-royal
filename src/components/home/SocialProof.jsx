import React from 'react';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SocialProof() {
  const testimonials = [
    {
      name: 'Jean-Pierre M.',
      lodge: 'Loge La Lumière - GODF',
      rating: 5,
      text: 'Une qualité exceptionnelle. Le tablier sur-mesure dépasse toutes mes attentes. Un véritable travail d\'artiste.',
      date: '2024'
    },
    {
      name: 'François D.',
      lodge: 'Atelier Saint-Jean - GLNF',
      rating: 5,
      text: 'Service impeccable et produits magnifiques. La personnalisation était exactement ce que je recherchais.',
      date: '2024'
    },
    {
      name: 'Michel L.',
      lodge: 'Loge L\'Harmonie - GLAMF',
      rating: 5,
      text: 'Livraison rapide, emballage soigné, et surtout une finition irréprochable. Je recommande vivement.',
      date: '2024'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ils Nous Font <span className="text-primary">Confiance</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Des milliers de francs-maçons satisfaits à travers la France
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="absolute top-4 right-4 opacity-10">
                  <Quote className="w-12 h-12 text-primary" />
                </div>
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-sm mb-4 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                <div className="border-t border-border pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.lodge}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center gap-12 text-center">
          <div>
            <p className="text-4xl font-bold text-primary mb-1">2000+</p>
            <p className="text-sm text-muted-foreground">Clients Satisfaits</p>
          </div>
          <div className="hidden md:block w-px h-16 bg-border" />
          <div>
            <p className="text-4xl font-bold text-primary mb-1">98%</p>
            <p className="text-sm text-muted-foreground">Taux de Satisfaction</p>
          </div>
          <div className="hidden md:block w-px h-16 bg-border" />
          <div>
            <p className="text-4xl font-bold text-primary mb-1">15+</p>
            <p className="text-sm text-muted-foreground">Années d'Expérience</p>
          </div>
        </div>
      </div>
    </section>
  );
}