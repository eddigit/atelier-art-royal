import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertCircle, ImageIcon } from 'lucide-react';

export default function ProductStatsCards({ products }) {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);
  const productsWithImages = products.filter(p => p.images && p.images.length > 0).length;
  const lowStockProducts = products.filter(p => 
    p.stock_quantity <= (p.low_stock_threshold || 5)
  ).length;

  const stats = [
    {
      title: 'Total Produits',
      value: totalProducts,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Produits Actifs',
      value: activeProducts,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Valeur Stock',
      value: `${totalValue.toFixed(0)}€`,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Avec Images',
      value: `${productsWithImages}/${totalProducts}`,
      icon: ImageIcon,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Stock Faible',
      value: lowStockProducts,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}