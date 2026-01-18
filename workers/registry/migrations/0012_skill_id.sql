-- Add immutable skill ids for stable references
ALTER TABLE skills ADD COLUMN id TEXT;

UPDATE skills
SET id = lower(hex(randomblob(16)))
WHERE id IS NULL OR id = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_id_unique ON skills(id);
