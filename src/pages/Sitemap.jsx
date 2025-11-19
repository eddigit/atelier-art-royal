import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function Sitemap() {
  const { data: products = [] } = useQuery({
    queryKey: ['sitemap-products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['sitemap-categories'],
    queryFn: () => base44.entities.Category.list(),
    initialData: []
  });

  const { data: rites = [] } = useQuery({
    queryKey: ['sitemap-rites'],
    queryFn: () => base44.entities.Rite.list(),
    initialData: []
  });

  useEffect(() => {
    if (products.length > 0) {
      const baseUrl = window.location.origin;
      const today = new Date().toISOString().split('T')[0];
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Homepage
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';
      
      // Catalog
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/#/Catalog</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
      
      // Products
      products.forEach(product => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/#/ProductDetail?id=${product.id}</loc>\n`;
        xml += `    <lastmod>${product.updated_date?.split('T')[0] || today}</lastmod>\n`;
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });
      
      // Categories
      categories.forEach(category => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/#/Catalog?category=${category.id}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });
      
      // Rites
      rites.forEach(rite => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/#/Catalog?rite=${rite.id}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });
      
      xml += '</urlset>';
      
      // Create downloadable file
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [products, categories, rites]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Génération du sitemap...</h2>
      <p className="text-muted-foreground">
        Le téléchargement va démarrer automatiquement
      </p>
    </div>
  );
}