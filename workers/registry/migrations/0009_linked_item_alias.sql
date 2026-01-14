-- Linked item alias metadata (short install name)

ALTER TABLE linked_items ADD COLUMN alias TEXT;

-- UNIQUE allows multiple NULLs in SQLite/D1; we store NULL when unset.
CREATE UNIQUE INDEX IF NOT EXISTS idx_linked_items_alias_unique ON linked_items(alias);
