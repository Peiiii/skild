-- Linked catalog items (index-only: external GitHub sources, no mirror)

CREATE TABLE IF NOT EXISTS linked_items (
  id TEXT PRIMARY KEY,

  source_provider TEXT NOT NULL, -- e.g. github
  source_repo TEXT NOT NULL, -- owner/repo
  source_path TEXT, -- optional repo path
  source_ref TEXT, -- optional tag/branch/sha
  source_url TEXT, -- optional full url

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  license TEXT,
  category TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',

  submitted_by_publisher_id TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY(submitted_by_publisher_id) REFERENCES publishers(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_linked_items_source_unique
  ON linked_items(source_provider, source_repo, COALESCE(source_path, ''));

CREATE INDEX IF NOT EXISTS idx_linked_items_created_at
  ON linked_items(created_at);

CREATE INDEX IF NOT EXISTS idx_linked_items_repo
  ON linked_items(source_repo);

