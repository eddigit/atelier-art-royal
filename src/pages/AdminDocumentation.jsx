import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function AdminDocumentation() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-primary" />
          Documentation Technique
        </h1>
        <p className="text-muted-foreground">Architecture et logique de filtrage des produits</p>
      </div>

      {/* Structure des entités */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🗂️ Structure des Entités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-3">1. Product (Produit)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Entité centrale contenant les informations sur chaque produit du catalogue.
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`{
  "id": "uuid",
  "name": "Tablier REAA 30ème degré",
  "description": "Description détaillée...",
  "price": 350.00,
  "images": ["url1", "url2"],
  
  // Relations (IDs multiples possibles)
  "rite_ids": ["rite_uuid_1", "rite_uuid_2"],
  "obedience_ids": ["obedience_uuid_1"],
  "degree_order_ids": ["degree_uuid_1", "degree_uuid_2"],
  "category_ids": ["category_uuid_1"],
  
  // Caractéristiques
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["Rouge", "Bleu"],
  "materials": ["Soie", "Coton"],
  
  // Stock & Prix
  "stock_quantity": 10,
  "compare_at_price": 400.00,
  "promo_start_date": "2025-01-01",
  "promo_end_date": "2025-01-31",
  
  // Flags
  "is_active": true,
  "featured": false
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">2. Rite</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Système maçonnique (ex: REAA, RER, RF).
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`{
  "id": "uuid",
  "name": "REAA",
  "code": "REAA",
  "description": "Rite Écossais Ancien et Accepté",
  "image_url": "https://...",
  "order": 1
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">3. Obedience (Obédience)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Organisation maçonnique (ex: GLDF, GODF).
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`{
  "id": "uuid",
  "name": "GLDF",
  "code": "GLDF",
  "description": "Grande Loge de France",
  "image_url": "https://...",
  "order": 1
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">4. DegreeOrder (Degré & Ordre)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Grade ou ordre maçonnique (ex: Apprenti, Compagnon, Maître, 30ème degré).
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`{
  "id": "uuid",
  "name": "30ème degré - Chevalier Kadosh",
  "level": 30,
  "loge_type": "Loge Hauts Grades", // ou "Loge Symbolique"
  "description": "Description du degré...",
  "order": 30
}`}</pre>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>loge_type</strong> détermine la catégorie :
              </p>
              <ul className="text-xs text-blue-800 list-disc list-inside mt-2 space-y-1">
                <li><strong>Loge Symbolique</strong> : Degrés 1-3 (Apprenti, Compagnon, Maître)</li>
                <li><strong>Loge Hauts Grades</strong> : Degrés 4+ et Ordres</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">5. Category (Catégorie)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Type de produit (ex: Tabliers, Sautoirs, Bijoux, Gants).
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`{
  "id": "uuid",
  "name": "Tabliers",
  "slug": "tabliers",
  "description": "Tabliers maçonniques",
  "image_url": "https://...",
  "order": 1
}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relations et logique */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔗 Relations entre Entités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-3">Modèle Many-to-Many (N-N)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Un produit peut avoir <strong>plusieurs</strong> rites, obédiences, degrés, et catégories.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="font-bold min-w-[120px]">Product ↔ Rite</span>
                  <span className="text-muted-foreground">1 produit peut être compatible avec plusieurs rites (ex: REAA + RER)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold min-w-[120px]">Product ↔ Obedience</span>
                  <span className="text-muted-foreground">1 produit peut appartenir à plusieurs obédiences</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold min-w-[120px]">Product ↔ DegreeOrder</span>
                  <span className="text-muted-foreground">1 produit peut être pour plusieurs degrés (ex: 18ème, 30ème, 33ème)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold min-w-[120px]">Product ↔ Category</span>
                  <span className="text-muted-foreground">1 produit peut être dans plusieurs catégories</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Exemple concret</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`// Produit : Tablier REAA 30ème degré
{
  "name": "Tablier REAA 30ème degré Kadosh",
  "rite_ids": ["rite_reaa_uuid"],
  "obedience_ids": ["gldf_uuid", "godf_uuid"],
  "degree_order_ids": ["degree_30_uuid"],
  "category_ids": ["tabliers_uuid"]
}

// Ce produit apparaîtra quand l'utilisateur filtre :
// - Par rite : REAA ✓
// - Par obédience : GLDF ✓ ou GODF ✓
// - Par degré : 30ème degré ✓
// - Par type de loge : Hauts Grades ✓ (car degré 30 a loge_type="Loge Hauts Grades")
// - Par catégorie : Tabliers ✓`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logique de filtrage */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>⚙️ Logique de Filtrage (Catalog.js)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-3">1. Chargement des données</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`// Récupération de tous les produits actifs
const { data: products } = useQuery({
  queryKey: ['products', filters, sortBy],
  queryFn: async () => {
    let allProducts = await base44.entities.Product.filter(
      { is_active: true }, 
      sortBy, 
      500
    );
    
    // Filtrage côté client
    return allProducts.filter(product => {
      // Logique de filtrage...
    });
  }
});`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">2. Filtrage par Rite</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`if (filters.rite) {
  // Support des anciens produits (rite_id) et nouveaux (rite_ids)
  const riteIds = Array.isArray(product.rite_ids) && product.rite_ids.length > 0
    ? product.rite_ids 
    : (product.rite_id ? [product.rite_id] : []);
  
  // Le produit doit avoir le rite filtré dans sa liste
  if (!riteIds.includes(filters.rite)) return false;
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">3. Filtrage par Type de Loge</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Le type de loge est indirect : on cherche les degrés du produit et on vérifie leur <code className="bg-muted px-1 py-0.5 rounded">loge_type</code>.
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`if (filters.logeType) {
  // Récupérer les degree_order_ids du produit
  const degreeIds = Array.isArray(product.degree_order_ids) 
    ? product.degree_order_ids 
    : [];
  
  if (degreeIds.length === 0) return false;
  
  // Charger les objets DegreeOrder correspondants
  const productDegrees = allDegreeOrders.filter(d => degreeIds.includes(d.id));
  
  if (productDegrees.length === 0) return false;
  
  // Au moins un degré doit avoir le bon loge_type
  if (!productDegrees.some(d => d.loge_type === filters.logeType)) {
    return false;
  }
}`}</pre>
            </div>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Important :</strong> Le type de loge est stocké dans DegreeOrder, pas dans Product. 
                C'est pourquoi on doit faire une jointure.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">4. Filtrage par Degré spécifique</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`if (filters.degreeOrder) {
  const degreeIds = Array.isArray(product.degree_order_ids) 
    ? product.degree_order_ids 
    : [];
  
  if (!degreeIds.includes(filters.degreeOrder)) return false;
}`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">5. Filtres avancés</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-2">Promotions</p>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                  <pre>{`if (filters.showPromotions) {
  const hasDiscount = product.compare_at_price && 
                      product.compare_at_price > product.price;
  if (!hasDiscount) return false;
  
  // Vérifier dates promo
  const now = new Date();
  if (product.promo_start_date && new Date(product.promo_start_date) > now) 
    return false;
  if (product.promo_end_date && new Date(product.promo_end_date) < now) 
    return false;
}`}</pre>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Nouveautés (30 derniers jours)</p>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                  <pre>{`if (filters.showNew) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const productDate = new Date(product.created_date);
  if (productDate < thirtyDaysAgo) return false;
}`}</pre>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Recherche textuelle</p>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
                  <pre>{`if (filters.search) {
  const searchTerm = filters.search.toLowerCase();
  const searchableText = [
    product.name,
    product.description,
    product.short_description,
    ...(product.materials || []),
    ...(product.colors || []),
    ...(product.tags || [])
  ].filter(Boolean).join(' ').toLowerCase();
  
  if (!searchableText.includes(searchTerm)) return false;
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synchronisation URL */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔄 Synchronisation avec l'URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-3">Paramètres URL supportés</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`// Exemple d'URL avec filtres
/Catalog?rite=uuid&obedience=uuid&logeType=Loge%20Symbolique&category=uuid&search=tablier

// Paramètres disponibles :
- rite          : UUID du rite
- obedience     : UUID de l'obédience
- degreeOrder   : UUID du degré
- logeType      : "Loge Symbolique" ou "Loge Hauts Grades"
- category      : UUID de la catégorie
- search        : Texte libre
- minPrice      : Prix minimum
- maxPrice      : Prix maximum
- size          : Taille (S, M, L, XL)
- color         : Couleur
- material      : Matière
- showPromotions: true/false
- showNew       : true/false
- inStockOnly   : true/false`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Lecture depuis l'URL (au chargement)</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`useEffect(() => {
  const syncFiltersFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    setFilters({
      rite: urlParams.get('rite') || '',
      obedience: urlParams.get('obedience') || '',
      // ... autres filtres
    });
  };
  
  syncFiltersFromUrl();
  
  // Écouter navigation navigateur
  window.addEventListener('popstate', syncFiltersFromUrl);
  window.addEventListener('urlchange', syncFiltersFromUrl);
}, []);`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Écriture dans l'URL (quand filtres changent)</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`useEffect(() => {
  const params = new URLSearchParams();
  
  if (filters.rite) params.set('rite', filters.rite);
  if (filters.obedience) params.set('obedience', filters.obedience);
  // ... autres filtres
  
  const newUrl = params.toString() 
    ? \`\${window.location.pathname}?\${params.toString()}\`
    : window.location.pathname;
  
  window.history.replaceState({}, '', newUrl);
}, [filters]);`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu de navigation */}
      <Card>
        <CardHeader>
          <CardTitle>🧭 Menu de Navigation (Layout.js)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-3">Construction dynamique des menus</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Les menus sont générés à partir des données et n'affichent que les options ayant des produits associés.
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`// Charger tous les produits
const { data: products = [] } = useQuery({
  queryKey: ['products-menu'],
  queryFn: () => base44.entities.Product.filter(
    { is_active: true }, 
    '-created_date', 
    1000
  )
});

// Charger toutes les options
const { data: allRites = [] } = useQuery(...);
const { data: allObediences = [] } = useQuery(...);
const { data: allDegreeOrders = [] } = useQuery(...);
const { data: allCategories = [] } = useQuery(...);

// Filtrer pour n'afficher que les options avec produits
const rites = allRites.filter(r => 
  products.some(p => {
    const riteIds = Array.isArray(p.rite_ids) ? p.rite_ids : [];
    return riteIds.includes(r.id);
  })
);

// Pareil pour obediences, degrees, categories...`}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Liens vers le catalogue filtré</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
              <pre>{`<Link 
  to={createPageUrl('Catalog') + \`?obedience=\${obedience.id}\`}
  onClick={() => {
    // Déclencher l'événement pour rafraîchir si même page
    setTimeout(() => window.dispatchEvent(new Event('urlchange')), 0);
  }}
>
  {obedience.name}
</Link>`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}