CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_title TEXT,
  site_keywords TEXT,
  tagline TEXT,
  logo_image_key TEXT,
  favicon_image_key TEXT,
  updated_at TEXT NOT NULL
);
