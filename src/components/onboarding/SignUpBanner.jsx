import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function SignUpBanner() {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        const hasDismissedBanner = localStorage.getItem('dismissedSignUpBanner');
        if (!hasDismissedBanner) {
          setTimeout(() => setShow(true), 5000);
        }
      }
    };

    checkUser();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('dismissedSignUpBanner', 'true');
    setShow(false);
  };

  const handleSignUp = () => {
    localStorage.setItem('dismissedSignUpBanner', 'true');
    setShow(false);
    base44.auth.redirectToLogin();
  };

  if (user || !show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-2xl p-6 border-2 border-primary-foreground/20">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Créez votre compte</h3>
            <p className="text-sm text-primary-foreground/90 mb-4">
              Pour passer commande, créez votre compte en 1 minute. Cliquez ci-dessous, puis sur "Sign Up" en bas de la page.
            </p>
            <Button
              onClick={handleSignUp}
              size="sm"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Commencer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}