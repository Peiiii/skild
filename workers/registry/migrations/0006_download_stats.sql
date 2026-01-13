-- Download stats (events + aggregates)

CREATE TABLE IF NOT EXISTS download_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  source TEXT NOT NULL,
  client_hash TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  day TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_download_events_entity_day
  ON download_events(entity_type, entity_id, day);

CREATE INDEX IF NOT EXISTS idx_download_events_client_day
  ON download_events(client_hash, day);

CREATE TABLE IF NOT EXISTS download_daily (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  day TEXT NOT NULL,
  downloads INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, day)
);

CREATE INDEX IF NOT EXISTS idx_download_daily_day
  ON download_daily(day);

CREATE TABLE IF NOT EXISTS download_total (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  downloads INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
