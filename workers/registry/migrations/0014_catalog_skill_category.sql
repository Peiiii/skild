-- Catalog skill category support

ALTER TABLE catalog_skills ADD COLUMN category TEXT;

CREATE INDEX IF NOT EXISTS idx_catalog_skills_category
  ON catalog_skills(category);
