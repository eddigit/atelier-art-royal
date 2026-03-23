// ---------------------------------------------------------------------------
// Field mapping between Base44 names and PostgreSQL column names
// ---------------------------------------------------------------------------

const FIELD_TO_COLUMN = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  created_by_id: 'created_by',
};

const COLUMN_TO_FIELD = {};
for (const [field, col] of Object.entries(FIELD_TO_COLUMN)) {
  COLUMN_TO_FIELD[col] = field;
}

// ---------------------------------------------------------------------------
// Entity name → table name mapping
// ---------------------------------------------------------------------------

const ENTITY_TABLE_MAP = {
  Product: 'products',
  Rite: 'rites',
  Obedience: 'obediences',
  Category: 'categories',
  DegreeOrder: 'degree_orders',
  Order: 'orders',
  User: 'users',
  CartItem: 'cart_items',
  Quote: 'quotes',
  ProductReview: 'product_reviews',
  WishlistItem: 'wishlist_items',
  SavedCustomization: 'saved_customizations',
  BusinessOpportunity: 'business_opportunities',
  LeadRequest: 'lead_requests',
  ProductionItem: 'production_items',
  LoyaltyPoints: 'loyalty_points',
  AppSettings: 'app_settings',
  Grade: 'grades',
};

// Entities that allow unauthenticated reads
const PUBLIC_READ_ENTITIES = new Set([
  'products',
  'rites',
  'obediences',
  'categories',
  'degree_orders',
  'app_settings',
  'grades',
]);

// Entities where write operations require admin role
const ADMIN_WRITE_ENTITIES = new Set([
  'products',
  'categories',
  'rites',
  'obediences',
  'degree_orders',
  'app_settings',
  'grades',
]);

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Base44-style record to DB column names.
 */
function mapToDb(record) {
  if (!record) return record;
  const mapped = {};
  for (const [key, value] of Object.entries(record)) {
    const col = FIELD_TO_COLUMN[key] || key;
    mapped[col] = value;
  }
  return mapped;
}

/**
 * Convert a DB row to Base44-style field names.
 */
function mapFromDb(row) {
  if (!row) return row;
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const field = COLUMN_TO_FIELD[key] || key;
    mapped[field] = value;
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Sort parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Base44-style sort string like '-created_date' into SQL parts.
 * @param {string} sortStr
 * @returns {{ column: string, direction: string }}
 */
function parseSort(sortStr) {
  if (!sortStr) return { column: 'created_at', direction: 'DESC' };
  let direction = 'ASC';
  let field = sortStr;
  if (sortStr.startsWith('-')) {
    direction = 'DESC';
    field = sortStr.slice(1);
  }
  const column = FIELD_TO_COLUMN[field] || field;
  return { column, direction };
}

// ---------------------------------------------------------------------------
// Filter / query builder
// ---------------------------------------------------------------------------

/**
 * Build a parameterized SELECT query from Base44-style filters.
 *
 * @param {string} tableName   - PostgreSQL table name
 * @param {object} filters     - Key/value filter object (Base44 field names)
 * @param {string} [sort]      - Sort string, e.g. '-created_date'
 * @param {number} [limit=100] - Max rows
 * @returns {{ text: string, values: Array }}
 */
function buildFilterQuery(tableName, filters, sort, limit = 100) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (filters && typeof filters === 'object') {
    for (const [field, value] of Object.entries(filters)) {
      const column = FIELD_TO_COLUMN[field] || field;

      if (Array.isArray(value)) {
        // IN query
        const placeholders = value.map((_, i) => `$${idx + i}`).join(', ');
        conditions.push(`"${column}" IN (${placeholders})`);
        values.push(...value);
        idx += value.length;
      } else if (typeof value === 'object' && value !== null) {
        // Operator-based filters: { $gt: 5 }, { $like: '%foo%' }, etc.
        for (const [op, opVal] of Object.entries(value)) {
          switch (op) {
            case '$gt':
              conditions.push(`"${column}" > $${idx}`);
              values.push(opVal);
              idx++;
              break;
            case '$gte':
              conditions.push(`"${column}" >= $${idx}`);
              values.push(opVal);
              idx++;
              break;
            case '$lt':
              conditions.push(`"${column}" < $${idx}`);
              values.push(opVal);
              idx++;
              break;
            case '$lte':
              conditions.push(`"${column}" <= $${idx}`);
              values.push(opVal);
              idx++;
              break;
            case '$ne':
              conditions.push(`"${column}" != $${idx}`);
              values.push(opVal);
              idx++;
              break;
            case '$like':
              conditions.push(`"${column}" ILIKE $${idx}`);
              values.push(opVal);
              idx++;
              break;
            default:
              // Treat unknown operators as equality
              conditions.push(`"${column}" = $${idx}`);
              values.push(opVal);
              idx++;
          }
        }
      } else {
        // Simple equality
        conditions.push(`"${column}" = $${idx}`);
        values.push(value);
        idx++;
      }
    }
  }

  const { column: sortCol, direction } = parseSort(sort);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

  let text = `SELECT * FROM "${tableName}"`;
  if (conditions.length > 0) {
    text += ` WHERE ${conditions.join(' AND ')}`;
  }
  text += ` ORDER BY "${sortCol}" ${direction}`;
  text += ` LIMIT $${idx}`;
  values.push(safeLimit);

  return { text, values };
}

module.exports = {
  FIELD_TO_COLUMN,
  COLUMN_TO_FIELD,
  ENTITY_TABLE_MAP,
  PUBLIC_READ_ENTITIES,
  ADMIN_WRITE_ENTITIES,
  mapToDb,
  mapFromDb,
  parseSort,
  buildFilterQuery,
};
