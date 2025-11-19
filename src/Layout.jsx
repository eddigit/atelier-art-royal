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
  LogOut,
  ChevronDown,
  Package,
  Grid,
  Award,
  UserCircle,
  ShoppingBag,
  Settings,
  Heart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
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

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => base44.entities.Grade.list('level', 100),
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
      {/* Top Header Bar */}
      <div className="bg-primary/10 border-b border-primary/20 py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <a href="tel:+33646683610" className="flex items-center gap-2 hover:text-primary transition-colors">
              <span className="font-semibold">Service commercial & Support :</span>
              <span>+33 6 46 68 36 10</span>
            </a>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <a href="mailto:contact@artroyal.fr" className="hover:text-primary transition-colors">
              contact@artroyal.fr
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Made in France */}
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')} className="group">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691cd26ea8838a859856a6b6/d0a84d191_Logo-Atelier-Art-Royal.png" 
                  alt="Atelier Art Royal - Haute Couture Maçonnique" 
                  className="h-12 w-auto object-contain transition-opacity group-hover:opacity-80"
                />
              </Link>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="flex gap-0.5">
                  <div className="w-1 h-4 bg-blue-600 rounded-l"></div>
                  <div className="w-1 h-4 bg-white"></div>
                  <div className="w-1 h-4 bg-red-600 rounded-r"></div>
                </div>
                <span className="text-xs font-semibold text-primary">Made in France</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link to={createPageUrl('Home')} className="text-sm font-medium hover:text-primary transition-colors">
                Accueil
              </Link>

              {!isAdminPage && (
                <>
                  {/* Menu Rites */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium hover:text-primary h-auto p-0 gap-1">
                        Par Rite
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Sélectionner un Rite</DropdownMenuLabel>
                      {rites.map(rite => (
                        <DropdownMenuItem key={rite.id} asChild>
                          <Link to={createPageUrl('Catalog') + `?rite=${rite.id}`} className="cursor-pointer">
                            <Award className="w-4 h-4 mr-2" />
                            {rite.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Menu Catégories */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium hover:text-primary h-auto p-0 gap-1">
                        Par Catégorie
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Sélectionner une Catégorie</DropdownMenuLabel>
                      {categories.map(category => (
                        <DropdownMenuItem key={category.id} asChild>
                          <Link to={createPageUrl('Catalog') + `?category=${category.id}`} className="cursor-pointer">
                            <Grid className="w-4 h-4 mr-2" />
                            {category.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Menu Grades */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium hover:text-primary h-auto p-0 gap-1">
                        Par Grade
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 max-h-96 overflow-y-auto">
                      <DropdownMenuLabel>Sélectionner un Grade</DropdownMenuLabel>
                      {grades.map(grade => (
                        <DropdownMenuItem key={grade.id} asChild>
                          <Link to={createPageUrl('Catalog') + `?grade=${grade.id}`} className="cursor-pointer">
                            <Award className="w-4 h-4 mr-2" />
                            {grade.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Lien Catalogue complet */}
                  <Link to={createPageUrl('Catalog')} className="text-sm font-medium hover:text-primary transition-colors">
                    Catalogue
                  </Link>
                </>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.full_name}</span>
                        <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Account')} className="cursor-pointer">
                        <UserCircle className="w-4 h-4 mr-2" />
                        Mon Compte
                      </Link>
                    </DropdownMenuItem>
                    {!isAdminPage && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Orders')} className="cursor-pointer">
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Mes Commandes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('SavedCustomizations')} className="cursor-pointer">
                            <Heart className="w-4 h-4 mr-2" />
                            Mes Créations
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('AdminPanel')} className="cursor-pointer">
                            <Settings className="w-4 h-4 mr-2" />
                            Administration
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                        <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <Link 
                  to={createPageUrl('Home')} 
                  className="text-sm font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Accueil
                </Link>

                {!isAdminPage && (
                  <>
                    <div className="text-xs text-muted-foreground font-semibold mt-2">Par Rite</div>
                    {rites.map(rite => (
                      <Link 
                        key={rite.id}
                        to={createPageUrl('Catalog') + `?rite=${rite.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {rite.name}
                      </Link>
                    ))}

                    <div className="text-xs text-muted-foreground font-semibold mt-4">Par Catégorie</div>
                    {categories.map(category => (
                      <Link 
                        key={category.id}
                        to={createPageUrl('Catalog') + `?category=${category.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))}

                    <div className="text-xs text-muted-foreground font-semibold mt-4">Par Grade</div>
                    {grades.slice(0, 10).map(grade => (
                      <Link 
                        key={grade.id}
                        to={createPageUrl('Catalog') + `?grade=${grade.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {grade.name}
                      </Link>
                    ))}

                    <Link 
                      to={createPageUrl('Catalog')} 
                      className="text-sm font-medium hover:text-primary transition-colors py-2 mt-4 font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Catalogue Complet
                    </Link>
                  </>
                )}

                {user && !isAdminPage && (
                  <>
                    <div className="border-t border-border my-2" />
                    <Link 
                      to={createPageUrl('Account')} 
                      className="text-sm font-medium hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mon Compte
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
                  <>
                    <div className="border-t border-border my-2" />
                    <Link 
                      to={createPageUrl('AdminPanel')} 
                      className="text-sm font-medium hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Administration
                    </Link>
                  </>
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-muted-foreground text-xs font-bold">©</span>
              <span>{new Date().getFullYear()} Atelier Art Royal</span>
            </div>
            <span className="hidden md:inline">•</span>
            <span>
              Design et E-commerce réalisé par{' '}
              <a 
                href="https://coachdigitalparis.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold hover:text-primary transition-colors"
              >
                GILLES KORZEC
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}