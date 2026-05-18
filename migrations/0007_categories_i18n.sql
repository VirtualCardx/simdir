ALTER TABLE categories ADD COLUMN name_zh TEXT;
ALTER TABLE categories ADD COLUMN name_en TEXT;

UPDATE categories
SET
  name_zh = COALESCE(name_zh, name),
  name_en = COALESCE(name_en, name);
