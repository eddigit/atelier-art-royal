import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
  { role: 'assistant', content: "Bonjour ! Je suis l'assistant virtuel de l'Atelier Art Royal. Comment puis-je vous aider aujourd'hui ?" }]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await base44.functions.invoke('aiChat', {
        messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))
      });

      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        suggested_products: data.suggested_products || []
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen &&
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50">

            <Button
            onClick={() => setIsOpen(true)}
            size="lg" className="bg-[#D8AB4C] text-primary-foreground px-8 text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-14 w-14 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110">


              <MessageCircle className="w-6 h-6" />
            </Button>
            <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }} />

          </motion.div>
        }
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">

            <Card className="shadow-2xl border-primary/20 overflow-hidden">
              {/* Header */}
              <div className="bg-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Assistant Art Royal</h3>
                    <p className="text-xs text-white/80">En ligne</p>
                  </div>
                </div>
                <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20">

                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-muted/20">
                {messages.map((message, index) =>
              <div key={index}>
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user' ?
                  'bg-primary text-primary-foreground' :
                  'bg-background border border-border'}`
                  }>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                    
                    {/* Suggested Products */}
                    {message.suggested_products && message.suggested_products.length > 0 &&
                <div className="mt-2 space-y-2">
                        {message.suggested_products.map((product) =>
                  <Link
                    key={product.id}
                    to={createPageUrl('ProductDetail') + `?id=${product.id}`}
                    onClick={() => setIsOpen(false)}>

                            <Card className="p-3 hover:border-primary transition-colors cursor-pointer">
                              <div className="flex gap-3">
                                {product.image &&
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded" />

                        }
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{product.name}</p>
                                  <p className="text-primary font-bold">{product.price}€</p>
                                </div>
                              </div>
                            </Card>
                          </Link>
                  )}
                      </div>
                }
                  </div>
              )}
                {isLoading &&
              <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
              }
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-2">
                  <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  className="flex-1" />

                  <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon">

                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}