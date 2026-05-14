ALTER TABLE countries ADD COLUMN name_zh TEXT;
ALTER TABLE countries ADD COLUMN name_en TEXT;
ALTER TABLE countries ADD COLUMN seo_title_zh TEXT;
ALTER TABLE countries ADD COLUMN seo_title_en TEXT;
ALTER TABLE countries ADD COLUMN seo_description_zh TEXT;
ALTER TABLE countries ADD COLUMN seo_description_en TEXT;
ALTER TABLE countries ADD COLUMN content_html_zh TEXT;
ALTER TABLE countries ADD COLUMN content_html_en TEXT;

ALTER TABLE operators ADD COLUMN name_zh TEXT;
ALTER TABLE operators ADD COLUMN name_en TEXT;
ALTER TABLE operators ADD COLUMN seo_title_zh TEXT;
ALTER TABLE operators ADD COLUMN seo_title_en TEXT;
ALTER TABLE operators ADD COLUMN seo_description_zh TEXT;
ALTER TABLE operators ADD COLUMN seo_description_en TEXT;
ALTER TABLE operators ADD COLUMN content_html_zh TEXT;
ALTER TABLE operators ADD COLUMN content_html_en TEXT;

ALTER TABLE products ADD COLUMN name_zh TEXT;
ALTER TABLE products ADD COLUMN name_en TEXT;
ALTER TABLE products ADD COLUMN activation_guide_html_zh TEXT;
ALTER TABLE products ADD COLUMN activation_guide_html_en TEXT;

UPDATE countries
SET
  name_zh = COALESCE(name_zh, name),
  name_en = COALESCE(name_en, name),
  seo_title_zh = COALESCE(seo_title_zh, seo_title),
  seo_title_en = COALESCE(seo_title_en, seo_title),
  seo_description_zh = COALESCE(seo_description_zh, seo_description),
  seo_description_en = COALESCE(seo_description_en, seo_description),
  content_html_zh = COALESCE(content_html_zh, content_html),
  content_html_en = COALESCE(content_html_en, content_html);

UPDATE operators
SET
  name_zh = COALESCE(name_zh, name),
  name_en = COALESCE(name_en, name),
  seo_title_zh = COALESCE(seo_title_zh, seo_title),
  seo_title_en = COALESCE(seo_title_en, seo_title),
  seo_description_zh = COALESCE(seo_description_zh, seo_description),
  seo_description_en = COALESCE(seo_description_en, seo_description),
  content_html_zh = COALESCE(content_html_zh, content_html),
  content_html_en = COALESCE(content_html_en, content_html);

UPDATE products
SET
  name_zh = COALESCE(name_zh, name),
  name_en = COALESCE(name_en, name),
  activation_guide_html_zh = COALESCE(activation_guide_html_zh, activation_guide_html),
  activation_guide_html_en = COALESCE(activation_guide_html_en, activation_guide_html);
