import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Settings,
  FileText,
  DollarSign,
  AlertCircle,
  Award
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard({ onNavigateToTab }) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 500),
    initialData: []
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    initialData: []
  });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
        <p className="text-muted-foreground mb-6">
          Vous devez être administrateur pour accéder à cette page
        </p>
        <Link to={createPageUrl('Home')}>
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockProducts = products.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 5)
  ).length;

  const stats = [
    {
      title: 'Produits',
      value: products.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: createPageUrl('AdminProducts')
    },
    {
      title: 'Commandes',
      value: orders.length,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: createPageUrl('AdminOrders'),
      badge: pendingOrders > 0 ? `${pendingOrders} en attente` : null
    },
    {
      title: 'Clients',
      value: allUsers.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Revenu Total',
      value: `${totalRevenue.toFixed(0)}€`,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  const quickActions = [
    {
      title: 'Gérer les Produits',
      description: 'Ajouter, modifier ou supprimer des produits',
      icon: Package,
      tab: 'products',
      color: 'border-blue-200 hover:border-blue-400'
    },
    {
      title: 'Voir les Commandes',
      description: 'Gérer et suivre les commandes clients',
      icon: FileText,
      tab: 'orders',
      color: 'border-green-200 hover:border-green-400'
    },
    {
      title: 'Gérer les Clients',
      description: 'Visualiser et gérer les informations clients',
      icon: Users,
      tab: 'customers',
      color: 'border-red-200 hover:border-red-400'
    },
    {
      title: 'Gestion de Production',
      description: 'Suivre et gérer les articles en production',
      icon: TrendingUp,
      tab: 'production',
      color: 'border-orange-200 hover:border-orange-400'
    },
    {
      title: 'Gérer les Avis',
      description: 'Modérer et approuver les avis clients',
      icon: Award,
      tab: 'reviews',
      color: 'border-yellow-200 hover:border-yellow-400'
    },
    {
      title: 'Gestion des Stocks',
      description: 'Gérer les stocks et réapprovisionnements',
      icon: Settings,
      tab: 'stock',
      color: 'border-purple-200 hover:border-purple-400'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-slate-50">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tableau de Bord Admin</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.full_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const content = (
            <Card className={stat.link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.badge && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                      {stat.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
                {loadingProducts || loadingOrders || loadingUsers ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{stat.value}</p>
                )}
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link key={idx} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={idx}>{content}</div>
          );
        })}
      </div>

      {/* Alerts */}
      {lowStockProducts > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900">
                {lowStockProducts} produit{lowStockProducts > 1 ? 's' : ''} en rupture de stock
              </p>
              <p className="text-sm text-orange-700">
                Vérifiez vos stocks pour éviter les ruptures
              </p>
            </div>
            <Link to={createPageUrl('AdminProducts')} className="ml-auto">
              <Button variant="outline" size="sm">
                Voir les produits
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card 
                key={idx}
                className={`border-2 ${action.color} transition-all hover:shadow-lg cursor-pointer h-full`}
                onClick={() => onNavigateToTab && onNavigateToTab(action.tab)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Commandes Récentes</CardTitle>
            <Link to={createPageUrl('AdminOrders')}>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune commande pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items?.length || 0} produit{(order.items?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{order.total?.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}