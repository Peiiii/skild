-- Discover feed items (aggregated index for registry + linked items)

CREATE TABLE IF NOT EXISTS discover_items (
  type TEXT NOT NULL, -- registry | linked
  source_id TEXT NOT NULL, -- skill name or linked item id

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  install TEXT NOT NULL,
  publisher_handle TEXT,

  source_repo TEXT,
  source_path TEXT,
  source_ref TEXT,
  source_url TEXT,

  discover_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  PRIMARY KEY (type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_discover_items_discover_at
  ON discover_items(discover_at);

CREATE INDEX IF NOT EXISTS idx_discover_items_title
  ON discover_items(title);

CREATE INDEX IF NOT EXISTS idx_discover_items_desc
  ON discover_items(description);

CREATE INDEX IF NOT EXISTS idx_discover_items_repo
  ON discover_items(source_repo);

-- Backfill from existing registry skills
INSERT OR REPLACE INTO discover_items (
  type,
  source_id,
  title,
  description,
  tags_json,
  install,
  publisher_handle,
  source_repo,
  source_path,
  source_ref,
  source_url,
  discover_at,
  created_at,
  updated_at
)
SELECT
  'registry' AS type,
  s.name AS source_id,
  s.name AS title,
  COALESCE(s.description, '') AS description,
  '[]' AS tags_json,
  'skild install ' || s.name AS install,
  p.handle AS publisher_handle,
  NULL AS source_repo,
  NULL AS source_path,
  NULL AS source_ref,
  NULL AS source_url,
  s.updated_at AS discover_at,
  s.created_at AS created_at,
  s.updated_at AS updated_at
FROM skills s
LEFT JOIN publishers p ON p.id = s.publisher_id;

-- Backfill from existing linked items
INSERT OR REPLACE INTO discover_items (
  type,
  source_id,
  title,
  description,
  tags_json,
  install,
  publisher_handle,
  source_repo,
  source_path,
  source_ref,
  source_url,
  discover_at,
  created_at,
  updated_at
)
SELECT
  'linked' AS type,
  li.id AS source_id,
  li.title AS title,
  li.description AS description,
  li.tags_json AS tags_json,
  'skild install ' || li.source_repo ||
    CASE WHEN li.source_path IS NOT NULL THEN '/' || li.source_path ELSE '' END ||
    CASE WHEN li.source_ref IS NOT NULL THEN '#' || li.source_ref ELSE '' END AS install,
  p.handle AS publisher_handle,
  li.source_repo AS source_repo,
  li.source_path AS source_path,
  li.source_ref AS source_ref,
  li.source_url AS source_url,
  li.updated_at AS discover_at,
  li.created_at AS created_at,
  li.updated_at AS updated_at
FROM linked_items li
LEFT JOIN publishers p ON p.id = li.submitted_by_publisher_id;
