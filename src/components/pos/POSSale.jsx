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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Catalogue Produits */}
      <div className="lg:col-span-2">
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-16 h-16 text-xl border-2"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-card border-2 border-border rounded-2xl p-4 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-left"
            >
              {product.images?.[0] && (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
              )}
              <h3 className="font-bold text-base mb-1 line-clamp-2">{product.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold text-primary">
                  {product.price.toFixed(0)}€
                </span>
                <span className="text-sm text-muted-foreground">
                  Stock: {product.stock_quantity || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panier & Paiement */}
      <div className="space-y-4">
        {/* Sélection Client */}
        <div className="bg-card border-2 border-border rounded-2xl p-5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="w-6 h-6" />
            Client
          </h3>
          <Input
            placeholder="Rechercher..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="h-14 text-lg mb-3 border-2"
          />
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filteredCustomers.slice(0, 4).map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`w-full p-3 rounded-xl text-left transition-all border-2 ${
                  selectedCustomer?.id === customer.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                <div className="font-bold">{customer.full_name}</div>
                <div className="text-sm opacity-80 truncate">{customer.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Panier */}
        <div className="bg-card border-2 border-border rounded-2xl p-5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Panier ({cart.length})
          </h3>
          
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-3 border-2 rounded-xl bg-background">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{item.name}</p>
                  <p className="text-sm text-primary">{item.price.toFixed(2)}€</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-12 h-12 bg-background border-2 rounded-xl font-bold hover:bg-muted active:scale-90 transition-all"
                  >
                    <Minus className="w-5 h-5 mx-auto" />
                  </button>
                  <span className="w-10 text-center font-bold text-xl">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-12 h-12 bg-background border-2 rounded-xl font-bold hover:bg-muted active:scale-90 transition-all"
                  >
                    <Plus className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-12 h-12 bg-destructive/10 border-2 border-destructive rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-90 transition-all"
                  >
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <>
              <div className="border-t-2 pt-4 mb-4">
                <div className="flex justify-between text-3xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{calculateTotal().toFixed(2)}€</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg">Mode de paiement</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Espèces', icon: Banknote },
                    { value: 'card', label: 'Carte', icon: CreditCard },
                    { value: 'bank_transfer', label: 'Virement', icon: CreditCard },
                    { value: 'phone_validation', label: 'Tél', icon: Phone }
                  ].map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`h-16 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                          paymentMethod === method.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="w-full h-16 text-xl font-bold mt-4"
                onClick={handleCheckout}
                disabled={!selectedCustomer || createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Traitement...' : 'Valider la vente'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}