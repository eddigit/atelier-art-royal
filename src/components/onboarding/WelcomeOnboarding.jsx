import React, { useState, useEffect } from 'react';
import { X, ArrowRight, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function WelcomeOnboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        // Utilisateur non connecté
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
          setTimeout(() => setShow(true), 2000);
        }
      }
    };

    checkOnboarding();
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShow(false);
  };

  const handleCreateAccount = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShow(false);
    base44.auth.redirectToLogin();
  };

  if (user || !show) return null;

  const steps = [
    {
      title: 'Bienvenue sur Atelier Art Royal',
      description: 'Pour commander nos créations sur-mesure, vous devez créer un compte en quelques secondes.',
      icon: UserPlus
    },
    {
      title: 'Comment créer votre compte ?',
      description: 'Cliquez sur le bouton ci-dessous. Sur la page de connexion, descendez en bas et cliquez sur "Sign Up" pour vous inscrire.',
      icon: CheckCircle
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="max-w-lg w-full shadow-2xl border-2 border-primary/20 animate-in zoom-in-95 duration-300">
        <CardContent className="p-8">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {step === 1 && (
              <div className="w-full bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm font-semibold text-primary mb-2">📝 Instructions :</p>
                <ol className="text-sm text-left space-y-2 text-muted-foreground">
                  <li>1. Cliquez sur "Créer mon compte"</li>
                  <li>2. Sur la page, <strong>descendez tout en bas</strong></li>
                  <li>3. Cliquez sur le lien <strong>"Sign Up"</strong></li>
                  <li>4. Remplissez le formulaire d'inscription</li>
                </ol>
              </div>
            )}

            <div className="flex gap-3 w-full">
              {step === 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Plus tard
                  </Button>
                  <Button
                    onClick={() => setStep(1)}
                    className="flex-1 gap-2"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {step === 1 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleCreateAccount}
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer mon compte
                  </Button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === step ? 'bg-primary w-6' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}