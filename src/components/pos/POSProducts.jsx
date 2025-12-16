import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, AlertTriangle } from 'lucide-react';

export default function POSProducts() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products-list'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, 'name', 500),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 50),
    initialData: []
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'N/A';
  };

  const getRiteName = (riteId) => {
    const rite = rites.find(r => r.id === riteId);
    return rite?.name || 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalogue Produits</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredProducts.map(product => {
            const stock = product.stock_quantity || 0;
            const lowStock = stock <= (product.low_stock_threshold || 5);
            const outOfStock = stock === 0;

            return (
              <Card key={product.id} className={outOfStock ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">Réf: {product.sku}</p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-primary ml-4">
                          {product.price.toFixed(2)}€
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline">{getCategoryName(product.category_id)}</Badge>
                        <Badge variant="outline">{getRiteName(product.rite_id)}</Badge>
                        {outOfStock && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Rupture de stock
                          </Badge>
                        )}
                        {!outOfStock && lowStock && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Stock faible
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className={lowStock ? 'text-orange-600 font-semibold' : 'text-muted-foreground'}>
                            Stock: {stock}
                          </span>
                        </div>
                        {product.allow_backorders && (
                          <span className="text-xs text-green-600">
                            ✓ Vente sur commande autorisée
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}