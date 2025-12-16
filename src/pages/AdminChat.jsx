import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  MessageCircle,
  Bot,
  Globe,
  Search,
  MapPin
} from 'lucide-react';
import AdminVisitorChat from '@/components/admin/AdminVisitorChat';

export default function AdminChat() {
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: activeVisitors = [] } = useQuery({
    queryKey: ['active-visitors-chat'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const visitors = await base44.entities.ActiveVisitor.filter({});
      return visitors.filter(v => new Date(v.last_activity) > new Date(fiveMinutesAgo));
    },
    refetchInterval: 3000,
    initialData: []
  });

  const { data: allVisitorQualifications = [] } = useQuery({
    queryKey: ['all-visitor-qualifications'],
    queryFn: () => base44.entities.VisitorQualification.list('-created_date', 100),
    initialData: []
  });

  const filteredVisitors = activeVisitors.filter(visitor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const qualification = allVisitorQualifications.find(q => q.visitor_id === visitor.visitor_id);
    return (
      visitor.current_page?.toLowerCase().includes(query) ||
      visitor.source?.toLowerCase().includes(query) ||
      qualification?.name?.toLowerCase().includes(query) ||
      qualification?.email?.toLowerCase().includes(query) ||
      visitor.visitor_city?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Chat Visiteurs</h2>
          <p className="text-muted-foreground">
            Conversez en temps réel avec les visiteurs en ligne
          </p>
        </div>
        <Badge variant="secondary" className="text-lg py-2 px-4">
          <Users className="w-4 h-4 mr-2" />
          {activeVisitors.length} en ligne
        </Badge>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher par page, source, nom, email, ville..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Visitors List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredVisitors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Aucun visiteur trouvé' : 'Aucun visiteur en ligne actuellement'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVisitors.map((visitor) => {
            const qualification = allVisitorQualifications.find(q => q.visitor_id === visitor.visitor_id);
            
            return (
              <Card key={visitor.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Indicator */}
                      <div className="mt-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      </div>

                      {/* Visitor Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {qualification?.name || 
                             `${qualification?.first_name || ''} ${qualification?.last_name || ''}`.trim() ||
                             (visitor.user_id ? 'Utilisateur connecté' : 'Visiteur anonyme')}
                          </span>
                          {visitor.is_new_visitor && (
                            <Badge variant="outline">Nouveau</Badge>
                          )}
                          {visitor.is_likely_bot && (
                            <Badge variant="destructive" className="gap-1">
                              <Bot className="w-3 h-3" />
                              Bot probable
                            </Badge>
                          )}
                          {qualification?.lead_created && (
                            <Badge className="bg-green-600">Lead créé</Badge>
                          )}
                        </div>

                        {/* Contact Info */}
                        {(qualification?.email || qualification?.phone) && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {qualification.email && <div>📧 {qualification.email}</div>}
                            {qualification.phone && <div>📞 {qualification.phone}</div>}
                          </div>
                        )}

                        {/* Current Page */}
                        <div className="text-sm text-muted-foreground">
                          📄 {visitor.current_page}
                        </div>

                        {/* Source and Location */}
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          {visitor.source && visitor.source !== 'direct' && (
                            <Badge variant="outline" className="gap-1">
                              <Globe className="w-3 h-3" />
                              {visitor.source}
                            </Badge>
                          )}
                          {visitor.visitor_city && (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="w-3 h-3" />
                              {visitor.visitor_city}, {visitor.visitor_country}
                            </Badge>
                          )}
                          {visitor.visitor_ip && (
                            <Badge variant="secondary" className="font-mono">
                              {visitor.visitor_ip}
                            </Badge>
                          )}
                        </div>

                        {/* Loge Info */}
                        {qualification?.loge_name && (
                          <div className="text-sm">
                            🏛️ Loge: <span className="font-medium">{qualification.loge_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Button */}
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => setSelectedVisitor(visitor)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ouvrir le chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Admin Visitor Chat Dialog */}
      <AdminVisitorChat
        visitor={selectedVisitor}
        open={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  );
}