-- =============================================================================
-- Atelier Art Royal — PostgreSQL Schema
-- Generated from Base44 backup structure (2026-03-23)
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Helper: auto-update updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id        TEXT,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT,
  app_role      TEXT,
  disabled      BOOLEAN DEFAULT false,
  is_verified   BOOLEAN DEFAULT false,
  password_hash TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_old_id ON users(old_id);

-- =============================================================================
-- RITES
-- =============================================================================
CREATE TABLE rites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  name        TEXT NOT NULL,
  code        TEXT,
  description TEXT,
  image_url   TEXT,
  "order"     INTEGER,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rites_old_id ON rites(old_id);

-- =============================================================================
-- OBEDIENCES
-- =============================================================================
CREATE TABLE obediences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  name        TEXT NOT NULL,
  code        TEXT,
  description TEXT,
  image_url   TEXT,
  "order"     INTEGER,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_obediences_old_id ON obediences(old_id);

-- =============================================================================
-- CATEGORIES
-- =============================================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  name        TEXT NOT NULL,
  slug        TEXT,
  description TEXT,
  image_url   TEXT,
  "order"     INTEGER,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_old_id ON categories(old_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- =============================================================================
-- DEGREE ORDERS
-- =============================================================================
CREATE TABLE degree_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  name        TEXT NOT NULL,
  level       INTEGER,
  loge_type   TEXT,
  rite_id     TEXT,              -- old rite ID kept as TEXT, remap in app layer
  description TEXT,
  "order"     INTEGER,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_degree_orders_old_id ON degree_orders(old_id);

-- =============================================================================
-- PRODUCTS
-- =============================================================================
CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id              TEXT,
  name                TEXT NOT NULL,
  slug                TEXT,
  sku                 TEXT,
  description         TEXT,
  short_description   TEXT,
  product_type        TEXT,
  price               DECIMAL(10,2),
  compare_at_price    DECIMAL(10,2),
  is_active           BOOLEAN DEFAULT true,
  featured            BOOLEAN DEFAULT false,
  enable_reviews      BOOLEAN DEFAULT true,
  sold_individually   BOOLEAN DEFAULT false,
  allow_backorders    BOOLEAN DEFAULT false,
  stock_quantity      INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  tax_status          TEXT,
  tax_class           TEXT,
  shipping_class      TEXT,
  weight              DECIMAL(10,2),
  length              DECIMAL(10,2),
  width               DECIMAL(10,2),
  height              DECIMAL(10,2),
  customer_note       TEXT,
  video_url           TEXT,
  promo_start_date    TIMESTAMPTZ,
  promo_end_date      TIMESTAMPTZ,
  -- Array fields: kept as TEXT[] to minimize frontend changes
  images              TEXT[],
  colors              TEXT[],
  sizes               TEXT[],
  tags                TEXT[],
  materials           TEXT[],
  product_groups      TEXT[],
  related_products    TEXT[],
  cross_sell_products TEXT[],
  -- FK arrays stored as TEXT[] (old IDs initially, remapped to new UUIDs)
  rite_ids            TEXT[],
  obedience_ids       TEXT[],
  category_ids        TEXT[],
  degree_order_ids    TEXT[],
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_old_id ON products(old_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(featured);

-- =============================================================================
-- ORDERS
-- =============================================================================
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id            TEXT,
  order_number      TEXT NOT NULL UNIQUE,
  customer_id       UUID REFERENCES users(id),
  status            TEXT,
  payment_status    TEXT,
  payment_method    TEXT,
  stripe_payment_id TEXT,
  sales_channel     TEXT,
  subtotal          DECIMAL(10,2),
  shipping_cost     DECIMAL(10,2),
  total             DECIMAL(10,2),
  billing_address   JSONB,
  shipping_address  JSONB,
  items             JSONB,
  tracking_number   TEXT,
  notes             TEXT,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_old_id ON orders(old_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- =============================================================================
-- CART ITEMS
-- =============================================================================
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  quantity    INTEGER DEFAULT 1,
  price       DECIMAL(10,2),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- =============================================================================
-- QUOTES
-- =============================================================================
CREATE TABLE quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  customer_id UUID REFERENCES users(id),
  items       JSONB,
  subtotal    DECIMAL(10,2),
  total       DECIMAL(10,2),
  status      TEXT,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- PRODUCT REVIEWS
-- =============================================================================
CREATE TABLE product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  product_id  UUID REFERENCES products(id),
  user_id     UUID REFERENCES users(id),
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  status      TEXT DEFAULT 'pending',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);

-- =============================================================================
-- WISHLIST ITEMS
-- =============================================================================
CREATE TABLE wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE UNIQUE INDEX idx_wishlist_items_user_product ON wishlist_items(user_id, product_id);

-- =============================================================================
-- SAVED CUSTOMIZATIONS
-- =============================================================================
CREATE TABLE saved_customizations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id             TEXT,
  user_id            UUID REFERENCES users(id),
  product_id         UUID REFERENCES products(id),
  customization_data JSONB,
  created_by         UUID REFERENCES users(id),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- LEAD REQUESTS
-- =============================================================================
CREATE TABLE lead_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id               TEXT,
  user_id              UUID REFERENCES users(id),
  product_id           UUID REFERENCES products(id),
  contact_name         TEXT,
  contact_email        TEXT,
  contact_phone        TEXT,
  rite                 TEXT,
  obedience            TEXT,
  degree_order         TEXT,
  source               TEXT,
  priority             TEXT,
  status               TEXT,
  request_details      TEXT,
  admin_notes          TEXT,
  conversation_context TEXT,
  created_by           UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_requests_status ON lead_requests(status);

-- =============================================================================
-- PRODUCTION ITEMS
-- =============================================================================
CREATE TABLE production_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id        TEXT,
  customer_id   UUID REFERENCES users(id),
  order_id      UUID REFERENCES orders(id),
  product_name  TEXT,
  status        TEXT,
  specifications JSONB,
  design_images TEXT[],
  due_date      DATE,
  priority      TEXT,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_production_items_status ON production_items(status);

-- =============================================================================
-- BUSINESS OPPORTUNITIES
-- =============================================================================
CREATE TABLE business_opportunities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  stage       TEXT,
  data        JSONB,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- LOYALTY POINTS
-- =============================================================================
CREATE TABLE loyalty_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  user_id     UUID REFERENCES users(id),
  points      INTEGER DEFAULT 0,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);

-- =============================================================================
-- APP SETTINGS
-- =============================================================================
CREATE TABLE app_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_id      TEXT,
  key         TEXT NOT NULL UNIQUE,
  value       JSONB,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_app_settings_key ON app_settings(key);

-- =============================================================================
-- Auto-update triggers for updated_at
-- =============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users','rites','obediences','categories','degree_orders',
      'products','orders','cart_items','quotes','product_reviews',
      'wishlist_items','saved_customizations','lead_requests',
      'production_items','business_opportunities','loyalty_points',
      'app_settings'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
