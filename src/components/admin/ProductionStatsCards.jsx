import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ProductionStatsCards({ productions }) {
  const stats = {
    total: productions.length,
    enAttente: productions.filter(p => p.status === 'en_attente').length,
    enCours: productions.filter(p => p.status === 'en_design' || p.status === 'en_fabrication').length,
    terminees: productions.filter(p => p.status === 'terminee' || p.status === 'livree').length,
    urgentes: productions.filter(p => p.priority === 'urgente' && p.status !== 'terminee' && p.status !== 'livree').length
  };

  const cards = [
    {
      title: 'Total Projets',
      value: stats.total,
      icon: Factory,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'En Attente',
      value: stats.enAttente,
      icon: Clock,
      color: 'text-gray-400',
      bg: 'bg-gray-600/10'
    },
    {
      title: 'En Cours',
      value: stats.enCours,
      icon: Loader2,
      color: 'text-yellow-400',
      bg: 'bg-yellow-600/10'
    },
    {
      title: 'Terminées',
      value: stats.terminees,
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-600/10'
    },
    {
      title: 'Urgentes',
      value: stats.urgentes,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-600/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <Badge variant="outline">{card.value}</Badge>
              </div>
              <h3 className="text-2xl font-bold">{card.value}</h3>
              <p className="text-sm text-muted-foreground">{card.title}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}