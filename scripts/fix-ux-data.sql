-- =============================================================================
-- UX Data Fixes for Atelier Art Royal
-- Run once against production Neon database
-- =============================================================================

-- 1. Fix duplicate "Gants" category
-- Keep the one with the most product associations (or oldest), delete the other
-- First, identify duplicates:
-- SELECT id, name, created_at FROM categories WHERE LOWER(name) = 'gants' ORDER BY created_at;

-- Delete the newer duplicate (keeps the oldest one)
DELETE FROM categories
WHERE LOWER(name) = 'gants'
  AND id != (
    SELECT id FROM categories WHERE LOWER(name) = 'gants' ORDER BY created_at ASC LIMIT 1
  );

-- 2. Fix negative stock quantities — set to 0
UPDATE products
SET stock_quantity = 0, updated_at = NOW()
WHERE stock_quantity < 0;

-- 3. Insert default app_settings (only if not already present)
INSERT INTO app_settings (key, value) VALUES
  ('shop_name', '"Atelier Art Royal"'),
  ('shop_currency', '"EUR"'),
  ('shop_email', '"contact@artroyal.fr"'),
  ('shop_phone', '"+33 6 46 68 36 10"'),
  ('shipping_standard_cost', '8.90'),
  ('shipping_free_threshold', '150'),
  ('shop_description', '"Haute Couture Maçonnique — Fabrication française"')
ON CONFLICT (key) DO NOTHING;
