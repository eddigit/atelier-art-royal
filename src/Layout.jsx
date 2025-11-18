import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Button } from '@/components/ui/button';
import { 
  Moon, 
  Sun, 
  ShoppingCart, 
  User, 
  Menu, 
  X,
  Crown,
  LogOut
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) return [];
        return await base44.entities.CartItem.filter({ user_id: currentUser.id });
      } catch {
        return [];
      }
    },
    initialData: []
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isAdmin = user?.role === 'admin';
  const isAdminPage = currentPageName?.startsWith('Admin');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div className="hidden md:block">
                <div className="text-xl font-bold tracking-tight text-gradient">Art Royal</div>
                <div className="text-xs text-muted-foreground">Haute Couture Maçonnique</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {!isAdminPage && (
                <>
                  <Link to={createPageUrl('Home')} className="text-sm font-medium hover:text-primary transition-colors">
                    Accueil
                  </Link>
                  <Link to={createPageUrl('Catalog')} className="text-sm font-medium hover:text-primary transition-colors">
                    Catalogue
                  </Link>
                  <Link to={createPageUrl('Orders')} className="text-sm font-medium hover:text-primary transition-colors">
                    Mes Commandes
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to={createPageUrl('AdminDashboard')} className="text-sm font-medium hover:text-primary transition-colors">
                  Administration
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-full"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Cart */}
              {!isAdminPage && (
                <Link to={createPageUrl('Cart')}>
                  <Button variant="ghost" size="icon" className="rounded-full relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to={createPageUrl('Account')}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Connexion
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-3">
                {!isAdminPage && (
                  <>
                    <Link 
                      to={createPageUrl('Home')} 
                      className="text-sm font-medium hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Accueil
                    </Link>
                    <Link 
                      to={createPageUrl('Catalog')} 
                      className="text-sm font-medium hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Catalogue
                    </Link>
                    <Link 
                      to={createPageUrl('Orders')} 
                      className="text-sm font-medium hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mes Commandes
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link 
                    to={createPageUrl('AdminDashboard')} 
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administration
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg text-gradient">Art Royal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Haute Couture Maçonnique depuis 1985
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Service</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Franco de port dès 500€</li>
                <li>Livraison sous 5-7 jours</li>
                <li>Service client dédié</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to={createPageUrl('Catalog')} className="text-muted-foreground hover:text-primary">Catalogue</Link></li>
                <li><Link to={createPageUrl('Orders')} className="text-muted-foreground hover:text-primary">Commandes</Link></li>
                <li><Link to={createPageUrl('Account')} className="text-muted-foreground hover:text-primary">Mon Compte</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">
                Support disponible 24/7<br />
                via notre chatbot IA
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 Atelier Art Royal. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}