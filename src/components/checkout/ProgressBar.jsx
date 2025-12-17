import React from 'react';
import { Check } from 'lucide-react';

export default function ProgressBar({ currentStep }) {
  const steps = [
    { id: 'cart', label: 'Panier' },
    { id: 'checkout', label: 'Livraison' },
    { id: 'confirmation', label: 'Confirmation' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" style={{ zIndex: 0 }}>
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative" style={{ zIndex: 1 }}>
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-primary border-primary text-white' 
                    : isCurrent 
                    ? 'bg-white border-primary text-primary shadow-lg' 
                    : 'bg-white border-border text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>
              <span 
                className={`mt-2 text-sm font-medium ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}