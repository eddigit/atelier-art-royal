import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Banknote, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function POSSale() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, 'name', 500),
    initialData: []
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: () => base44.entities.User.list('full_name', 500),
    initialData: []
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);
      if (orderData.payment_method === 'phone_validation') {
        await base44.functions.invoke('sendOrderConfirmation', { 
          orderId: order.id,
          customerEmail: orderData.customer_email 
        });
      }
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Vente enregistrée avec succès !');
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'enregistrement : ' + error.message);
    }
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} ajouté au panier`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    if (!selectedCustomer) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    const orderNumber = 'POS-' + Date.now();
    const total = calculateTotal();

    const orderData = {
      order_number: orderNumber,
      customer_id: selectedCustomer.id,
      customer_email: selectedCustomer.email,
      status: 'pending',
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal: total,
      shipping_cost: 0,
      total: total,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'phone_validation' ? 'pending' : 'paid',
      sales_channel: 'direct'
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Catalogue Produits */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Catalogue Produits</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    {product.images?.[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {product.short_description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {product.price.toFixed(2)}€
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock_quantity || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panier & Paiement */}
      <div className="space-y-6">
        {/* Sélection Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Rechercher un client..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <div className="max-h-32 overflow-y-auto space-y-2">
              {filteredCustomers.slice(0, 5).map(customer => (
                <Button
                  key={customer.id}
                  variant={selectedCustomer?.id === customer.id ? 'default' : 'outline'}
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="truncate">
                    <div className="font-semibold">{customer.full_name}</div>
                    <div className="text-xs opacity-70">{customer.email}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Panier ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-64 overflow-y-auto space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-primary">{item.price.toFixed(2)}€</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{calculateTotal().toFixed(2)}€</span>
                  </div>

                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            Espèces
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Carte bancaire
                          </div>
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          Virement bancaire
                        </SelectItem>
                        <SelectItem value="phone_validation">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Validation téléphonique
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={!selectedCustomer || createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? 'Traitement...' : 'Valider la vente'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}