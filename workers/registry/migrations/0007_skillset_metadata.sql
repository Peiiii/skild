-- Skillset metadata (skillset flag + dependencies JSON)

ALTER TABLE skills ADD COLUMN skillset INTEGER NOT NULL DEFAULT 0;
ALTER TABLE skills ADD COLUMN dependencies_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE discover_items ADD COLUMN skillset INTEGER NOT NULL DEFAULT 0;

-- Backfill discover items for registry skills
UPDATE discover_items
SET skillset = (
  SELECT skillset FROM skills s WHERE s.name = discover_items.source_id
)
WHERE type = 'registry';
