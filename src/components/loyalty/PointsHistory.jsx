import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const typeConfig = {
  earned: {
    label: 'Gagnés',
    color: 'bg-green-600/20 text-green-600 border-green-600/30',
    icon: TrendingUp
  },
  redeemed: {
    label: 'Utilisés',
    color: 'bg-red-600/20 text-red-600 border-red-600/30',
    icon: TrendingDown
  },
  expired: {
    label: 'Expirés',
    color: 'bg-gray-600/20 text-gray-600 border-gray-600/30',
    icon: Clock
  }
};

export default function PointsHistory({ pointsHistory = [] }) {
  if (!pointsHistory || pointsHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des points</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune transaction pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  // Trier par date décroissante
  const sortedHistory = [...pointsHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des points</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedHistory.map((transaction, idx) => {
            const config = typeConfig[transaction.type];
            const Icon = config.icon;
            
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'earned' ? 'text-green-600' : 
                    transaction.type === 'redeemed' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{Math.abs(transaction.points)} pts
                  </p>
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}