import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <AlertCircle className="w-24 h-24 text-destructive mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Accès refusé</h2>
          <p className="text-xl text-muted-foreground">Vous devez être administrateur pour accéder au POS.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'sale', label: 'Vente', icon: ShoppingCart },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'invoices', label: 'Factures', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-background flex flex-col touch-manipulation">
      {/* Header fixe */}
      <div className="flex-shrink-0 border-b-4 border-border bg-primary/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Point de Vente</h1>
              <p className="text-lg text-muted-foreground">
                {user.full_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-2xl font-bold">
              {new Date().toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>

        {/* Navigation tactile */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-3">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    h-20 rounded-xl font-bold text-lg transition-all
                    flex flex-col items-center justify-center gap-2
                    ${activeTab === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'bg-background border-2 border-border hover:bg-muted active:scale-95'
                    }
                  `}
                >
                  <Icon className="w-7 h-7" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === 'sale' && <POSSale />}
          {activeTab === 'customers' && <POSCustomers />}
          {activeTab === 'products' && <POSProducts />}
          {activeTab === 'invoices' && <POSInvoices />}
        </div>
      </div>
    </div>
  );
}