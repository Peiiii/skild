-- Skill alias metadata (short install name)

ALTER TABLE skills ADD COLUMN alias TEXT;

-- UNIQUE allows multiple NULLs in SQLite/D1; we store NULL when unset.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_alias_unique ON skills(alias);
