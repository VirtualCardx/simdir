PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS posts__new (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  post_type TEXT NOT NULL,
  ref_slug TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
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

INSERT INTO posts__new (
  id,
  category_id,
  post_type,
  ref_slug,
  title,
  slug,
  excerpt,
  content_html,
  cover_image_key,
  locale,
  status,
  publish_at,
  published_at,
  created_at,
  updated_at
)
SELECT
  id,
  category_id,
  post_type,
  ref_slug,
  title,
  slug,
  excerpt,
  content_html,
  cover_image_key,
  locale,
  status,
  publish_at,
  published_at,
  created_at,
  updated_at
FROM posts;

DROP TABLE posts;
ALTER TABLE posts__new RENAME TO posts;

CREATE INDEX IF NOT EXISTS idx_posts_type_locale_status ON posts(post_type, locale, status, publish_at);
CREATE INDEX IF NOT EXISTS idx_posts_category_status ON posts(category_id, status, publish_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_locale_unique ON posts(slug, locale);

PRAGMA foreign_keys=on;
