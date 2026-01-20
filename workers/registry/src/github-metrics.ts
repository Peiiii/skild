import type { Env } from "./env.js";

export type GithubRepoMetrics = {
  repo: string;
  stars: number;
  updatedAt: string;
};

export type GithubRepoInfo = {
  repo: string;
  stars: number;
  forks: number;
  updatedAt: string;
  pushedAt: string | null;
  createdAt: string | null;
  defaultBranch: string;
  description: string;
  homepage: string | null;
  licenseSpdx: string | null;
  topics: string[];
  htmlUrl: string;
};

export async function fetchRepoInfo(env: Env, repo: string): Promise<GithubRepoInfo | null> {
  const token = (env.GITHUB_TOKEN || "").trim();
  const headers: Record<string, string> = {
    "User-Agent": "skild-registry",
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    stargazers_count?: number;
    forks_count?: number;
    updated_at?: string;
    pushed_at?: string;
    created_at?: string;
    default_branch?: string;
    description?: string;
    homepage?: string | null;
    html_url?: string;
    license?: { spdx_id?: string | null } | null;
    topics?: string[];
  };
  const stars = Number(json.stargazers_count ?? 0);
  const forks = Number(json.forks_count ?? 0);
  const updatedAt = json.updated_at || new Date().toISOString();
  const pushedAt = json.pushed_at || null;
  const createdAt = json.created_at || null;
  const defaultBranch = json.default_branch || "main";
  const description = json.description || "";
  const homepage = json.homepage ?? null;
  const htmlUrl = json.html_url || `https://github.com/${repo}`;
  const licenseSpdx = json.license?.spdx_id ?? null;
  const topics = Array.isArray(json.topics) ? json.topics.filter(t => typeof t === "string") : [];
  return {
    repo,
    stars,
    forks,
    updatedAt,
    pushedAt,
    createdAt,
    defaultBranch,
    description,
    homepage,
    licenseSpdx,
    topics,
    htmlUrl,
  };
}

export async function fetchRepo(env: Env, repo: string): Promise<GithubRepoMetrics | null> {
  const info = await fetchRepoInfo(env, repo);
  if (!info) return null;
  return { repo: info.repo, stars: info.stars, updatedAt: info.updatedAt };
}

export async function refreshRepoMetrics(
  env: Env,
  repos: string[],
): Promise<{ updated: number; skipped: number; failed: Array<{ repo: string; error: string }> }> {
  let updated = 0;
  let skipped = 0;
  const failed: Array<{ repo: string; error: string }> = [];

  for (const repo of repos) {
    try {
      const data = await fetchRepo(env, repo);
      if (!data) {
        skipped += 1;
        continue;
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const day = nowIso.slice(0, 10);
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
      const startDay = start.toISOString().slice(0, 10);

      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO repo_metrics (repo, stars_total, stars_delta_30d, stars_updated_at, updated_at) VALUES (?1, ?2, 0, ?3, ?4)\n" +
            "ON CONFLICT(repo) DO UPDATE SET stars_total = excluded.stars_total, stars_updated_at = excluded.stars_updated_at, updated_at = excluded.updated_at",
        ).bind(data.repo, data.stars, data.updatedAt, nowIso),
        env.DB.prepare(
          "INSERT INTO repo_stars_daily (repo, day, stars, updated_at) VALUES (?1, ?2, ?3, ?4)\n" +
            "ON CONFLICT(repo, day) DO UPDATE SET stars = excluded.stars, updated_at = excluded.updated_at",
        ).bind(data.repo, day, data.stars, nowIso),
      ]);

      // recompute delta 30d: current - value at (day-30) if exists
      const deltaRow = await env.DB.prepare(
        "SELECT stars FROM repo_stars_daily WHERE repo = ?1 AND day <= ?2 ORDER BY day DESC LIMIT 1",
      )
        .bind(data.repo, startDay)
        .first<{ stars: number }>();
      const baseline = deltaRow?.stars ?? data.stars;
      await env.DB.prepare("UPDATE repo_metrics SET stars_delta_30d = stars_total - ?2 WHERE repo = ?1")
        .bind(data.repo, baseline)
        .run();

      updated += 1;
    } catch (e) {
      failed.push({ repo, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { updated, skipped, failed };
}
