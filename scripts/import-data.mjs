// =============================================================================
// import-data.mjs — Import Base44 backup JSON into PostgreSQL
// Usage: DATABASE_URL=postgres://... node scripts/import-data.mjs
// =============================================================================

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import pg from 'pg';

const { Client } = pg;

const BACKUP_FILE = new URL('../atelier-art-royal-backup-2026-03-23.json', import.meta.url).pathname;
const ID_MAP_FILE = new URL('./id-mapping.json', import.meta.url).pathname;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Global map: oldBase44Id → newUUID */
const idMap = {};

function newId(oldId) {
  if (!oldId) return null;
  if (idMap[oldId]) return idMap[oldId];
  const uuid = randomUUID();
  idMap[oldId] = uuid;
  return uuid;
}

function mapOldId(oldId) {
  if (!oldId) return null;
  return idMap[oldId] || null;
}

function mapIdArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null; // SQL NULL
  return arr.map(id => idMap[id] || id); // keep unmapped as-is for debugging
}

function toTimestamp(val) {
  if (!val) return null;
  return new Date(val).toISOString();
}

function pgArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  return arr;
}

function resolveCreatedBy(record) {
  const cbId = record.created_by_id;
  if (!cbId) return null;
  // Service accounts (created_by_id starts with "service_") won't be in idMap
  return idMap[cbId] || null;
}

// ---------------------------------------------------------------------------
// Batch insert helper
// ---------------------------------------------------------------------------

async function batchInsert(pool, table, columns, rows) {
  if (rows.length === 0) return;

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    let paramIdx = 1;
    for (const row of batch) {
      const rowPlaceholders = [];
      for (const val of row) {
        if (Array.isArray(val)) {
          // TEXT[] or JSONB[] — cast as text array
          rowPlaceholders.push(`$${paramIdx}::text[]`);
        } else {
          rowPlaceholders.push(`$${paramIdx}`);
        }
        values.push(val);
        paramIdx++;
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`;
    await pool.query(sql, values);

    inserted += batch.length;
  }

  console.log(`  ✓ ${table}: ${inserted} rows inserted`);
}

// ---------------------------------------------------------------------------
// Entity importers
// ---------------------------------------------------------------------------

function prepareUsers(records) {
  const columns = [
    'id', 'old_id', 'email', 'full_name', 'role', 'app_role',
    'disabled', 'is_verified', 'created_at', 'updated_at'
  ];

  // First pass: generate IDs for all users
  for (const r of records) {
    newId(r.id);
  }

  const rows = records.map(r => [
    idMap[r.id],
    r.id,
    r.email,
    r.full_name || null,
    r.role || null,
    r._app_role || r.app_role || null,
    r.disabled || false,
    r.is_verified || false,
    toTimestamp(r.created_date),
    toTimestamp(r.updated_date),
  ]);

  return { columns, rows };
}

function prepareUsersCreatedBy(records) {
  // Second pass: update created_by now that all user IDs are mapped
  const updates = [];
  for (const r of records) {
    const createdBy = resolveCreatedBy(r);
    if (createdBy) {
      updates.push({ id: idMap[r.id], created_by: createdBy });
    }
  }
  return updates;
}

function prepareRites(records) {
  const columns = [
    'id', 'old_id', 'name', 'code', 'description', 'image_url',
    '"order"', 'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, r.name, r.code || null, r.description || null,
    r.image_url || null, r.order ?? null, resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareObediences(records) {
  const columns = [
    'id', 'old_id', 'name', 'code', 'description', 'image_url',
    '"order"', 'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, r.name, r.code || null, r.description || null,
    r.image_url || null, r.order ?? null, resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareCategories(records) {
  const columns = [
    'id', 'old_id', 'name', 'slug', 'description', 'image_url',
    '"order"', 'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, r.name, r.slug || null, r.description || null,
    r.image_url || null, r.order ?? null, resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareDegreeOrders(records) {
  const columns = [
    'id', 'old_id', 'name', 'level', 'loge_type', 'rite_id',
    'description', '"order"', 'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, r.name, r.level ?? null, r.loge_type || null,
    mapOldId(r.rite_id) || r.rite_id || null,
    r.description || null, r.order ?? null, resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareProducts(records) {
  const columns = [
    'id', 'old_id', 'name', 'slug', 'sku', 'description', 'short_description',
    'product_type', 'price', 'compare_at_price', 'is_active', 'featured',
    'enable_reviews', 'sold_individually', 'allow_backorders',
    'stock_quantity', 'low_stock_threshold', 'tax_status', 'tax_class',
    'shipping_class', 'weight', 'length', 'width', 'height',
    'customer_note', 'video_url', 'promo_start_date', 'promo_end_date',
    'images', 'colors', 'sizes', 'tags', 'materials', 'product_groups',
    'related_products', 'cross_sell_products',
    'rite_ids', 'obedience_ids', 'category_ids', 'degree_order_ids',
    'created_by', 'created_at', 'updated_at'
  ];

  const rows = records.map(r => [
    newId(r.id), r.id, r.name, r.slug || null, r.sku || null,
    r.description || null, r.short_description || null,
    r.product_type || null, r.price ?? null, r.compare_at_price ?? null,
    r.is_active ?? true, r.featured ?? false,
    r.enable_reviews ?? true, r.sold_individually ?? false,
    r.allow_backorders ?? false,
    r.stock_quantity ?? 0, r.low_stock_threshold ?? 5,
    r.tax_status || null, r.tax_class || null,
    r.shipping_class || null, r.weight ?? null, r.length ?? null,
    r.width ?? null, r.height ?? null,
    r.customer_note || null, r.video_url || null,
    toTimestamp(r.promo_start_date), toTimestamp(r.promo_end_date),
    pgArray(r.images), pgArray(r.colors), pgArray(r.sizes),
    pgArray(r.tags), pgArray(r.materials), pgArray(r.product_groups),
    pgArray(mapIdArray(r.related_products)),
    pgArray(mapIdArray(r.cross_sell_products)),
    pgArray(mapIdArray(r.rite_ids)),
    pgArray(mapIdArray(r.obedience_ids)),
    pgArray(mapIdArray(r.category_ids)),
    pgArray(mapIdArray(r.degree_order_ids)),
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);

  return { columns, rows };
}

function prepareOrders(records) {
  const columns = [
    'id', 'old_id', 'order_number', 'customer_id', 'status',
    'payment_status', 'payment_method', 'stripe_payment_id',
    'sales_channel', 'subtotal', 'shipping_cost', 'total',
    'billing_address', 'shipping_address', 'items',
    'tracking_number', 'notes', 'created_by', 'created_at', 'updated_at'
  ];

  const rows = records.map(r => [
    newId(r.id), r.id, r.order_number,
    mapOldId(r.customer_id), r.status || null,
    r.payment_status || null, r.payment_method || null,
    r.stripe_payment_id || null, r.sales_channel || null,
    r.subtotal ?? null, r.shipping_cost ?? null, r.total ?? null,
    r.billing_address ? JSON.stringify(r.billing_address) : null,
    r.shipping_address ? JSON.stringify(r.shipping_address) : null,
    r.items ? JSON.stringify(r.items) : null,
    r.tracking_number || null, r.notes || null,
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);

  return { columns, rows };
}

function prepareCartItems(records) {
  const columns = [
    'id', 'old_id', 'user_id', 'product_id', 'quantity', 'price',
    'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, mapOldId(r.user_id), mapOldId(r.product_id),
    r.quantity ?? 1, r.price ?? null, resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareWishlistItems(records) {
  const columns = [
    'id', 'old_id', 'user_id', 'product_id',
    'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, mapOldId(r.user_id), mapOldId(r.product_id),
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareLeadRequests(records) {
  const columns = [
    'id', 'old_id', 'user_id', 'product_id', 'contact_name',
    'contact_email', 'contact_phone', 'rite', 'obedience', 'degree_order',
    'source', 'priority', 'status', 'request_details', 'admin_notes',
    'conversation_context', 'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, mapOldId(r.user_id), mapOldId(r.product_id),
    r.contact_name || null, r.contact_email || null, r.contact_phone || null,
    r.rite || null, r.obedience || null, r.degree_order || null,
    r.source || null, r.priority || null, r.status || null,
    r.request_details || null, r.admin_notes || null,
    r.conversation_context || null,
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareProductionItems(records) {
  const columns = [
    'id', 'old_id', 'customer_id', 'order_id', 'product_name', 'status',
    'specifications', 'design_images', 'due_date', 'priority', 'notes',
    'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, mapOldId(r.customer_id), mapOldId(r.order_id),
    r.product_name || null, r.status || null,
    r.specifications ? (typeof r.specifications === 'string' ? JSON.stringify(r.specifications) : JSON.stringify(r.specifications)) : null,
    pgArray(r.design_images),
    r.due_date || null, r.priority || null, r.notes || null,
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareLoyaltyPoints(records) {
  const columns = [
    'id', 'old_id', 'user_id', 'points',
    'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, mapOldId(r.user_id), r.points ?? 0,
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

function prepareAppSettings(records) {
  const columns = [
    'id', 'old_id', 'key', 'value',
    'created_by', 'created_at', 'updated_at'
  ];
  const rows = records.map(r => [
    newId(r.id), r.id, r.key, r.value ? JSON.stringify(r.value) : null,
    resolveCreatedBy(r),
    toTimestamp(r.created_date), toTimestamp(r.updated_date),
  ]);
  return { columns, rows };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Atelier Art Royal — Data Import ===\n');

  // Load backup
  console.log(`Reading backup: ${BACKUP_FILE}`);
  const backup = JSON.parse(readFileSync(BACKUP_FILE, 'utf-8'));
  const data = backup.data;
  console.log(`Export date: ${backup.export_date}\n`);

  // Connect to DB
  const pool = new Client({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5433'),
    user: process.env.PGUSER || 'artroyal',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'artroyal_db',
  });
  await pool.connect();
  console.log('Connected to PostgreSQL\n');

  try {
    // ---- 1. Users (no created_by yet — self-referential) ----
    console.log('[1/13] Importing Users...');
    const users = prepareUsers(data.User || []);
    await batchInsert(pool, 'users', users.columns, users.rows);

    // Update created_by for users now that all user IDs exist
    const userUpdates = prepareUsersCreatedBy(data.User || []);
    for (const u of userUpdates) {
      await pool.query('UPDATE users SET created_by = $1 WHERE id = $2', [u.created_by, u.id]);
    }
    if (userUpdates.length > 0) {
      console.log(`  ✓ users: ${userUpdates.length} created_by references updated`);
    }

    // ---- 2. Rites ----
    console.log('[2/13] Importing Rites...');
    const rites = prepareRites(data.Rite || []);
    await batchInsert(pool, 'rites', rites.columns, rites.rows);

    // ---- 3. Obediences ----
    console.log('[3/13] Importing Obediences...');
    const obediences = prepareObediences(data.Obedience || []);
    await batchInsert(pool, 'obediences', obediences.columns, obediences.rows);

    // ---- 4. Categories ----
    console.log('[4/13] Importing Categories...');
    const categories = prepareCategories(data.Category || []);
    await batchInsert(pool, 'categories', categories.columns, categories.rows);

    // ---- 5. DegreeOrders ----
    console.log('[5/13] Importing DegreeOrders...');
    const degreeOrders = prepareDegreeOrders(data.DegreeOrder || []);
    await batchInsert(pool, 'degree_orders', degreeOrders.columns, degreeOrders.rows);

    // ---- 6. Products ----
    console.log('[6/13] Importing Products...');
    const products = prepareProducts(data.Product || []);
    await batchInsert(pool, 'products', products.columns, products.rows);

    // ---- 7. Orders ----
    console.log('[7/13] Importing Orders...');
    const orders = prepareOrders(data.Order || []);
    await batchInsert(pool, 'orders', orders.columns, orders.rows);

    // ---- 8. CartItems ----
    console.log('[8/13] Importing CartItems...');
    const cartItems = prepareCartItems(data.CartItem || []);
    await batchInsert(pool, 'cart_items', cartItems.columns, cartItems.rows);

    // ---- 9. WishlistItems ----
    console.log('[9/13] Importing WishlistItems...');
    const wishlistItems = prepareWishlistItems(data.WishlistItem || []);
    await batchInsert(pool, 'wishlist_items', wishlistItems.columns, wishlistItems.rows);

    // ---- 10. LeadRequests ----
    console.log('[10/13] Importing LeadRequests...');
    const leadRequests = prepareLeadRequests(data.LeadRequest || []);
    await batchInsert(pool, 'lead_requests', leadRequests.columns, leadRequests.rows);

    // ---- 11. ProductionItems ----
    console.log('[11/13] Importing ProductionItems...');
    const productionItems = prepareProductionItems(data.ProductionItem || []);
    await batchInsert(pool, 'production_items', productionItems.columns, productionItems.rows);

    // ---- 12. LoyaltyPoints ----
    console.log('[12/13] Importing LoyaltyPoints...');
    const loyaltyPoints = prepareLoyaltyPoints(data.LoyaltyPoints || []);
    await batchInsert(pool, 'loyalty_points', loyaltyPoints.columns, loyaltyPoints.rows);

    // ---- 13. AppSettings ----
    console.log('[13/13] Importing AppSettings...');
    const appSettings = prepareAppSettings(data.AppSettings || []);
    await batchInsert(pool, 'app_settings', appSettings.columns, appSettings.rows);

    // ---- Save ID mapping ----
    console.log(`\nSaving ID mapping (${Object.keys(idMap).length} entries) → ${ID_MAP_FILE}`);
    writeFileSync(ID_MAP_FILE, JSON.stringify(idMap, null, 2));

    console.log('\n=== Import complete ===');
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
