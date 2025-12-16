import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, LayoutDashboard, Package, Users, Factory, ShoppingCart, Award, Warehouse, Star, Sparkles, Building2, GraduationCap, Home, TrendingUp, ClipboardList } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';
import AdminProduction from './AdminProduction';
import AdminOrders from './AdminOrders';
import AdminRites from './AdminRites';
import AdminObediences from './AdminObediences';
import AdminDegreeOrders from './AdminDegreeOrders';
import AdminStock from './AdminStock';
import AdminReviews from './AdminReviews';
import AdminHome from './AdminHome';
import AdminAI from './AdminAI';
import AdminLeads from './AdminLeads';
import AdminAnalytics from './AdminAnalytics';
import AdminInventory from './AdminInventory';

export default function AdminPanel() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    const handlePopstate = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') || 'dashboard';
      setActiveTab(tabParam);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  useEffect(() => {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', newUrl);
  }, [activeTab]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
        <p className="text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">Gestion complète de la plateforme</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-13 gap-2 h-auto p-2">
          <TabsTrigger value="dashboard" className="flex flex-col gap-1 py-3">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex flex-col gap-1 py-3">
            <Package className="w-5 h-5" />
            <span className="text-xs">Produits</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex flex-col gap-1 py-3">
            <Users className="w-5 h-5" />
            <span className="text-xs">Clients</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex flex-col gap-1 py-3">
            <Users className="w-5 h-5" />
            <span className="text-xs">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex flex-col gap-1 py-3">
            <Factory className="w-5 h-5" />
            <span className="text-xs">Production</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex flex-col gap-1 py-3">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs">Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="rites" className="flex flex-col gap-1 py-3">
            <Award className="w-5 h-5" />
            <span className="text-xs">Rites</span>
          </TabsTrigger>
          <TabsTrigger value="obediences" className="flex flex-col gap-1 py-3">
            <Building2 className="w-5 h-5" />
            <span className="text-xs">Obédiences</span>
          </TabsTrigger>
          <TabsTrigger value="degrees" className="flex flex-col gap-1 py-3">
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs">Degrés</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex flex-col gap-1 py-3">
            <Warehouse className="w-5 h-5" />
            <span className="text-xs">Stocks</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex flex-col gap-1 py-3">
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Inventaire</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex flex-col gap-1 py-3">
            <Star className="w-5 h-5" />
            <span className="text-xs">Avis</span>
          </TabsTrigger>
          <TabsTrigger value="home" className="flex flex-col gap-1 py-3">
            <Home className="w-5 h-5" />
            <span className="text-xs">Accueil</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex flex-col gap-1 py-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">IA</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col gap-1 py-3">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Statistiques</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AdminDashboard onNavigateToTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <AdminProducts />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <AdminCustomers />
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <AdminLeads />
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <AdminProduction />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <AdminOrders />
        </TabsContent>

        <TabsContent value="rites" className="space-y-4">
          <AdminRites />
        </TabsContent>

        <TabsContent value="obediences" className="space-y-4">
          <AdminObediences />
        </TabsContent>

        <TabsContent value="degrees" className="space-y-4">
          <AdminDegreeOrders />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <AdminStock />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <AdminReviews />
        </TabsContent>

        <TabsContent value="home" className="space-y-4">
          <AdminHome />
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <AdminAI />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <AdminInventory />
        </TabsContent>
        </Tabs>
    </div>
  );
}