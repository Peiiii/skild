-- Precomputed download windows for the public discover feed.
-- Rebuilt once per UTC day and incremented by new download events in real time.

CREATE TABLE IF NOT EXISTS discover_download_rollups (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  downloads_7d INTEGER NOT NULL DEFAULT 0,
  downloads_30d INTEGER NOT NULL DEFAULT 0,
  refreshed_day TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS registry_maintenance_state (
  task TEXT PRIMARY KEY,
  completed_day TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO discover_download_rollups (
  entity_type,
  entity_id,
  downloads_7d,
  downloads_30d,
  refreshed_day,
  updated_at
)
SELECT
  entity_type,
  entity_id,
  SUM(CASE WHEN day >= date('now', '-6 days') THEN downloads ELSE 0 END),
  SUM(downloads),
  date('now'),
  datetime('now')
FROM download_daily
WHERE day >= date('now', '-29 days')
GROUP BY entity_type, entity_id;

INSERT INTO registry_maintenance_state (task, completed_day, updated_at)
VALUES ('discover_download_rollups', date('now'), datetime('now'))
ON CONFLICT(task) DO UPDATE SET
  completed_day = excluded.completed_day,
  updated_at = excluded.updated_at;
