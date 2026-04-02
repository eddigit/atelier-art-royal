import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Star, Package, Truck, Shield, ArrowLeft, Phone, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ProductCard from '@/components/catalog/ProductCard';
import ProductReviews from '@/components/catalog/ProductReviews';
import { addToGuestCart } from '@/components/cart/guestCart';

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId
  });

  // SEO Meta Tags
  React.useEffect(() => {
    if (product) {
      document.title = `${product.name} — Atelier Art Royal`;

      const desc = product.short_description || product.description?.substring(0, 155) || `${product.name} - Haute couture maçonnique`;
      const image = product.images?.[0] || '';

      const metaTags = {
        'description': desc,
        'og:title': `${product.name} — Atelier Art Royal`,
        'og:description': desc,
        'og:image': image,
        'og:type': 'product',
        'og:url': window.location.href,
      };

      Object.entries(metaTags).forEach(([key, value]) => {
        if (!value) return;
        const isOg = key.startsWith('og:');
        const selector = isOg ? `meta[property="${key}"]` : `meta[name="${key}"]`;
        let tag = document.querySelector(selector);
        if (!tag) {
          tag = document.createElement('meta');
          if (isOg) tag.setAttribute('property', key);
          else tag.setAttribute('name', key);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', value);
      });
    }

    return () => {
      document.title = 'Atelier Art Royal';
      ['og:title', 'og:description', 'og:image', 'og:type', 'og:url'].forEach(key => {
        const tag = document.querySelector(`meta[property="${key}"]`);
        if (tag) tag.remove();
      });
    };
  }, [product]);

  const { data: rite } = useQuery({
    queryKey: ['rite', product?.rite_id],
    queryFn: async () => {
      const rites = await base44.entities.Rite.filter({ id: product.rite_id });
      return rites[0];
    },
    enabled: !!product?.rite_id
  });

  const { data: grade } = useQuery({
    queryKey: ['grade', product?.grade_id],
    queryFn: async () => {
      const grades = await base44.entities.Grade.filter({ id: product.grade_id });
      return grades[0];
    },
    enabled: !!product?.grade_id
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related', product?.rite_id],
    queryFn: async () => {
      if (!product?.rite_id) return [];
      const products = await base44.entities.Product.filter({ 
        rite_id: product.rite_id,
        is_active: true 
      }, '-created_date', 4);
      return products.filter(p => p.id !== productId).slice(0, 4);
    },
    enabled: !!product?.rite_id,
    initialData: []
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      // Validate variant selection
      if (product.sizes?.length > 0 && !selectedSize) {
        throw new Error('Veuillez sélectionner une taille');
      }
      if (product.colors?.length > 0 && !selectedColor) {
        throw new Error('Veuillez sélectionner une couleur');
      }

      const variantInfo = {
        selected_size: selectedSize || null,
        selected_color: selectedColor || null,
        selected_material: selectedMaterial || null,
      };

      try {
        const user = await base44.auth.me();

        if (user) {
          const existingItems = await base44.entities.CartItem.filter({
            user_id: user.id,
            product_id: product.id
          });

          // Check if same product with same variants exists
          const matchingItem = existingItems.find(item =>
            (item.selected_size || null) === variantInfo.selected_size &&
            (item.selected_color || null) === variantInfo.selected_color &&
            (item.selected_material || null) === variantInfo.selected_material
          );

          if (matchingItem) {
            await base44.entities.CartItem.update(matchingItem.id, {
              quantity: matchingItem.quantity + quantity
            });
          } else {
            await base44.entities.CartItem.create({
              user_id: user.id,
              product_id: product.id,
              quantity: quantity,
              price: product.price,
              ...variantInfo
            });
          }
        } else {
          addToGuestCart(product, quantity, variantInfo);
        }
      } catch (error) {
        if (error.message?.includes('sélectionner')) throw error;
        addToGuestCart(product, quantity, variantInfo);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['guest-cart']);
      toast.success('Produit ajouté au panier !');
      setQuantity(1);
    },
    onError: (error) => {
      console.error('Cart error:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout au panier');
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Produit non trouvé</h2>
        <Link to={createPageUrl('Catalog')}>
          <Button>Retour au catalogue</Button>
        </Link>
      </div>
    );
  }

  const images = product.images || ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=2105'];
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <Link to={createPageUrl('Catalog')} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted image-immersive">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {product.featured && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Coup de Cœur
                </Badge>
              )}
              {rite && (
                <Badge variant="outline">{rite.name}</Badge>
              )}
              {grade && (
                <Badge variant="outline">{grade.name}</Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            {product.short_description && (
              <p className="text-lg text-muted-foreground">{product.short_description}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-primary">{product.price.toFixed(2)}€</span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">
                {product.compare_at_price.toFixed(2)}€
              </span>
            )}
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-muted-foreground font-mono">
              Réf. : {product.sku}
            </p>
          )}

          {/* Stock */}
          {product.stock_quantity > 0 ? (
            product.stock_quantity <= product.low_stock_threshold ? (
              <p className="text-sm text-destructive">
                Plus que {product.stock_quantity} en stock
              </p>
            ) : (
              <p className="text-sm text-green-600">En stock</p>
            )
          ) : (
            <p className="text-sm text-destructive">Rupture de stock</p>
          )}

          {/* Variant Selectors */}
          {product.sizes?.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Taille <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Couleur <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                      selectedColor === color
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.materials?.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Matière</label>
              <div className="flex flex-wrap gap-2">
                {product.materials.map((material) => (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                      selectedMaterial === material
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex gap-3">
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= product.stock_quantity}
              >
                +
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => addToCartMutation.mutate()}
              disabled={(product.stock_quantity <= 0 && !product.allow_backorders) || addToCartMutation.isPending}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock_quantity <= 0 && product.allow_backorders ? 'Commander (en précommande)' : 'Ajouter au panier'}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Livraison 5-7j</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Paiement sécurisé</p>
            </div>
            <div className="text-center">
              <Package className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Franco dès 500€</p>
            </div>
          </div>

          {/* Sur-mesure */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Wrench className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Création Sur-Mesure</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  L'Atelier Art Royal réalise toutes vos pièces sur-mesure avec le plus grand soin. 
                  Contactez-nous directement pour discuter de votre projet et obtenir un devis personnalisé.
                </p>
                <a href="tel:+33646683610" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                  <Phone className="w-4 h-4" />
                  +33 6 46 68 36 10
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    Une personne dédiée prend en charge votre demande
                  </span>
                </a>
              </div>
            </div>
          </Card>

          {/* Description */}
          {product.description && (
            <Card className="p-6 mt-6">
              <h3 className="font-semibold text-lg mb-3">Description</h3>
              <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-20">
        <ProductReviews productId={productId} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold mb-8">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}