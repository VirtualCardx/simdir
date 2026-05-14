ALTER TABLE site_settings ADD COLUMN site_title_zh TEXT;
ALTER TABLE site_settings ADD COLUMN site_title_en TEXT;
ALTER TABLE site_settings ADD COLUMN site_keywords_zh TEXT;
ALTER TABLE site_settings ADD COLUMN site_keywords_en TEXT;
ALTER TABLE site_settings ADD COLUMN tagline_zh TEXT;
ALTER TABLE site_settings ADD COLUMN tagline_en TEXT;

UPDATE site_settings
SET
  site_title_zh = COALESCE(site_title_zh, site_title),
  site_title_en = COALESCE(site_title_en, site_title),
  site_keywords_zh = COALESCE(site_keywords_zh, site_keywords),
  site_keywords_en = COALESCE(site_keywords_en, site_keywords),
  tagline_zh = COALESCE(tagline_zh, tagline),
  tagline_en = COALESCE(tagline_en, tagline)
WHERE id = 'default';
