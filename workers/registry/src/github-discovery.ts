import type { Env } from "./env.js";
import { buildLinkedInstall } from "./discover-items.js";
import { fetchRepo } from "./github-metrics.js";

type GithubSearchItem = {
  path: string;
  repository: { full_name: string; default_branch?: string };
  html_url?: string;
};

type SearchResponse = { items?: GithubSearchItem[] };

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeSkillFromPath(path: string): { skillDir: string; skillName: string } | null {
  if (!path.toLowerCase().endsWith("skill.md")) return null;
  const segments = path.split("/");
  segments.pop(); // remove SKILL.md
  const dir = segments.join("/");
  if (!dir) return null;
  const skillName = segments[segments.length - 1] || dir.replace(/\//g, "-");
  return { skillDir: dir, skillName };
}

function buildSourceId(repo: string, skillDir: string, ref?: string | null): string {
  const safeRef = (ref || "").trim();
  return `github:${repo}:${skillDir}${safeRef ? `#${safeRef}` : ""}`;
}

export async function discoverGithubSkills(env: Env, input: { q?: string; pages?: number; perPage?: number; delayMs?: number }): Promise<{
  scanned: number;
  discovered: number;
  failed: Array<{ repo: string; path: string; error: string }>;
}> {
  const token = (env.GITHUB_TOKEN || "").trim();
  if (!token) throw new Error("Missing GITHUB_TOKEN");

  const q = (input.q || "filename:SKILL.md path:skills").trim();
  const pages = Math.min(Math.max(input.pages ?? 1, 1), 5);
  const perPage = Math.min(Math.max(input.perPage ?? 30, 1), 100);
  const delayMs = Math.max(input.delayMs ?? 1200, 200);
  const minStars = Math.max(Number.parseInt((env.DISCOVER_MIN_STARS || "50").trim(), 10) || 50, 0);
  const repoCache = new Map<string, number | null>(); // repo -> stars or null if fetch failed

  let scanned = 0;
  let discovered = 0;
  const failed: Array<{ repo: string; path: string; error: string }> = [];

  for (let page = 1; page <= pages; page++) {
    const url = new URL("https://api.github.com/search/code");
    url.searchParams.set("q", q);
    url.searchParams.set("sort", "updated");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "skild-registry",
        Accept: "application/vnd.github+json",
      },
    });

    if (res.status === 403) {
      const text = await res.text();
      throw new Error(`GitHub rate limited or forbidden: ${text}`);
    }
    if (!res.ok) {
      const text = await res.text();
      failed.push({ repo: "unknown", path: "unknown", error: `search failed ${res.status}: ${text}` });
      break;
    }

    const body = (await res.json()) as SearchResponse;
    const items = body.items || [];
    if (!items.length) break;
    scanned += items.length;

    for (const item of items) {
      const parsed = normalizeSkillFromPath(item.path);
      if (!parsed) continue;

      const repo = item.repository.full_name;
      const ref = item.repository.default_branch || null;
      if (!repoCache.has(repo)) {
        try {
          const repoInfo = await fetchRepo(env, repo);
          repoCache.set(repo, repoInfo ? repoInfo.stars : null);
        } catch (err) {
          repoCache.set(repo, null);
          failed.push({ repo, path: parsed.skillDir, error: err instanceof Error ? err.message : String(err) });
          continue;
        }
      }
      const stars = repoCache.get(repo);
      if (stars === null || stars === undefined || stars < minStars) continue;

      const sourceId = buildSourceId(repo, parsed.skillDir, ref);
      const install = buildLinkedInstall({ repo, path: parsed.skillDir, ref });
      const now = new Date().toISOString();
      const url = item.html_url || `https://github.com/${repo}/blob/${ref || "main"}/${item.path}`;

      try {
        await env.DB.batch([
          env.DB.prepare(
            "INSERT INTO discovered_skills (id, repo, skill_dir, skill_name, source_ref, source_url, discovered_at, last_seen, updated_at)\n" +
              "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)\n" +
              "ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, updated_at = excluded.updated_at",
          ).bind(sourceId, repo, parsed.skillDir, parsed.skillName, ref, url, now, now, now),
          env.DB.prepare(
            "INSERT INTO discover_items (type, source_id, title, description, tags_json, install, publisher_handle, skillset, source_repo, source_path, source_ref, source_url, discover_at, created_at, updated_at)\n" +
              "VALUES ('linked', ?1, ?2, '', '[]', ?3, NULL, 0, ?4, ?5, ?6, ?7, ?8, ?8, ?8)\n" +
              "ON CONFLICT(type, source_id) DO UPDATE SET title = excluded.title, description = excluded.description, install = excluded.install, source_repo = excluded.source_repo, source_path = excluded.source_path, source_ref = excluded.source_ref, source_url = excluded.source_url, discover_at = excluded.discover_at, updated_at = excluded.updated_at",
          ).bind(sourceId, parsed.skillName, install, repo, parsed.skillDir, ref, url, now),
        ]);
        discovered += 1;
      } catch (e) {
        failed.push({ repo, path: parsed.skillDir, error: e instanceof Error ? e.message : String(e) });
      }
    }

    await sleep(delayMs);
  }

  return { scanned, discovered, failed };
}
