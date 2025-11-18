import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Settings,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 500),
    initialData: []
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    initialData: []
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès Refusé</h2>
        <p className="text-muted-foreground">
          Vous devez être administrateur pour accéder à cette page
        </p>
      </div>
    );
  }

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const lowStockProducts = products.filter(
    p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0
  );

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const stats = [
    {
      title: 'Produits',
      value: products.length,
      icon: Package,
      color: 'bg-blue-500',
      link: createPageUrl('AdminProducts')
    },
    {
      title: 'Commandes',
      value: orders.length,
      icon: ShoppingCart,
      color: 'bg-green-500',
      link: createPageUrl('AdminOrders')
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${totalRevenue.toFixed(0)}€`,
      icon: DollarSign,
      color: 'bg-primary',
      link: null
    },
    {
      title: 'En attente',
      value: pendingOrders,
      icon: AlertCircle,
      color: 'bg-orange-500',
      link: createPageUrl('AdminOrders')
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Tableau de <span className="text-gradient">Bord</span>
          </h1>
          <p className="text-muted-foreground">
            Bienvenue, {user.full_name}
          </p>
        </div>
        <Link to={createPageUrl('AdminSettings')}>
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          return stat.link ? (
            <Link key={stat.title} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={stat.title}>{content}</div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to={createPageUrl('AdminProducts')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Gérer Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajouter, modifier et gérer votre catalogue
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('AdminOrders')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Gérer Commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Suivre et traiter les commandes clients
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('AdminSettings')}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Paramétrer votre boutique
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              Alertes Stock Faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center text-sm">
                  <span>{product.name}</span>
                  <span className="text-orange-600 font-medium">
                    {product.stock_quantity} restant{product.stock_quantity > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}