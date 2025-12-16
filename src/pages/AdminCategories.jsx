import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Grid,
  AlertCircle,
  Edit,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import CategoryEditDialog from '@/components/admin/CategoryEditDialog';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list('order', 100),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
    initialData: []
  });

  const getProductCount = (categoryId) => {
    return products.filter(p => {
      if (Array.isArray(p.category_ids)) {
        return p.category_ids.includes(categoryId);
      }
      return p.category_id === categoryId;
    }).length;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Accès refusé</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gestion des Catégories</h1>
          <p className="text-muted-foreground">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''} configurée{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Catégorie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune catégorie configurée</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                  <div className="aspect-video relative bg-muted">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur">
                        {category.slug}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">
                        Ordre: {category.order || 0}
                      </Badge>
                      <Badge className="bg-primary/20 text-primary">
                        {getProductCount(category.id)} produit{getProductCount(category.id) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {(selectedCategory || showNewDialog) && (
        <CategoryEditDialog
          category={selectedCategory}
          open={!!(selectedCategory || showNewDialog)}
          onClose={() => {
            setSelectedCategory(null);
            setShowNewDialog(false);
          }}
          onSaved={() => {
            queryClient.invalidateQueries(['admin-categories']);
            queryClient.invalidateQueries(['categories']);
            setSelectedCategory(null);
            setShowNewDialog(false);
          }}
        />
      )}
    </div>
  );
}