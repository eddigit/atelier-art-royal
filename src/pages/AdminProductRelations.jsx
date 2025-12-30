import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, AlertCircle, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProductRelations() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
    initialData: []
  });

  const { data: rites = [], isLoading: loadingRites } = useQuery({
    queryKey: ['all-rites'],
    queryFn: () => base44.entities.Rite.list('order', 100),
    initialData: []
  });

  const { data: obediences = [], isLoading: loadingObediences } = useQuery({
    queryKey: ['all-obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    initialData: []
  });

  const { data: degrees = [], isLoading: loadingDegrees } = useQuery({
    queryKey: ['all-degrees'],
    queryFn: () => base44.entities.DegreeOrder.list('order', 500),
    initialData: []
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => base44.entities.Category.list('order', 100),
    initialData: []
  });

  const isLoading = loadingProducts || loadingRites || loadingObediences || loadingDegrees || loadingCategories;

  // Enrichir les produits avec les noms des entités liées
  const enrichedProducts = useMemo(() => {
    return products.map(product => {
      const riteNames = (product.rite_ids || [])
        .map(id => rites.find(r => r.id === id)?.name)
        .filter(Boolean);

      const obedienceNames = (product.obedience_ids || [])
        .map(id => obediences.find(o => o.id === id)?.name)
        .filter(Boolean);

      const degreeNames = (product.degree_order_ids || [])
        .map(id => degrees.find(d => d.id === id)?.name)
        .filter(Boolean);

      const categoryNames = (product.category_ids || [])
        .map(id => categories.find(c => c.id === id)?.name)
        .filter(Boolean);

      return {
        ...product,
        riteNames,
        obedienceNames,
        degreeNames,
        categoryNames
      };
    });
  }, [products, rites, obediences, degrees, categories]);

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return enrichedProducts;
    
    const term = searchTerm.toLowerCase();
    return enrichedProducts.filter(product => 
      product.name?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.riteNames.some(r => r.toLowerCase().includes(term)) ||
      product.obedienceNames.some(o => o.toLowerCase().includes(term)) ||
      product.degreeNames.some(d => d.toLowerCase().includes(term)) ||
      product.categoryNames.some(c => c.toLowerCase().includes(term))
    );
  }, [enrichedProducts, searchTerm]);

  // Helper pour convertir en CSV
  const convertToCSV = (data, headers) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Échapper les guillemets et virgules
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  // Export produits
  const handleExportProducts = () => {
    const data = enrichedProducts.map(p => ({
      'Nom': p.name,
      'SKU': p.sku || '',
      'Prix': p.price,
      'Stock': p.stock_quantity || 0,
      'Rites': p.riteNames.join('; '),
      'Obédiences': p.obedienceNames.join('; '),
      'Degrés': p.degreeNames.join('; '),
      'Catégories': p.categoryNames.join('; '),
      'Description': p.description || '',
      'Image': (p.images && p.images[0]) || ''
    }));
    
    const csv = convertToCSV(data, ['Nom', 'SKU', 'Prix', 'Stock', 'Rites', 'Obédiences', 'Degrés', 'Catégories', 'Description', 'Image']);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export rites
  const handleExportRites = () => {
    const data = rites.map(r => ({
      'ID': r.id,
      'Nom': r.name,
      'Code': r.code,
      'Description': r.description || '',
      'Image': r.image_url || '',
      'Ordre': r.order || 0
    }));
    
    const csv = convertToCSV(data, ['ID', 'Nom', 'Code', 'Description', 'Image', 'Ordre']);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rites-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export obédiences
  const handleExportObediences = () => {
    const data = obediences.map(o => ({
      'ID': o.id,
      'Nom': o.name,
      'Code': o.code,
      'Description': o.description || '',
      'Image': o.image_url || '',
      'Ordre': o.order || 0
    }));
    
    const csv = convertToCSV(data, ['ID', 'Nom', 'Code', 'Description', 'Image', 'Ordre']);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obediences-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export degrés
  const handleExportDegrees = () => {
    const data = degrees.map(d => ({
      'ID': d.id,
      'Nom': d.name,
      'Niveau': d.level || 0,
      'Type de Loge': d.loge_type || '',
      'Description': d.description || '',
      'Ordre': d.order || 0
    }));
    
    const csv = convertToCSV(data, ['ID', 'Nom', 'Niveau', 'Type de Loge', 'Description', 'Ordre']);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `degres-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export catégories
  const handleExportCategories = () => {
    const data = categories.map(c => ({
      'ID': c.id,
      'Nom': c.name,
      'Slug': c.slug,
      'Description': c.description || '',
      'Image': c.image_url || '',
      'Ordre': c.order || 0
    }));
    
    const csv = convertToCSV(data, ['ID', 'Nom', 'Slug', 'Description', 'Image', 'Ordre']);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
        <p className="text-muted-foreground">Cette page est réservée aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Package className="w-10 h-10 text-primary" />
          Relations Produits
        </h1>
        <p className="text-muted-foreground">
          Vue d'ensemble complète des produits et leurs relations avec les rites, obédiences, degrés et catégories
        </p>
      </div>

      {/* Statistiques et exports */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{products.length}</div>
            <Button onClick={handleExportProducts} size="sm" variant="outline" className="w-full">
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{rites.length}</div>
            <Button onClick={handleExportRites} size="sm" variant="outline" className="w-full">
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Obédiences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{obediences.length}</div>
            <Button onClick={handleExportObediences} size="sm" variant="outline" className="w-full">
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Degrés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{degrees.length}</div>
            <Button onClick={handleExportDegrees} size="sm" variant="outline" className="w-full">
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{categories.length}</div>
            <Button onClick={handleExportCategories} size="sm" variant="outline" className="w-full">
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et export */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, SKU, rite, obédience, degré ou catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleExportProducts} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Produits CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product, index) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {index + 1}. {product.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">{product.sku || 'Pas de SKU'}</span>
                      <span>•</span>
                      <span className="font-bold text-primary">{product.price}€</span>
                      <span>•</span>
                      <span>Stock: {product.stock_quantity || 0}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rites */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Rites</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.riteNames.length > 0 ? (
                      product.riteNames.map((rite, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                          {rite}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Aucun rite associé</span>
                    )}
                  </div>
                </div>

                {/* Obédiences */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Obédiences</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.obedienceNames.length > 0 ? (
                      product.obedienceNames.map((obedience, i) => (
                        <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                          {obedience}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Aucune obédience associée</span>
                    )}
                  </div>
                </div>

                {/* Degrés */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Degrés & Ordres</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.degreeNames.length > 0 ? (
                      product.degreeNames.map((degree, i) => (
                        <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-800">
                          {degree}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Aucun degré associé</span>
                    )}
                  </div>
                </div>

                {/* Catégories */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Catégories</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.categoryNames.length > 0 ? (
                      product.categoryNames.map((category, i) => (
                        <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                          {category}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Aucune catégorie associée</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground">
                  Essayez de modifier votre recherche
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}