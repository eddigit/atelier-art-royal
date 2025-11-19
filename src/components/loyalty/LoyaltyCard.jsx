import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Gift, TrendingUp, Star } from 'lucide-react';

const tierConfig = {
  bronze: {
    name: 'Bronze',
    color: 'bg-orange-600',
    icon: '🥉',
    nextTier: 'silver',
    threshold: 500,
    benefits: ['5% de réduction', 'Accès aux ventes privées']
  },
  silver: {
    name: 'Argent',
    color: 'bg-gray-400',
    icon: '🥈',
    nextTier: 'gold',
    threshold: 1500,
    benefits: ['10% de réduction', 'Livraison offerte dès 300€', 'Accès aux ventes privées']
  },
  gold: {
    name: 'Or',
    color: 'bg-yellow-500',
    icon: '🥇',
    nextTier: 'platinum',
    threshold: 3000,
    benefits: ['15% de réduction', 'Livraison offerte', 'Produits exclusifs', 'Support prioritaire']
  },
  platinum: {
    name: 'Platine',
    color: 'bg-purple-600',
    icon: '💎',
    nextTier: null,
    threshold: null,
    benefits: ['20% de réduction', 'Livraison offerte', 'Produits exclusifs', 'Créations sur-mesure', 'Service VIP']
  }
};

export default function LoyaltyCard({ loyaltyData }) {
  if (!loyaltyData) return null;

  const { points, tier, lifetime_points } = loyaltyData;
  const tierInfo = tierConfig[tier];
  const nextTierInfo = tierInfo.nextTier ? tierConfig[tierInfo.nextTier] : null;
  
  const progressToNextTier = nextTierInfo 
    ? Math.min(100, (lifetime_points / nextTierInfo.threshold) * 100)
    : 100;
  
  const pointsNeeded = nextTierInfo 
    ? nextTierInfo.threshold - lifetime_points
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${tierInfo.color} text-white`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{tierInfo.icon}</span>
            Programme Fidélité - {tierInfo.name}
          </CardTitle>
          <Award className="w-8 h-8" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Points actuels */}
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">{points}</div>
          <p className="text-muted-foreground">Points disponibles</p>
          <p className="text-xs text-muted-foreground mt-1">
            1€ d'achat = 1 point | 100 points = 5€ de réduction
          </p>
        </div>

        {/* Progression vers le palier suivant */}
        {nextTierInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progression vers {nextTierInfo.name}
              </span>
              <span className="font-semibold">
                {pointsNeeded} points restants
              </span>
            </div>
            <Progress value={progressToNextTier} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              Total cumulé: {lifetime_points} points
            </p>
          </div>
        )}

        {/* Avantages du palier actuel */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Vos avantages
          </h4>
          <div className="space-y-2">
            {tierInfo.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-primary fill-current" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Paliers */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
            Tous les paliers
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(tierConfig).map(([key, info]) => (
              <div
                key={key}
                className={`text-center p-2 rounded-lg border-2 ${
                  tier === key ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <div className="text-2xl mb-1">{info.icon}</div>
                <div className="text-xs font-medium">{info.name}</div>
                {info.threshold && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {info.threshold} pts
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}