-- Catalog skills index (auto-discovered from GitHub repo scans)

CREATE TABLE IF NOT EXISTS catalog_repos (
  repo TEXT PRIMARY KEY,
  source_type TEXT NOT NULL DEFAULT 'github',
  source_url TEXT,
  default_branch TEXT,
  description TEXT,
  homepage TEXT,
  topics_json TEXT,
  license_spdx TEXT,
  stars_total INTEGER,
  forks_total INTEGER,
  updated_at TEXT,
  pushed_at TEXT,
  created_at TEXT,
  last_seen TEXT,
  last_scanned_at TEXT,
  scan_status TEXT,
  scan_error TEXT,
  is_skill_repo INTEGER DEFAULT 0,
  has_risk INTEGER DEFAULT 0,
  risk_evidence TEXT
);

CREATE TABLE IF NOT EXISTS catalog_skills (
  id TEXT PRIMARY KEY,
  repo TEXT NOT NULL,
  path TEXT NOT NULL,
  name TEXT,
  description TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  source_ref TEXT,
  source_url TEXT,
  snapshot_key TEXT,
  has_skill_md INTEGER NOT NULL DEFAULT 1,
  has_readme INTEGER NOT NULL DEFAULT 0,
  has_code INTEGER NOT NULL DEFAULT 0,
  usage_artifact INTEGER NOT NULL DEFAULT 0,
  installable INTEGER NOT NULL DEFAULT 1,
  has_risk INTEGER NOT NULL DEFAULT 0,
  risk_evidence TEXT,
  discovered_at TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tag_source TEXT,
  ai_tagged_at TEXT,
  ai_model TEXT,
  prompt_digest TEXT,
  auto_tags_json TEXT,
  final_tags_json TEXT,
  overrides_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_catalog_skills_repo
  ON catalog_skills(repo);

CREATE INDEX IF NOT EXISTS idx_catalog_skills_last_seen
  ON catalog_skills(last_seen);

CREATE INDEX IF NOT EXISTS idx_catalog_skills_installable
  ON catalog_skills(installable);

CREATE INDEX IF NOT EXISTS idx_catalog_skills_has_risk
  ON catalog_skills(has_risk);

CREATE INDEX IF NOT EXISTS idx_catalog_skills_usage_artifact
  ON catalog_skills(usage_artifact);

CREATE TABLE IF NOT EXISTS catalog_skill_sources (
  skill_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (skill_id, source_type, source_url)
);

CREATE TABLE IF NOT EXISTS catalog_repo_scan_state (
  id TEXT PRIMARY KEY,
  cursor_key TEXT,
  cursor_offset INTEGER DEFAULT 0,
  index_date TEXT,
  last_run_at TEXT,
  last_success_at TEXT,
  status TEXT,
  error TEXT
);
