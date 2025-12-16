import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AdminVisitorChat({ visitor, open, onClose }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', visitor?.visitor_id],
    queryFn: async () => {
      if (!visitor) return [];
      return await base44.entities.ChatMessage.filter(
        { visitor_id: visitor.visitor_id },
        '-created_date',
        100
      );
    },
    enabled: !!visitor && open,
    refetchInterval: 2000,
    initialData: []
  });

  const { data: pageViews = [] } = useQuery({
    queryKey: ['visitor-history', visitor?.visitor_id],
    queryFn: async () => {
      if (!visitor) return [];
      return await base44.entities.PageView.filter(
        { visitor_id: visitor.visitor_id },
        '-created_date',
        20
      );
    },
    enabled: !!visitor && open,
    initialData: []
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      await base44.entities.ChatMessage.create({
        visitor_id: visitor.visitor_id,
        sender_type: 'admin',
        sender_name: currentUser?.full_name || 'Administrateur',
        message: text
      });
      
      // Mark visitor as having admin chat open
      const existingVisitor = await base44.entities.ActiveVisitor.filter({
        visitor_id: visitor.visitor_id
      });
      if (existingVisitor.length > 0) {
        await base44.entities.ActiveVisitor.update(existingVisitor[0].id, {
          admin_chat_open: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages']);
      setMessage('');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi du message');
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!visitor) return null;

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const latestView = pageViews[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chat avec Visiteur
            {visitor.is_likely_bot && (
              <Badge variant="destructive" className="gap-1">
                <Bot className="w-3 h-3" />
                Bot probable
              </Badge>
            )}
            {visitor.is_new_visitor && (
              <Badge variant="outline" className="gap-1">
                Nouveau
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Visitor Info */}
          <Card className="col-span-1 overflow-y-auto">
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">ID Visiteur</div>
                <div className="text-xs font-mono break-all">{visitor.visitor_id}</div>
              </div>

              {visitor.user_id && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Utilisateur</div>
                  <Badge variant="secondary">Connecté</Badge>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-1">Page Actuelle</div>
                <div className="text-sm font-medium">{visitor.current_page}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Source</div>
                <Badge className="gap-1">
                  <Globe className="w-3 h-3" />
                  {visitor.source || 'direct'}
                </Badge>
              </div>

              {visitor.referrer && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Provenance</div>
                  <a 
                    href={visitor.referrer} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">{new URL(visitor.referrer).hostname}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {latestView?.utm_campaign && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Campagne</div>
                  <Badge variant="outline">{latestView.utm_campaign}</Badge>
                </div>
              )}

              {visitor.user_agent && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Navigateur</div>
                  <div className="text-xs break-all">{visitor.user_agent}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-2">Historique de Navigation</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {pageViews.slice(0, 10).map((view, idx) => (
                    <div key={view.id} className="text-xs p-2 rounded bg-muted/50">
                      <div className="font-medium">{view.page_name}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {new Date(view.created_date).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <div className="col-span-2 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 rounded-lg mb-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Aucun message. Commencez la conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_type === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : msg.sender_type === 'ai'
                          ? 'bg-secondary'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {msg.sender_type === 'admin' ? (
                          <User className="w-3 h-3" />
                        ) : msg.sender_type === 'ai' ? (
                          <Bot className="w-3 h-3" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">
                          {msg.sender_name || 'Visiteur'}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <div className="text-[10px] opacity-70 mt-1">
                        {new Date(msg.created_date).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Écrivez votre message..."
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}