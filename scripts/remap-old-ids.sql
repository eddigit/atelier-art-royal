-- =============================================================================
-- Remap old MongoDB IDs to PostgreSQL UUIDs in TEXT[] array columns
-- Run this on Neon after initial data import
-- =============================================================================

-- Products: remap category_ids (old_id → id from categories)
UPDATE products p
SET category_ids = (
  SELECT array_agg(c.id::text)
  FROM unnest(p.category_ids) AS old_val
  LEFT JOIN categories c ON c.old_id = old_val
  WHERE c.id IS NOT NULL
)
WHERE category_ids IS NOT NULL
  AND array_length(category_ids, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(category_ids) v
    WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
  );

-- Products: remap rite_ids (old_id → id from rites)
UPDATE products p
SET rite_ids = (
  SELECT array_agg(r.id::text)
  FROM unnest(p.rite_ids) AS old_val
  LEFT JOIN rites r ON r.old_id = old_val
  WHERE r.id IS NOT NULL
)
WHERE rite_ids IS NOT NULL
  AND array_length(rite_ids, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(rite_ids) v
    WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
  );

-- Products: remap obedience_ids (old_id → id from obediences)
UPDATE products p
SET obedience_ids = (
  SELECT array_agg(o.id::text)
  FROM unnest(p.obedience_ids) AS old_val
  LEFT JOIN obediences o ON o.old_id = old_val
  WHERE o.id IS NOT NULL
)
WHERE obedience_ids IS NOT NULL
  AND array_length(obedience_ids, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(obedience_ids) v
    WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
  );

-- Products: remap degree_order_ids (old_id → id from degree_orders)
UPDATE products p
SET degree_order_ids = (
  SELECT array_agg(d.id::text)
  FROM unnest(p.degree_order_ids) AS old_val
  LEFT JOIN degree_orders d ON d.old_id = old_val
  WHERE d.id IS NOT NULL
)
WHERE degree_order_ids IS NOT NULL
  AND array_length(degree_order_ids, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(degree_order_ids) v
    WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
  );

-- Products: remap related_products (old_id → id from products)
UPDATE products p
SET related_products = (
  SELECT array_agg(p2.id::text)
  FROM unnest(p.related_products) AS old_val
  LEFT JOIN products p2 ON p2.old_id = old_val
  WHERE p2.id IS NOT NULL
)
WHERE related_products IS NOT NULL
  AND array_length(related_products, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(related_products) v
    WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
  );

-- Products: remap cross_sell_products (old_id → id from products)
UPDATE products p
SET cross_sell_products = (
  SELECT array_agg(p2.id::text)
  FROM unnest(p.cross_sell_products) AS old_val
  LEFT JOIN products p2 ON p2.old_id = old_val
  WHERE p2.id IS NOT NULL
)
WHERE cross_sell_products IS NOT NULL
  AND array_length(cross_sell_products, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(cross_sell_products) v
    WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
  );

-- Degree orders: remap rite_id (singular TEXT field)
UPDATE degree_orders d
SET rite_id = r.id::text
FROM rites r
WHERE d.rite_id IS NOT NULL
  AND length(d.rite_id) = 24
  AND d.rite_id ~ '^[a-f0-9]{24}$'
  AND r.old_id = d.rite_id;

-- =============================================================================
-- Verification: check no MongoDB IDs remain in array columns
-- =============================================================================
SELECT 'products.category_ids' AS field, count(*) AS remaining_old_ids
FROM products, unnest(category_ids) v
WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
UNION ALL
SELECT 'products.rite_ids', count(*)
FROM products, unnest(rite_ids) v
WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
UNION ALL
SELECT 'products.obedience_ids', count(*)
FROM products, unnest(obedience_ids) v
WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
UNION ALL
SELECT 'products.degree_order_ids', count(*)
FROM products, unnest(degree_order_ids) v
WHERE length(v) = 24 AND v ~ '^[a-f0-9]{24}$'
ORDER BY field;
