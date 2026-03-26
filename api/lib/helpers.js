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
// MongoDB ObjectID detection — 24-char hex string (not a UUID)
// ---------------------------------------------------------------------------
const MONGO_ID_RE = /^[a-f0-9]{24}$/;

function isMongoId(val) {
  return typeof val === 'string' && MONGO_ID_RE.test(val);
}

/**
 * If filtering by "id" with MongoDB-style values, redirect to "old_id".
 */
function resolveIdColumn(column, filterValues) {
  if (column !== 'id') return column;
  const vals = Array.isArray(filterValues) ? filterValues : [filterValues];
  if (vals.some(isMongoId)) return 'old_id';
  return 'id';
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
      let column = FIELD_TO_COLUMN[field] || field;

      if (Array.isArray(value)) {
        // IN query — redirect id→old_id if MongoDB IDs detected
        column = resolveIdColumn(column, value);
        const placeholders = value.map((_, i) => `$${idx + i}`).join(', ');
        conditions.push(`"${column}" IN (${placeholders})`);
        values.push(...value);
        idx += value.length;
      } else if (typeof value === 'object' && value !== null) {
        // Operator-based filters: { $gt: 5 }, { $like: '%foo%' }, etc.
        for (const [op, opVal] of Object.entries(value)) {
          let opColumn = column;
          // For $in operator, also check for MongoDB IDs
          if (op === '$in' && Array.isArray(opVal)) {
            opColumn = resolveIdColumn(column, opVal);
            const placeholders = opVal.map((_, i) => `$${idx + i}`).join(', ');
            conditions.push(`"${opColumn}" IN (${placeholders})`);
            values.push(...opVal);
            idx += opVal.length;
            continue;
          }
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
        // Simple equality — redirect id→old_id if MongoDB ID detected
        column = resolveIdColumn(column, value);
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

export {
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
