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
  Heart } from
'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';
import CartSidebar from '@/components/cart/CartSidebar';
import VisitorTracker from '@/components/analytics/VisitorTracker';
import VisitorNotifier from '@/components/analytics/VisitorNotifier';
import WelcomeOnboarding from '@/components/onboarding/WelcomeOnboarding';
import SignUpBanner from '@/components/onboarding/SignUpBanner';
import LoyaltyBadge from '@/components/loyalty/LoyaltyBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel } from
'@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
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

  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await base44.entities.LoyaltyPoints.filter({ user_id: user.id });
      return data[0] || null;
    },
    enabled: !!user
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-menu'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '-created_date', 1000),
    initialData: []
  });

  const { data: allRites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const { data: allObediences = [] } = useQuery({
    queryKey: ['obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    initialData: []
  });

  const { data: allDegreeOrders = [] } = useQuery({
    queryKey: ['degreeOrders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    initialData: []
  });

  // Filter only options with available products and deduplicate by name
  const rites = allRites.filter((r) => products.some((p) => p.rite_id === r.id));
  const categoriesFiltered = allCategories.filter((c) =>
  products.some((p) => {
    const categoryIds = Array.isArray(p.category_ids) ? p.category_ids : p.category_id ? [p.category_id] : [];
    return categoryIds.includes(c.id);
  })
  );
  const categories = categoriesFiltered.filter((cat, index, self) =>
  index === self.findIndex((c) => c.name === cat.name)
  );
  const obediences = allObediences.filter((o) =>
  products.some((p) =>
  Array.isArray(p.obedience_ids) ?
  p.obedience_ids.includes(o.id) :
  p.obedience_id === o.id
  )
  );
  const degreeOrdersFiltered = allDegreeOrders.filter((d) => products.some((p) => p.degree_order_id === d.id));
  const degreeOrders = degreeOrdersFiltered.filter((deg, index, self) =>
  index === self.findIndex((d) => d.name === deg.name)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    base44.auth.me().
    then((u) => setUser(u)).
    catch(() => setUser(null));
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const isAdmin = user?.role === 'admin';
  const isAdminPage = currentPageName?.startsWith('Admin');
  const isPOSPage = currentPageName === 'POS';

  // Si c'est la page POS, on affiche uniquement le contenu sans layout
  if (isPOSPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Header Bar */}
      <div className="bg-neutral-950 py-2 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <a href="tel:+33646683610" className="flex items-center gap-2 hover:opacity-80 transition-colors" style={{ color: '#e5b350' }}>
              <span className="font-semibold">Service commercial & Support :</span>
              <span>+33 6 46 68 36 10</span>
            </a>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <a href="mailto:contact@artroyal.fr" className="hover:opacity-80 transition-colors" style={{ color: '#e5b350' }}>
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
                  src={darkMode ?
                  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691cd26ea8838a859856a6b6/d0a84d191_Logo-Atelier-Art-Royal.png" :
                  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691cd26ea8838a859856a6b6/b5c892460_logo-dark-web.png"
                  }
                  alt="Atelier Art Royal - Haute Couture Maçonnique"
                  className="h-8 w-auto object-contain transition-opacity group-hover:opacity-80" />

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

              {!isAdminPage &&
              <>
                  {/* Menu Rites */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium hover:text-primary h-auto p-0 gap-1">
                        Rites
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Sélectionner un Rite</DropdownMenuLabel>
                      {rites.map((rite) =>
                    <DropdownMenuItem key={rite.id} asChild>
                          <Link to={createPageUrl('Catalog') + `?rite=${rite.id}`} className="cursor-pointer">
                            <Award className="w-4 h-4 mr-2" />
                            {rite.name}
                          </Link>
                        </DropdownMenuItem>
                    )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Menu Type de Loge */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium hover:text-primary h-auto p-0 gap-1">
                        Type de Loge
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel>Sélectionner le Type</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Catalog') + `?logeType=Loge Symbolique`} className="cursor-pointer">
                          <Award className="w-4 h-4 mr-2" />
                          Loge Symbolique (1er - 3ème degré)
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Catalog') + `?logeType=Loge Hauts Grades`} className="cursor-pointer">
                          <Award className="w-4 h-4 mr-2" />
                          Loge Hauts Grades (4ème+ & Ordres)
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Menu Catégories */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-sm font-medium hover:text-primary h-auto p-0 gap-1">
                        Produits
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Type de Produit</DropdownMenuLabel>
                      {categories.map((category) =>
                    <DropdownMenuItem key={category.id} asChild>
                          <Link to={createPageUrl('Catalog') + `?category=${category.id}`} className="cursor-pointer">
                            <Grid className="w-4 h-4 mr-2" />
                            {category.name}
                          </Link>
                        </DropdownMenuItem>
                    )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Lien Catalogue complet */}
                  <Link to={createPageUrl('Catalog')} className="text-sm font-medium hover:text-primary transition-colors">
                    Catalogue Complet
                  </Link>
                </>
              }
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-full">

                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Cart */}
              {!isAdminPage &&
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative"
                onClick={() => setCartSidebarOpen(true)}>

                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 &&
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                }
                </Button>
              }

              {/* User Menu */}
              {user ?
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full p-0 h-10 w-10">
                      {user.avatar_url ?
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" /> :


                    <User className="w-5 h-5" />
                    }
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
                    {isAdmin &&
                  <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('AdminPanel')} className="cursor-pointer">
                            <Settings className="w-4 h-4 mr-2" />
                            Administration
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                  }
                    {loyaltyData &&
                  <div className="px-2 py-2">
                        <LoyaltyBadge
                      tier={loyaltyData.tier}
                      points={loyaltyData.points}
                      compact={true} />

                      </div>
                  }
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Account')} className="cursor-pointer">
                        <UserCircle className="w-4 h-4 mr-2" />
                        Mon Compte
                      </Link>
                    </DropdownMenuItem>
                    {!isAdminPage &&
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
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Wishlist')} className="cursor-pointer">
                            <Heart className="w-4 h-4 mr-2" />
                            Ma Liste de Souhaits
                          </Link>
                        </DropdownMenuItem>
                      </>
                  }

                        <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> :

              <Button
                variant="default"
                size="sm"
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-primary hover:bg-primary/90">

                  Connexion
                </Button>
              }

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>

                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen &&
          <div className="lg:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-3">
                <Link
                to={createPageUrl('Home')}
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}>

                  Accueil
                  </Link>

                  {!isAdminPage &&
              <>
                    <div className="text-xs text-muted-foreground font-semibold mt-2">Rites</div>
                    {rites.map((rite) =>
                <Link
                  key={rite.id}
                  to={createPageUrl('Catalog') + `?rite=${rite.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                  onClick={() => setMobileMenuOpen(false)}>

                        {rite.name}
                      </Link>
                )}

                    <div className="text-xs text-muted-foreground font-semibold mt-4">Type de Loge</div>
                    <Link
                  to={createPageUrl('Catalog') + `?logeType=Loge Symbolique`}
                  className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                  onClick={() => setMobileMenuOpen(false)}>

                      Loge Symbolique
                    </Link>
                    <Link
                  to={createPageUrl('Catalog') + `?logeType=Loge Hauts Grades`}
                  className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                  onClick={() => setMobileMenuOpen(false)}>

                      Loge Hauts Grades
                    </Link>

                    <div className="text-xs text-muted-foreground font-semibold mt-4">Catégories de Produits</div>
                    {categories.map((category) =>
                <Link
                  key={category.id}
                  to={createPageUrl('Catalog') + `?category=${category.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors py-2 pl-4"
                  onClick={() => setMobileMenuOpen(false)}>

                        {category.name}
                      </Link>
                )}

                    <Link
                  to={createPageUrl('Catalog')}
                  className="text-sm font-medium hover:text-primary transition-colors py-2 mt-4 font-semibold"
                  onClick={() => setMobileMenuOpen(false)}>

                      Catalogue Complet
                    </Link>
                  </>
              }

                {user &&
              <>
                <div className="border-t border-border my-2" />
                {isAdmin &&
                <Link
                  to={createPageUrl('AdminPanel')}
                  className="text-sm font-semibold hover:text-primary transition-colors py-2 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}>

                    <Settings className="w-4 h-4" />
                    Administration
                  </Link>
                }
                {!isAdminPage &&
                <>
                    <Link
                    to={createPageUrl('Account')}
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}>

                      Mon Compte
                    </Link>
                    <Link
                    to={createPageUrl('Orders')}
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}>

                      Mes Commandes
                    </Link>
                  </>
                }
                </>
              }
              </nav>
            </div>
          }
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        {children}
      </main>

      {/* Analytics Tracking */}
      <VisitorTracker pageName={currentPageName} />

      {/* Chat Widget */}
      <ChatWidget />

      {/* Onboarding */}
      <WelcomeOnboarding />
      <SignUpBanner />

      {/* Admin Visitor Notifications */}
      {isAdmin && <VisitorNotifier />}

      {/* Cart Sidebar */}
      <CartSidebar open={cartSidebarOpen} onClose={() => setCartSidebarOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Link to={createPageUrl('Setup')}>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-muted-foreground text-xs font-bold cursor-pointer hover:border-primary hover:text-primary transition-colors">©</span>
              </Link>
              <span>{new Date().getFullYear()} Atelier Art Royal</span>
            </div>
            <span className="hidden md:inline">•</span>
            <span>
              Design et E-commerce réalisé par{' '}
              <a
                href="https://coachdigitalparis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:text-primary transition-colors">

                GILLES KORZEC
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>);

}