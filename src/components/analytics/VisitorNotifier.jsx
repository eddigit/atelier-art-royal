import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';

export default function VisitorNotifier() {
  const [lastNotified, setLastNotified] = useState(Date.now());
  const [hasPlayed, setHasPlayed] = useState(false);

  const { data: activeVisitors = [] } = useQuery({
    queryKey: ['active-visitors'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const visitors = await base44.entities.ActiveVisitor.filter({});
      return visitors.filter(v => new Date(v.last_activity) > new Date(fiveMinutesAgo));
    },
    refetchInterval: 5000,
    initialData: []
  });

  useEffect(() => {
    const newVisitors = activeVisitors.filter(v => 
      v.is_new_visitor && 
      new Date(v.created_date) > new Date(lastNotified)
    );

    if (newVisitors.length > 0 && !hasPlayed) {
      // Play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWe77OWeTRAMUKnj8LZjHAU7k9X0zHkpBSJ1xu/glEILEl+z6OyrWRQLRp/h8r1nHwYogMzw3I4+CRhkuurmmlgRCU6m5O+zXx8GN4/U8ct8MQUgcsXu45hXJfL30uTNhzEHI2W05sqLMwYdhNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05sqLMwYchNPny4k0BhpjqvHWizMGI2O05s=');
      audio.play().catch(e => console.log('Audio play failed:', e));
      
      setLastNotified(Date.now());
      setHasPlayed(true);
      
      setTimeout(() => setHasPlayed(false), 60000);
    }
  }, [activeVisitors, lastNotified, hasPlayed]);

  if (activeVisitors.length === 0) return null;

  return (
    <Card className="fixed bottom-24 right-6 z-40 p-4 w-64 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-500" />
          <span className="font-semibold">Visiteurs en ligne</span>
        </div>
        <Badge variant="secondary">{activeVisitors.length}</Badge>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {activeVisitors.slice(0, 5).map((visitor) => (
          <div key={visitor.id} className="text-xs flex items-center gap-2 text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span className="truncate">{visitor.current_page}</span>
            {visitor.is_new_visitor && (
              <Badge variant="outline" className="text-xs">Nouveau</Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}