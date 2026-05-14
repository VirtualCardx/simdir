ALTER TABLE posts ADD COLUMN category_id TEXT;
CREATE INDEX IF NOT EXISTS idx_posts_category_status ON posts(category_id, status, publish_at);
