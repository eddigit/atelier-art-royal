import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';

const colorClasses = {
  yellow: {
    bg: 'bg-yellow-600/10',
    text: 'text-yellow-400',
    border: 'border-yellow-600/30'
  },
  purple: {
    bg: 'bg-purple-600/10',
    text: 'text-purple-400',
    border: 'border-purple-600/30'
  },
  blue: {
    bg: 'bg-blue-600/10',
    text: 'text-blue-400',
    border: 'border-blue-600/30'
  },
  green: {
    bg: 'bg-green-600/10',
    text: 'text-green-400',
    border: 'border-green-600/30'
  },
  gray: {
    bg: 'bg-gray-600/10',
    text: 'text-gray-400',
    border: 'border-gray-600/30'
  }
};

export default function CustomerSegmentCard({ 
  segment, 
  label, 
  description, 
  count, 
  customers, 
  icon: Icon,
  color,
  onViewCustomer 
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <Card className={`border-2 ${colors.border}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
            {count}
          </Badge>
        </div>
        <CardTitle className="mt-4">{label}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {count > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full mb-3"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Masquer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Voir les clients
                </>
              )}
            </Button>

            {expanded && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers.slice(0, 10).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customer.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.stats.orderCount} cmd • {customer.stats.totalSpent.toFixed(0)}€
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewCustomer(customer)}
                      className="flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {customers.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    + {customers.length - 10} autres clients
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}