-- Publishers (each publisher owns @handle/* scope in v0.2)
CREATE TABLE IF NOT EXISTS publishers (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Tokens (Bearer token = <tokenId>.<secret>, secret is never stored)
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token_salt TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  FOREIGN KEY(publisher_id) REFERENCES publishers(id)
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  name TEXT PRIMARY KEY, -- @publisher/skill
  publisher_id TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  targets_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(publisher_id) REFERENCES publishers(id)
);

-- Skill versions (immutable)
CREATE TABLE IF NOT EXISTS skill_versions (
  skill_name TEXT NOT NULL,
  version TEXT NOT NULL,
  integrity TEXT NOT NULL, -- sha256 hex
  artifact_key TEXT NOT NULL, -- R2 key, content-addressed
  published_at TEXT NOT NULL,
  publisher_id TEXT NOT NULL,
  PRIMARY KEY(skill_name, version),
  FOREIGN KEY(skill_name) REFERENCES skills(name),
  FOREIGN KEY(publisher_id) REFERENCES publishers(id)
);

-- dist-tags (latest, canary, etc)
CREATE TABLE IF NOT EXISTS dist_tags (
  skill_name TEXT NOT NULL,
  tag TEXT NOT NULL,
  version TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(skill_name, tag),
  FOREIGN KEY(skill_name) REFERENCES skills(name)
);

CREATE INDEX IF NOT EXISTS idx_skills_updated_at ON skills(updated_at);
CREATE INDEX IF NOT EXISTS idx_skill_versions_published_at ON skill_versions(skill_name, published_at);
