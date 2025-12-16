import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Star, Crown, Zap } from 'lucide-react';

export default function LoyaltyProgress({ currentPoints }) {
  const tiers = [
    { name: 'Bronze', threshold: 0, icon: Award, color: 'text-amber-700' },
    { name: 'Argent', threshold: 500, icon: Star, color: 'text-slate-600' },
    { name: 'Or', threshold: 1500, icon: Crown, color: 'text-yellow-600' },
    { name: 'Platine', threshold: 3000, icon: Zap, color: 'text-purple-600' }
  ];

  const getCurrentTier = () => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentPoints >= tiers[i].threshold) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTier();
  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1];

  const pointsToNextTier = nextTier ? nextTier.threshold - currentPoints : 0;
  const progressPercent = nextTier 
    ? ((currentPoints - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
    : 100;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Progression de fidélité</h3>
        
        <div className="flex items-center justify-between mb-6">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isActive = index <= currentTierIndex;
            const isCurrent = index === currentTierIndex;
            
            return (
              <motion.div
                key={tier.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    transition-all
                  `}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span className={`text-xs mt-2 font-medium ${isActive ? tier.color : 'text-muted-foreground'}`}>
                  {tier.name}
                </span>
                <span className="text-xs text-muted-foreground">{tier.threshold}+</span>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Niveau actuel : {currentTier.name}</span>
            {nextTier && (
              <span className="text-muted-foreground">
                {pointsToNextTier} points pour {nextTier.name}
              </span>
            )}
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {nextTier && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-primary/10 rounded-lg text-sm"
          >
            <span className="font-semibold">Avantages {nextTier.name} :</span>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {nextTier.name === 'Argent' && (
                <>
                  <li>✓ Livraison gratuite dès 50€</li>
                  <li>✓ Accès anticipé aux soldes</li>
                </>
              )}
              {nextTier.name === 'Or' && (
                <>
                  <li>✓ Livraison gratuite sans minimum</li>
                  <li>✓ Réductions exclusives jusqu'à 20%</li>
                  <li>✓ Cadeau d'anniversaire</li>
                </>
              )}
              {nextTier.name === 'Platine' && (
                <>
                  <li>✓ Service client prioritaire</li>
                  <li>✓ Collections exclusives</li>
                  <li>✓ Invitations événements VIP</li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}