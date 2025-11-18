import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SavedCustomizations() {
  const queryClient = useQueryClient();
  const [selectedCustomization, setSelectedCustomization] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: customizations = [], isLoading } = useQuery({
    queryKey: ['saved-customizations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SavedCustomization.filter({ user_id: user.id }, '-created_date', 100);
    },
    enabled: !!user,
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['customization-products', customizations],
    queryFn: async () => {
      if (customizations.length === 0) return [];
      const productIds = [...new Set(customizations.map(c => c.product_id))];
      const productPromises = productIds.map(id =>
        base44.entities.Product.filter({ id }).then(p => p[0])
      );
      return Promise.all(productPromises);
    },
    enabled: customizations.length > 0,
    initialData: []
  });

  const deleteCustomizationMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedCustomization.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-customizations']);
      toast.success('Personnalisation supprimée');
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async (customization) => {
      const product = products.find(p => p.id === customization.product_id);
      if (!product) throw new Error('Produit introuvable');

      const existingCart = await base44.entities.CartItem.filter({
        user_id: user.id,
        product_id: product.id
      });

      if (existingCart.length > 0) {
        await base44.entities.CartItem.update(existingCart[0].id, {
          quantity: existingCart[0].quantity + 1
        });
      } else {
        await base44.entities.CartItem.create({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
          price: product.price
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Ajouté au panier avec personnalisation');
    }
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connectez-vous pour voir vos créations</h2>
        <Button onClick={() => base44.auth.redirectToLogin()}>
          Se connecter
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const getProductForCustomization = (customization) => {
    return products.find(p => p.id === customization.product_id);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mes Créations Sur-Mesure</h1>
        <p className="text-muted-foreground">
          Retrouvez vos personnalisations sauvegardées
        </p>
      </div>

      {customizations.length === 0 ? (
        <Card className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune création sauvegardée</h3>
          <p className="text-muted-foreground mb-6">
            Commencez à personnaliser vos produits préférés
          </p>
          <Link to={createPageUrl('Catalog')}>
            <Button>Parcourir le catalogue</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customizations.map((customization) => {
            const product = getProductForCustomization(customization);
            if (!product) return null;

            return (
              <Card key={customization.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {customization.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {product.name}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-current" />
                      Sur-mesure
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Image */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Customization Preview */}
                  {customization.customization_details && (
                    <div className="text-xs space-y-1 p-3 bg-muted/50 rounded-lg">
                      {customization.customization_details.embroidery_text && (
                        <p>
                          <span className="font-medium">Broderie:</span>{' '}
                          {customization.customization_details.embroidery_text}
                        </p>
                      )}
                      {customization.customization_details.material && (
                        <p>
                          <span className="font-medium">Matériau:</span>{' '}
                          {customization.customization_details.material}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedCustomization(customization)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => addToCartMutation.mutate(customization)}
                      disabled={addToCartMutation.isLoading}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Panier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCustomizationMutation.mutate(customization.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedCustomization} onOpenChange={() => setSelectedCustomization(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCustomization?.name}</DialogTitle>
            <DialogDescription>
              Détails de votre création sur-mesure
            </DialogDescription>
          </DialogHeader>
          {selectedCustomization && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Produit</h4>
                <p className="text-sm text-muted-foreground">
                  {getProductForCustomization(selectedCustomization)?.name}
                </p>
              </div>
              {selectedCustomization.customization_details && (
                <div>
                  <h4 className="font-semibold mb-2">Personnalisations</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedCustomization.customization_details).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex justify-between p-2 bg-muted rounded">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              {selectedCustomization.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {selectedCustomization.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}