-- Console sessions + token management (publish tokens are revocable, console uses HttpOnly cookie session)

ALTER TABLE tokens ADD COLUMN revoked_at TEXT;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL,
  session_salt TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY(publisher_id) REFERENCES publishers(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_publisher ON sessions(publisher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

