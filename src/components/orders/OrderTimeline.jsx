import React from 'react';
import { Check, Package, Truck, Home, Clock, Palette, Cog, CheckCircle, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const timelineSteps = [
  { key: 'pending', label: 'Commande reçue', icon: Clock },
  { key: 'design', label: 'En design', icon: Palette },
  { key: 'production', label: 'En production', icon: Cog },
  { key: 'quality_control', label: 'Contrôle qualité', icon: CheckCircle },
  { key: 'packaging', label: 'Emballage', icon: Box },
  { key: 'shipped', label: 'Expédiée', icon: Truck },
  { key: 'delivered', label: 'Livrée', icon: Home }
];

export default function OrderTimeline({ currentStatus }) {
  const getCurrentIndex = () => {
    return timelineSteps.findIndex(step => step.key === currentStatus);
  };

  const currentIndex = getCurrentIndex();
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800 font-medium">
          Cette commande a été annulée
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {timelineSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex-1 relative">
              <div className="flex flex-col items-center">
                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all z-10 bg-background',
                    isCompleted
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-400',
                    isCurrent && 'ring-4 ring-primary/20'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Label */}
                <p
                  className={cn(
                    'text-xs font-medium mt-2 text-center',
                    isCompleted ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>

              {/* Line */}
              {index < timelineSteps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2',
                    isCompleted ? 'bg-primary' : 'bg-gray-300'
                  )}
                  style={{ zIndex: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}