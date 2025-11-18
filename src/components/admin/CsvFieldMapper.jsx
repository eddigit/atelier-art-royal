import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const ENTITY_FIELDS = [
  { value: 'name', label: 'Nom du produit', required: true },
  { value: 'price', label: 'Prix', required: true },
  { value: 'sku', label: 'Référence / UGS', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'short_description', label: 'Description courte', required: false },
  { value: 'category_id', label: 'Catégorie', required: false },
  { value: 'images', label: 'Images (URLs)', required: false },
  { value: 'tags', label: 'Tags / Étiquettes', required: false },
  { value: 'stock_quantity', label: 'Stock', required: false },
  { value: 'sizes', label: 'Tailles', required: false },
  { value: 'colors', label: 'Couleurs', required: false },
  { value: 'materials', label: 'Matériaux', required: false },
  { value: 'rite_hint', label: 'Rite (détection)', required: false },
  { value: 'grade_hint', label: 'Grade (détection)', required: false },
  { value: 'ignore', label: '— Ignorer —', required: false }
];

const DEFAULT_MAPPING = {
  'UGS': 'sku',
  'SKU': 'sku',
  'Nom': 'name',
  'Name': 'name',
  'Tarif régulier': 'price',
  'Regular price': 'price',
  'Description courte': 'short_description',
  'Short description': 'short_description',
  'Description': 'description',
  'Catégories': 'category_id',
  'Categories': 'category_id',
  'Images': 'images',
  'Étiquettes': 'tags',
  'Tags': 'tags',
  'Stock': 'stock_quantity',
  'Marques': 'rite_hint'
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
              <Badge className="bg-green-100 text-green-800">✓ Champs requis OK</Badge>
            ) : (
              <Badge variant="destructive">⚠ Champs requis manquants</Badge>
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

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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