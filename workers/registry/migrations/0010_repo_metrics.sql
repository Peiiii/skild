-- GitHub Repo Metrics (stars + daily snapshots)

CREATE TABLE IF NOT EXISTS repo_metrics (
  repo TEXT PRIMARY KEY, -- owner/repo
  stars_total INTEGER NOT NULL DEFAULT 0,
  stars_delta_30d INTEGER NOT NULL DEFAULT 0,
  stars_updated_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS repo_stars_daily (
  repo TEXT NOT NULL,
  day TEXT NOT NULL,
  stars INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (repo, day)
);

CREATE INDEX IF NOT EXISTS idx_repo_stars_daily_repo_day
  ON repo_stars_daily(repo, day);
