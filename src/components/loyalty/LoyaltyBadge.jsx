import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LoyaltyBadge({ tier, points, compact = false }) {
  const tierConfig = {
    bronze: {
      icon: Award,
      color: 'from-amber-700 to-amber-900',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-100',
      label: 'Bronze',
      glow: 'shadow-amber-500/50'
    },
    silver: {
      icon: Star,
      color: 'from-slate-400 to-slate-600',
      textColor: 'text-slate-700',
      bgColor: 'bg-slate-100',
      label: 'Argent',
      glow: 'shadow-slate-500/50'
    },
    gold: {
      icon: Crown,
      color: 'from-yellow-400 to-yellow-600',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      label: 'Or',
      glow: 'shadow-yellow-500/50'
    },
    platinum: {
      icon: Zap,
      color: 'from-purple-400 to-purple-600',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-100',
      label: 'Platine',
      glow: 'shadow-purple-500/50'
    }
  };

  const config = tierConfig[tier] || tierConfig.bronze;
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge className={cn('flex items-center gap-1', config.bgColor, config.textColor)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn(
        'relative p-6 rounded-xl bg-gradient-to-br',
        config.color,
        'shadow-lg',
        config.glow
      )}
    >
      <div className="absolute inset-0 bg-white/10 rounded-xl backdrop-blur-sm" />
      
      <div className="relative z-10 flex items-center justify-between text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-6 h-6" />
            <span className="text-xl font-bold">{config.label}</span>
          </div>
          <div className="text-2xl font-bold">{points} points</div>
          <div className="text-sm opacity-90">Membre fidèle</div>
        </div>
        
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Icon className="w-16 h-16 opacity-20" />
        </motion.div>
      </div>
    </motion.div>
  );
}