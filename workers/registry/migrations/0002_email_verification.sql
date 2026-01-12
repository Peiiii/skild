-- Email verification (publish requires verified email)
ALTER TABLE publishers ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE publishers ADD COLUMN email_verified_at TEXT;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  FOREIGN KEY(publisher_id) REFERENCES publishers(id)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_publisher ON email_verification_tokens(publisher_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

