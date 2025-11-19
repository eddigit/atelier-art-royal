import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Edit, Trash2, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProductGridView({ products, onEdit, onDelete, selectedProducts = [], onToggleSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
          {onToggleSelect && (
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={() => onToggleSelect(product.id)}
                className="bg-white border-2"
              />
            </div>
          )}
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.images?.[0] ? (
              <>
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.images.length > 1 && (
                  <Badge className="absolute top-2 right-2 bg-black/60 text-white border-0">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {product.images.length}
                  </Badge>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground">Aucune image</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onEdit(product)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
                <Button size="icon" variant="secondary">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onDelete(product.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                  {product.name}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {product.price?.toFixed(2)}€
                </span>
                <div className="flex items-center gap-1">
                  {!product.is_active && (
                    <Badge variant="secondary" className="text-xs">Inactif</Badge>
                  )}
                  {product.featured && (
                    <Badge className="bg-primary/20 text-primary text-xs">★</Badge>
                  )}
                </div>
              </div>
              {product.sku && (
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              )}
              {product.stock_quantity !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Stock:</span>
                  <Badge 
                    variant={product.stock_quantity <= (product.low_stock_threshold || 5) ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {product.stock_quantity}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}