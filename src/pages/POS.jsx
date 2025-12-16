import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ShoppingCart, Users, Package, FileText, Store } from 'lucide-react';
import POSSale from '@/components/pos/POSSale';
import POSCustomers from '@/components/pos/POSCustomers';
import POSProducts from '@/components/pos/POSProducts';
import POSInvoices from '@/components/pos/POSInvoices';

export default function POS() {
  const [activeTab, setActiveTab] = useState('sale');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">Vous devez être administrateur pour accéder au POS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-primary/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Point de Vente</h1>
              <p className="text-sm text-muted-foreground">
                Ventes directes en boutique - {user.full_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="sale" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Vente</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Clients</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Produits</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Factures</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sale">
            <POSSale />
          </TabsContent>

          <TabsContent value="customers">
            <POSCustomers />
          </TabsContent>

          <TabsContent value="products">
            <POSProducts />
          </TabsContent>

          <TabsContent value="invoices">
            <POSInvoices />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}