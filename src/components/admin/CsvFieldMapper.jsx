import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const ENTITY_FIELDS = [
  { value: 'product_id', label: 'ID Produit (pour mise à jour)', required: false },
  { value: 'name', label: 'Nom du produit', required: true },
  { value: 'price', label: 'Tarif régulier €', required: true },
  { value: 'compare_at_price', label: 'Tarif promo €', required: false },
  { value: 'sku', label: 'Référence produit', required: false },
  { value: 'product_type', label: 'Type produit', required: false },
  { value: 'rite_hint', label: 'Obédience (détection)', required: false },
  { value: 'grade_hint', label: 'Ordre et degré (détection)', required: false },
  { value: 'category_id', label: 'Famille produit', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'short_description', label: 'Description courte', required: false },
  { value: 'images', label: 'Images du produit (URLs)', required: false },
  { value: 'sizes', label: 'Taille', required: false },
  { value: 'tags', label: 'Étiquettes Tag', required: false },
  { value: 'is_active', label: 'Publié ? (1=Oui)', required: false },
  { value: 'featured', label: 'Mis en avant ? (1=Oui)', required: false },
  { value: 'promo_start_date', label: 'Date début promo', required: false },
  { value: 'promo_end_date', label: 'Date fin promo', required: false },
  { value: 'stock_status', label: 'En stock ? (instock/outofstock)', required: false },
  { value: 'stock_quantity', label: 'Nombre de produits en stock', required: false },
  { value: 'low_stock_threshold', label: 'Montant stock faible', required: false },
  { value: 'allow_backorders', label: 'Autoriser rupture ? (1=Oui)', required: false },
  { value: 'sold_individually', label: 'Vendre individuellement ? (1=Oui)', required: false },
  { value: 'weight', label: 'Poids (kg)', required: false },
  { value: 'length', label: 'Longueur (cm)', required: false },
  { value: 'width', label: 'Largeur (cm)', required: false },
  { value: 'height', label: 'Hauteur (cm)', required: false },
  { value: 'tax_status', label: 'État de la TVA', required: false },
  { value: 'tax_class', label: 'Classe de TVA (A/B/C)', required: false },
  { value: 'shipping_class', label: 'Classe d\'expédition (A/B/C)', required: false },
  { value: 'enable_reviews', label: 'Autoriser avis clients ? (1=Oui)', required: false },
  { value: 'customer_note', label: 'Note de commande', required: false },
  { value: 'product_groups', label: 'Groupes de produits', required: false },
  { value: 'related_products', label: 'Produits suggérés', required: false },
  { value: 'cross_sell_products', label: 'Ventes croisées', required: false },
  { value: 'ignore', label: '— Ignorer —', required: false }
];

const DEFAULT_MAPPING = {
  'ID': 'product_id',
  'Type produit': 'product_type',
  'Ordre et degré': 'grade_hint',
  'Obédience': 'rite_hint',
  'Nom du produit': 'name',
  'Référence du produit': 'sku',
  'Images du produits': 'images',
  'Taille': 'sizes',
  'Tarif régulier': 'price',
  'Description courte': 'short_description',
  'Description': 'description',
  'Publié': 'is_active',
  'Mis en avant': 'featured',
  'Date de début de promo': 'promo_start_date',
  'Date de fin de promo': 'promo_end_date',
  'En stock ?': 'stock_status',
  'Quantité en stock': 'stock_quantity',
  'Montant de stock faible': 'low_stock_threshold',
  'État de la TVA': 'tax_status',
  'Classe de TVA': 'tax_class',
  'Classe d\'expédition': 'shipping_class',
  'Autoriser les commandes': 'allow_backorders',
  'Vendre individuellement': 'sold_individually',
  'Poids': 'weight',
  'Longueur': 'length',
  'Largeur': 'width',
  'Hauteur': 'height',
  'Autoriser les avis': 'enable_reviews',
  'Note de commande': 'customer_note',
  'Tarif promo': 'compare_at_price',
  'Étiquettes': 'tags',
  'Famille produit': 'category_id',
  'Groupes de produits': 'product_groups',
  'Produits suggérés': 'related_products',
  'Ventes croisées': 'cross_sell_products'
};

export default function CsvFieldMapper({ csvHeaders, mapping, onMappingChange }) {
  const [localMapping, setLocalMapping] = useState({});

  useEffect(() => {
    if (csvHeaders && csvHeaders.length > 0 && Object.keys(localMapping).length === 0) {
      // Auto-map based on defaults
      const autoMapping = {};
      csvHeaders.forEach(header => {
        const cleanHeader = header.trim();
        const match = Object.keys(DEFAULT_MAPPING).find(key => 
          cleanHeader.toLowerCase().includes(key.toLowerCase())
        );
        autoMapping[cleanHeader] = match ? DEFAULT_MAPPING[match] : 'ignore';
      });
      setLocalMapping(autoMapping);
      onMappingChange(autoMapping);
    }
  }, [csvHeaders]);

  const handleFieldChange = (csvField, entityField) => {
    const newMapping = { ...localMapping, [csvField]: entityField };
    setLocalMapping(newMapping);
    onMappingChange(newMapping);
  };

  if (!csvHeaders || csvHeaders.length === 0) {
    return null;
  }

  const mappedFields = Object.values(localMapping).filter(v => v !== 'ignore');
  const requiredFields = ENTITY_FIELDS.filter(f => f.required);
  const allRequiredMapped = requiredFields.every(rf => 
    mappedFields.includes(rf.value)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mappage des colonnes CSV</CardTitle>
          <div className="flex items-center gap-2">
            {allRequiredMapped ? (
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30">✓ Champs requis OK</Badge>
            ) : (
              <Badge className="bg-red-600/20 text-red-400 border-red-600/30">⚠ Champs requis manquants</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {csvHeaders.map((csvField) => (
            <div key={csvField} className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-medium text-sm">{csvField}</p>
                <p className="text-xs text-muted-foreground">Colonne CSV</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <Select
                  value={localMapping[csvField] || 'ignore'}
                  onValueChange={(value) => handleFieldChange(csvField, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">📋 Résumé du mappage</h4>
          <div className="text-xs space-y-1">
            <p>• Colonnes CSV détectées : <strong>{csvHeaders.length}</strong></p>
            <p>• Colonnes mappées : <strong>{mappedFields.length}</strong></p>
            <p>• Colonnes ignorées : <strong>{csvHeaders.length - mappedFields.length}</strong></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}