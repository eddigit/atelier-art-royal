import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProductListView({ products, onEdit, onDelete }) {
  return (
    <div className="space-y-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border">
                <span className="text-xs text-muted-foreground">Pas d'image</span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{product.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {product.sku && <span>SKU: {product.sku}</span>}
                <span>•</span>
                <span className="font-semibold text-primary">
                  {product.price?.toFixed(2)}€
                </span>
                {product.stock_quantity !== undefined && (
                  <>
                    <span>•</span>
                    <span>Stock: {product.stock_quantity}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!product.is_active && (
              <Badge variant="secondary">Inactif</Badge>
            )}
            {product.featured && (
              <Badge className="bg-primary/20 text-primary">★ Vedette</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(product)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Link to={createPageUrl('ProductDetail') + `?id=${product.id}`}>
              <Button variant="ghost" size="icon">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}