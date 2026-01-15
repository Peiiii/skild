-- GitHub auto-discovered skills

CREATE TABLE IF NOT EXISTS discovered_skills (
  id TEXT PRIMARY KEY, -- github:{repo}:{skill_dir}[#ref]
  repo TEXT NOT NULL,
  skill_dir TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  source_ref TEXT,
  source_url TEXT,
  discovered_at TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discovered_skills_repo
  ON discovered_skills(repo);
