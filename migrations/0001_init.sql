CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_sort ON categories(parent_id, sort_order, name);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  iso2 TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  hero_image_key TEXT,
  seo_title TEXT,
  seo_description TEXT,
  content_html TEXT,
  faq_json TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_countries_status_slug ON countries(status, slug);

CREATE TABLE IF NOT EXISTS operators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  logo_image_key TEXT,
  support_channels_json TEXT,
  seo_title TEXT,
  seo_description TEXT,
  content_html TEXT,
  faq_json TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_operators_status_slug ON operators(status, slug);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  category_id TEXT,
  country_iso2 TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  data_gb REAL,
  days INTEGER NOT NULL,
  is_unlimited INTEGER NOT NULL DEFAULT 0,
  supports_hotspot INTEGER NOT NULL DEFAULT 1,
  network_type TEXT,
  price_amount REAL NOT NULL,
  price_currency TEXT NOT NULL,
  purchase_url TEXT NOT NULL,
  coverage_regions_json TEXT,
  activation_guide_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_country_status_price ON products(country_iso2, status, price_amount);
CREATE INDEX IF NOT EXISTS idx_products_operator ON products(operator_id, status);

CREATE TABLE IF NOT EXISTS stocks (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 1,
  stock_note TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stocks_product ON stocks(product_id);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  post_type TEXT NOT NULL,
  ref_slug TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_html TEXT NOT NULL,
  cover_image_key TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'draft',
  publish_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_type_locale_status ON posts(post_type, locale, status, publish_at);

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  actor_user_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_id, version DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  detail_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_entity_time ON audit_logs(entity_type, entity_id, created_at DESC);

