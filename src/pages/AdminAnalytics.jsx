import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  Clock,
  Globe,
  Package,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('today');

  const getDateRange = () => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    return startDate.toISOString();
  };

  const { data: pageViews = [] } = useQuery({
    queryKey: ['page-views', timeRange],
    queryFn: () => base44.entities.PageView.list('-created_date', 10000),
    initialData: []
  });

  const { data: activeVisitors = [] } = useQuery({
    queryKey: ['active-visitors-stats'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const visitors = await base44.entities.ActiveVisitor.filter({});
      return visitors.filter(v => new Date(v.last_activity) > new Date(fiveMinutesAgo));
    },
    refetchInterval: 10000,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-analytics'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
    initialData: []
  });

  // Filter by date range
  const startDate = getDateRange();
  const filteredViews = pageViews.filter(v => new Date(v.created_date) >= new Date(startDate));

  // Calculate stats
  const totalViews = filteredViews.length;
  const uniqueVisitors = new Set(filteredViews.map(v => v.visitor_id)).size;
  const loggedInUsers = filteredViews.filter(v => v.user_id).length;
  const newVisitors = new Set(
    filteredViews
      .filter(v => {
        const firstView = pageViews.find(pv => pv.visitor_id === v.visitor_id);
        return firstView && new Date(firstView.created_date) >= new Date(startDate);
      })
      .map(v => v.visitor_id)
  ).size;

  // Page popularity
  const pageStats = {};
  filteredViews.forEach(view => {
    if (!pageStats[view.page_name]) {
      pageStats[view.page_name] = { views: 0, visitors: new Set() };
    }
    pageStats[view.page_name].views++;
    pageStats[view.page_name].visitors.add(view.visitor_id);
  });

  const popularPages = Object.entries(pageStats)
    .map(([page, stats]) => ({
      page,
      views: stats.views,
      uniqueVisitors: stats.visitors.size
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Product views
  const productViews = filteredViews.filter(v => v.product_id);
  const productStats = {};
  
  productViews.forEach(view => {
    if (!productStats[view.product_id]) {
      productStats[view.product_id] = { views: 0, visitors: new Set() };
    }
    productStats[view.product_id].views++;
    productStats[view.product_id].visitors.add(view.visitor_id);
  });

  const popularProducts = Object.entries(productStats)
    .map(([productId, stats]) => {
      const product = products.find(p => p.id === productId);
      return {
        product,
        views: stats.views,
        uniqueVisitors: stats.visitors.size
      };
    })
    .filter(item => item.product)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Average session duration
  const avgDuration = filteredViews.length > 0
    ? filteredViews.reduce((sum, v) => sum + (v.session_duration || 0), 0) / filteredViews.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Statistiques du Site</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble des performances et du trafic
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visiteurs Actifs</CardTitle>
            <Users className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVisitors.length}</div>
            <p className="text-xs text-muted-foreground">En temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
            <Eye className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Pages vues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visiteurs Uniques</CardTitle>
            <MousePointer className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitors}</div>
            <p className="text-xs text-muted-foreground">
              {newVisitors} nouveaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Connectés</CardTitle>
            <Users className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loggedInUsers}</div>
            <p className="text-xs text-muted-foreground">Sessions authentifiées</p>
          </CardContent>
        </Card>
      </div>

      {/* Visitors Currently Online */}
      {activeVisitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-500" />
              Visiteurs en Ligne Maintenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeVisitors.map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      {visitor.user_id ? 'Utilisateur connecté' : 'Visiteur'}
                    </span>
                    {visitor.is_new_visitor && (
                      <Badge variant="outline" className="text-xs">Nouveau</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {visitor.current_page}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Pages les Plus Visitées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularPages.map((page, index) => (
              <div key={page.page} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{page.page}</p>
                    <p className="text-xs text-muted-foreground">
                      {page.uniqueVisitors} visiteurs uniques
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{page.views} vues</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Produits les Plus Consultés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularProducts.map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      {item.product.images?.[0] && (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.uniqueVisitors} visiteurs uniques
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{item.views} vues</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}