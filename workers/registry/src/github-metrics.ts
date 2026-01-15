import type { Env } from "./env.js";

export type GithubRepoMetrics = {
  repo: string;
  stars: number;
  updatedAt: string;
};

export async function fetchRepo(env: Env, repo: string): Promise<GithubRepoMetrics | null> {
  const token = (env.GITHUB_TOKEN || "").trim();
  const headers: Record<string, string> = { "User-Agent": "skild-registry" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { stargazers_count?: number; updated_at?: string };
  const stars = Number(json.stargazers_count ?? 0);
  const updatedAt = json.updated_at || new Date().toISOString();
  return { repo, stars, updatedAt };
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
