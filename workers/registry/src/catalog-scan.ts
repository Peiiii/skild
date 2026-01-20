import type { Env } from "./env.js";
import { detectCatalogRisk } from "./catalog-risk.js";
import { parseSkillFrontmatter } from "./skill-frontmatter.js";
import { buildGithubUrl, normalizeRepo } from "./github-utils.js";
import { fetchRepoInfo } from "./github-metrics.js";
import { getCatalogRepo, upsertCatalogRepo, upsertCatalogSkill, upsertCatalogSkillSource } from "./catalog-db.js";
import { writeCatalogSnapshot } from "./catalog-storage.js";

export type RepoIndexEntry = {
  repo: string;
  default_branch?: string | null;
  stars_total?: number | null;
  forks_total?: number | null;
  updated_at?: string | null;
  pushed_at?: string | null;
  created_at?: string | null;
  license_spdx?: string | null;
  topics?: string[] | null;
  description?: string | null;
  homepage?: string | null;
  html_url?: string | null;
  source_type?: string | null;
  source_url?: string | null;
};

type GithubTreeItem = {
  path: string;
  type: "blob" | "tree";
};

type GithubTreeResponse = {
  tree?: GithubTreeItem[];
  truncated?: boolean;
  sha?: string;
};

type GithubContentResponse = {
  type?: string;
  encoding?: string;
  content?: string;
  download_url?: string | null;
};

type RepoScanResult = {
  repo: string;
  skills: number;
  errors: Array<{ repo: string; error: string }>;
};

function parseEnvInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt((value || "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseIsoMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function parseJsonArray(input: string | null | undefined): string[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(v => typeof v === "string");
  } catch {
    return [];
  }
}

function decodeBase64(content: string): string {
  const cleaned = content.replace(/\n/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function normalizeTags(tags: string[] | undefined | null): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const value = tag.trim().toLowerCase();
    if (!value) continue;
    if (value.length > 32) continue;
    if (!/^[a-z0-9][a-z0-9-_]*$/.test(value)) continue;
    if (!out.includes(value)) out.push(value);
    if (out.length >= 20) break;
  }
  return out;
}

function isUsageArtifact(path: string): boolean {
  const normalized = path.replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);
  const head = segments.slice(0, 2).join("/");
  if (head === ".agent/skills" || head === ".opencode/skills" || head === ".cursor/skills" || head === ".vscode/skills") {
    return true;
  }
  if (segments.includes("node_modules")) return true;
  if (segments.includes(".skild") || segments.includes(".cache")) return true;
  return false;
}

function isSkillFilePath(path: string): boolean {
  const fileName = path.split("/").pop() || "";
  return fileName === "SKILL.md";
}

function isReadmeFile(name: string): boolean {
  const lowered = name.toLowerCase();
  return lowered === "readme.md" || lowered === "readme.mdx" || lowered === "readme.txt";
}

function isCodeFile(name: string): boolean {
  const lowered = name.toLowerCase();
  if (lowered === "dockerfile" || lowered === "makefile") return true;
  const extIndex = lowered.lastIndexOf(".");
  if (extIndex === -1) return false;
  const ext = lowered.slice(extIndex);
  const codeExts = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".go",
    ".rs",
    ".rb",
    ".php",
    ".java",
    ".kt",
    ".swift",
    ".cpp",
    ".cc",
    ".c",
    ".cs",
    ".sh",
    ".bash",
    ".zsh",
    ".ps1",
    ".sql",
    ".toml",
    ".yaml",
    ".yml",
  ]);
  return codeExts.has(ext);
}

function getParentDir(path: string): string {
  const idx = path.lastIndexOf("/");
  if (idx === -1) return "";
  return path.slice(0, idx);
}

function collectSkillDirAncestors(path: string, skillDirs: Set<string>): string[] {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return skillDirs.has("") ? [""] : [];
  const matches: string[] = [];
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (skillDirs.has(current)) matches.push(current);
  }
  return matches;
}

function buildSkillId(repo: string, path: string, ref: string | null): string {
  const safeRef = (ref || "").trim();
  return `github:${repo}:${path}${safeRef ? `#${safeRef}` : ""}`;
}

async function githubFetchJson(env: Env, url: string): Promise<Response> {
  const token = (env.GITHUB_TOKEN || "").trim();
  const headers: Record<string, string> = {
    "User-Agent": "skild-registry",
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { headers });
}

async function fetchRepoTree(
  env: Env,
  repo: string,
  ref: string,
): Promise<{ items: GithubTreeItem[]; truncated: boolean; sha: string | null } | null> {
  const url = `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
  const res = await githubFetchJson(env, url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub tree fetch failed ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as GithubTreeResponse;
  const items = Array.isArray(json.tree) ? json.tree.filter(item => item.type === "blob" || item.type === "tree") : [];
  return { items, truncated: Boolean(json.truncated), sha: json.sha ?? null };
}

async function searchRepoSkillPaths(env: Env, repo: string): Promise<string[]> {
  const url = new URL("https://api.github.com/search/code");
  url.searchParams.set("q", `repo:${repo} filename:SKILL.md`);
  url.searchParams.set("per_page", "100");
  const res = await githubFetchJson(env, url.toString());
  if (!res.ok) {
    throw new Error(`GitHub search failed ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { items?: Array<{ path?: string }> };
  const items = json.items ?? [];
  const paths = items
    .map(item => item.path || "")
    .filter(Boolean)
    .filter(path => isSkillFilePath(path))
    .map(path => getParentDir(path));
  return Array.from(new Set(paths));
}

async function fetchRepoFileContent(env: Env, repo: string, path: string, ref: string): Promise<string | null> {
  const encodedPath = path.split("/").map(segment => encodeURIComponent(segment)).join("/");
  const url = new URL(`https://api.github.com/repos/${repo}/contents/${encodedPath}`);
  url.searchParams.set("ref", ref);
  const res = await githubFetchJson(env, url.toString());
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub content fetch failed ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as GithubContentResponse;
  if (json.encoding === "base64" && json.content) {
    return decodeBase64(json.content);
  }
  if (json.download_url) {
    const raw = await fetch(json.download_url);
    if (!raw.ok) return null;
    return raw.text();
  }
  return null;
}

function extractSkillDirs(treeItems: GithubTreeItem[]): {
  skillDirs: string[];
  readmeByDir: Map<string, string>;
  hasCodeByDir: Map<string, boolean>;
} {
  const skillDirs = new Set<string>();
  for (const item of treeItems) {
    if (!item.path) continue;
    if (isSkillFilePath(item.path)) {
      const dir = getParentDir(item.path);
      skillDirs.add(dir);
    }
  }

  const readmeByDir = new Map<string, string>();
  const hasCodeByDir = new Map<string, boolean>();

  if (skillDirs.size === 0) return { skillDirs: [], readmeByDir, hasCodeByDir };

  for (const item of treeItems) {
    if (!item.path || item.type !== "blob") continue;
    const parentDir = getParentDir(item.path);
    const fileName = item.path.split("/").pop() || "";
    if (skillDirs.has(parentDir) && isReadmeFile(fileName) && !readmeByDir.has(parentDir)) {
      readmeByDir.set(parentDir, item.path);
    }

    if (isCodeFile(fileName)) {
      const matchedDirs = collectSkillDirAncestors(parentDir, skillDirs);
      for (const dir of matchedDirs) {
        hasCodeByDir.set(dir, true);
      }
    }
  }

  return {
    skillDirs: Array.from(skillDirs).sort(),
    readmeByDir,
    hasCodeByDir,
  };
}

async function loadRepoSkillCursor(env: Env, repo: string, treeSha: string | null, total: number): Promise<number> {
  const id = `repo:${repo}`;
  const row = await env.DB.prepare("SELECT cursor_key, cursor_offset FROM catalog_repo_scan_state WHERE id = ?1 LIMIT 1")
    .bind(id)
    .first<{ cursor_key: string | null; cursor_offset: number | null }>();
  if (!row) return 0;
  if (treeSha && row.cursor_key && row.cursor_key !== treeSha) return 0;
  const offset = Math.max(row.cursor_offset ?? 0, 0);
  if (offset >= total) return 0;
  return offset;
}

async function saveRepoSkillCursor(
  env: Env,
  repo: string,
  treeSha: string | null,
  offset: number,
  status: string,
  error?: string | null,
): Promise<void> {
  const id = `repo:${repo}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO catalog_repo_scan_state (id, cursor_key, cursor_offset, index_date, last_run_at, last_success_at, status, error)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)\n" +
      "ON CONFLICT(id) DO UPDATE SET cursor_key = excluded.cursor_key, cursor_offset = excluded.cursor_offset, index_date = excluded.index_date, last_run_at = excluded.last_run_at, last_success_at = excluded.last_success_at, status = excluded.status, error = excluded.error",
  )
    .bind(id, treeSha, offset, null, now, status === "ok" ? now : null, status, error ?? null)
    .run();
}

async function loadRepoScanState(env: Env, repo: string): Promise<{ hasState: boolean; cursorOffset: number; status: string | null }> {
  const id = `repo:${repo}`;
  const row = await env.DB.prepare("SELECT cursor_offset, status FROM catalog_repo_scan_state WHERE id = ?1 LIMIT 1")
    .bind(id)
    .first<{ cursor_offset: number | null; status: string | null }>();
  return {
    hasState: Boolean(row),
    cursorOffset: Math.max(row?.cursor_offset ?? 0, 0),
    status: row?.status ?? null,
  };
}

async function scanRepo(env: Env, entry: RepoIndexEntry): Promise<RepoScanResult> {
  const repo = normalizeRepo(entry.repo);
  const now = new Date().toISOString();
  const errors: Array<{ repo: string; error: string }> = [];

  const existing = await getCatalogRepo(env, repo);
  const repoScanState = await loadRepoScanState(env, repo);
  const skipUnchanged = (env.CATALOG_SKIP_UNCHANGED || "").trim().toLowerCase() !== "false";
  const rescanTtlHours = parseEnvInt(env.CATALOG_RESCAN_TTL_HOURS, 168, 0, 8760);
  const entryUpdatedMs = parseIsoMs(entry.pushed_at ?? entry.updated_at);
  const existingUpdatedMs = parseIsoMs(existing?.pushed_at ?? existing?.updated_at);
  const lastScannedMs = parseIsoMs(existing?.last_scanned_at);
  const ttlMs = rescanTtlHours > 0 ? rescanTtlHours * 3600 * 1000 : 0;
  const canSkip =
    skipUnchanged &&
    rescanTtlHours > 0 &&
    existing &&
    repoScanState.hasState &&
    repoScanState.cursorOffset === 0 &&
    repoScanState.status !== "partial" &&
    repoScanState.status !== "error" &&
    entryUpdatedMs !== null &&
    existingUpdatedMs !== null &&
    lastScannedMs !== null &&
    Date.now() - lastScannedMs < ttlMs &&
    entryUpdatedMs <= existingUpdatedMs;

  if (canSkip && existing) {
    const topics = entry.topics && entry.topics.length > 0 ? entry.topics : parseJsonArray(existing.topics_json);
    await upsertCatalogRepo(env, {
      repo,
      sourceType: entry.source_type || existing.source_type || "github",
      sourceUrl: entry.source_url || existing.source_url || `https://github.com/${repo}`,
      defaultBranch: entry.default_branch || existing.default_branch,
      description: entry.description ?? existing.description,
      homepage: entry.homepage ?? existing.homepage,
      topics,
      licenseSpdx: entry.license_spdx ?? existing.license_spdx,
      starsTotal: entry.stars_total ?? existing.stars_total,
      forksTotal: entry.forks_total ?? existing.forks_total,
      updatedAt: entry.updated_at ?? existing.updated_at,
      pushedAt: entry.pushed_at ?? existing.pushed_at,
      createdAt: entry.created_at ?? existing.created_at,
      lastSeen: now,
      lastScannedAt: existing.last_scanned_at,
      scanStatus: "skipped",
      scanError: null,
      isSkillRepo: existing.is_skill_repo === 1,
      hasRisk: existing.has_risk === 1,
      riskEvidence: existing.risk_evidence,
    });
    return { repo, skills: 0, errors };
  }

  let repoInfo = null;
  const shouldEnrich = (env.CATALOG_ENRICH_META || "").trim().toLowerCase() === "true";
  if (shouldEnrich || !entry.default_branch) {
    try {
      repoInfo = await fetchRepoInfo(env, repo);
    } catch (err) {
      errors.push({ repo, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const defaultBranch = entry.default_branch || repoInfo?.defaultBranch || "main";
  const sourceUrl = entry.source_url || repoInfo?.htmlUrl || `https://github.com/${repo}`;
  const topics = Array.isArray(entry.topics) && entry.topics.length > 0 ? entry.topics : repoInfo?.topics ?? [];
  const description = entry.description ?? repoInfo?.description ?? "";
  const licenseSpdx = entry.license_spdx ?? repoInfo?.licenseSpdx ?? null;
  const starsTotal = entry.stars_total ?? repoInfo?.stars ?? null;
  const forksTotal = entry.forks_total ?? repoInfo?.forks ?? null;
  const updatedAt = entry.updated_at ?? repoInfo?.updatedAt ?? null;
  const pushedAt = entry.pushed_at ?? repoInfo?.pushedAt ?? null;
  const createdAt = entry.created_at ?? repoInfo?.createdAt ?? null;
  const homepage = entry.homepage ?? repoInfo?.homepage ?? null;

  let treeResult = null;
  try {
    treeResult = await fetchRepoTree(env, repo, defaultBranch);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await upsertCatalogRepo(env, {
      repo,
      sourceType: entry.source_type || "github",
      sourceUrl,
      defaultBranch,
      description,
      homepage,
      topics: topics ?? [],
      licenseSpdx,
      starsTotal,
      forksTotal,
      updatedAt,
      pushedAt,
      createdAt,
      lastSeen: now,
      lastScannedAt: now,
      scanStatus: "error",
      scanError: message,
      isSkillRepo: false,
      hasRisk: false,
      riskEvidence: null,
    });
    errors.push({ repo, error: message });
    return { repo, skills: 0, errors };
  }

  if (!treeResult) {
    await upsertCatalogRepo(env, {
      repo,
      sourceType: entry.source_type || "github",
      sourceUrl,
      defaultBranch,
      description,
      homepage,
      topics: topics ?? [],
      licenseSpdx,
      starsTotal,
      forksTotal,
      updatedAt,
      pushedAt,
      createdAt,
      lastSeen: now,
      lastScannedAt: now,
      scanStatus: "not_found",
      scanError: null,
      isSkillRepo: false,
      hasRisk: false,
      riskEvidence: null,
    });
    return { repo, skills: 0, errors };
  }

  let skillDirs = extractSkillDirs(treeResult.items);
  if (treeResult.truncated) {
    try {
      const fallbackDirs = await searchRepoSkillPaths(env, repo);
      if (fallbackDirs.length > 0) {
        skillDirs = {
          skillDirs: Array.from(new Set([...skillDirs.skillDirs, ...fallbackDirs])).sort(),
          readmeByDir: skillDirs.readmeByDir,
          hasCodeByDir: skillDirs.hasCodeByDir,
        };
      }
    } catch (err) {
      errors.push({ repo, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const maxSkills = parseEnvInt(env.CATALOG_MAX_SKILLS_PER_REPO, 200, 1, 1000);
  const cursorOffset = await loadRepoSkillCursor(env, repo, treeResult.sha, skillDirs.skillDirs.length);
  const limitedDirs = skillDirs.skillDirs.slice(cursorOffset, cursorOffset + maxSkills);
  let discovered = 0;
  let hasRisk = false;
  const riskEvidence = new Set<string>();

  const fetchReadme = (env.CATALOG_FETCH_README || "").trim().toLowerCase() === "true";

  for (const dir of limitedDirs) {
    const path = dir;
    const usageArtifact = isUsageArtifact(path);
    const installable = !usageArtifact;
    const readmePath = skillDirs.readmeByDir.get(dir) ?? null;
    const hasCode = skillDirs.hasCodeByDir.get(dir) ?? false;

    const skillMdPath = dir ? `${dir}/SKILL.md` : "SKILL.md";
    let skillMd: string | null = null;
    let readmeMd: string | null = null;

    try {
      skillMd = await fetchRepoFileContent(env, repo, skillMdPath, defaultBranch);
    } catch (err) {
      errors.push({ repo, error: err instanceof Error ? err.message : String(err) });
    }

    if (readmePath && fetchReadme) {
      try {
        readmeMd = await fetchRepoFileContent(env, repo, readmePath, defaultBranch);
      } catch (err) {
        errors.push({ repo, error: err instanceof Error ? err.message : String(err) });
      }
    }

    const frontmatter = skillMd ? parseSkillFrontmatter(skillMd) : null;
    if (!skillMd || !frontmatter?.name || !frontmatter?.description) {
      continue;
    }
    const name = frontmatter.name;
    const descriptionLine = frontmatter.description;
    const tags = normalizeTags(frontmatter.tags ?? []);
    const category = null;

    const risk = detectCatalogRisk([skillMd, readmeMd]);
    if (risk.hasRisk) {
      hasRisk = true;
      for (const ev of risk.evidence) riskEvidence.add(ev);
    }

    const sourceUrl = buildGithubUrl({ repo, path: path || null, ref: defaultBranch });
    const snapshotKey = await writeCatalogSnapshot(env, {
      repo,
      path: path || null,
      ref: defaultBranch,
      skillMd,
      readmeMd,
      meta: {
        schemaVersion: 1,
        repo: {
          repo,
          sourceUrl,
          starsTotal,
          forksTotal,
          updatedAt,
          pushedAt,
          createdAt,
          defaultBranch,
          description,
          homepage,
          licenseSpdx,
          topics,
        },
        skill: {
          path,
          name,
          description: descriptionLine,
          tags,
          skillset: frontmatter?.skillset ?? null,
          category,
        },
        scan: {
          discoveredAt: now,
          lastSeen: now,
          usageArtifact,
          installable,
          hasReadme: fetchReadme ? Boolean(readmeMd) : Boolean(readmePath),
          hasCode,
          hasRisk: risk.hasRisk,
          riskEvidence: risk.evidence,
        },
      },
    });

    const skillId = buildSkillId(repo, path, defaultBranch);
    await upsertCatalogSkill(env, {
      id: skillId,
      repo,
      path,
      name,
      description: descriptionLine,
      tags,
      category,
      sourceRef: defaultBranch,
      sourceUrl,
      snapshotKey,
      hasReadme: fetchReadme ? Boolean(readmeMd) : Boolean(readmePath),
      hasCode,
      usageArtifact,
      installable,
      hasRisk: risk.hasRisk,
      riskEvidence: risk.evidence,
      discoveredAt: now,
      lastSeen: now,
    });

    await upsertCatalogSkillSource(env, {
      skillId,
      sourceType: entry.source_type || "github",
      sourceUrl: entry.source_url || sourceUrl,
    });

    discovered += 1;
  }

  await upsertCatalogRepo(env, {
    repo,
    sourceType: entry.source_type || "github",
    sourceUrl,
    defaultBranch,
    description,
    homepage,
    topics: topics ?? [],
    licenseSpdx,
    starsTotal,
    forksTotal,
    updatedAt,
    pushedAt,
    createdAt,
    lastSeen: now,
    lastScannedAt: now,
    scanStatus: "ok",
    scanError: errors.length ? errors.map(e => e.error).join("; ") : null,
    isSkillRepo: discovered > 0,
    hasRisk,
    riskEvidence: Array.from(riskEvidence).join("\n"),
  });

  const nextOffset = cursorOffset + limitedDirs.length;
  if (skillDirs.skillDirs.length === 0) {
    await saveRepoSkillCursor(env, repo, treeResult.sha, 0, "empty");
  } else if (nextOffset >= skillDirs.skillDirs.length) {
    await saveRepoSkillCursor(env, repo, treeResult.sha, 0, "ok", errors.length ? errors.map(e => e.error).join("; ") : null);
  } else {
    await saveRepoSkillCursor(env, repo, treeResult.sha, nextOffset, "partial", errors.length ? errors.map(e => e.error).join("; ") : null);
  }

  return { repo, skills: discovered, errors };
}

async function listRepoIndexKeys(env: Env, prefix: string): Promise<string[]> {
  const bucket = env.CATALOG_BUCKET ?? env.BUCKET;
  const keys: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const listing = await bucket.list({ prefix, cursor });
    for (const obj of listing.objects) {
      if (obj.key.endsWith(".json") && obj.key.includes("/part-")) keys.push(obj.key);
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  return keys;
}

function extractIndexDate(prefix: string, key: string): string | null {
  const trimmed = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const date = parts[0] || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return date;
}

async function loadRepoIndexPart(env: Env, key: string): Promise<RepoIndexEntry[]> {
  const bucket = env.CATALOG_BUCKET ?? env.BUCKET;
  const obj = await bucket.get(key);
  if (!obj) throw new Error(`Repo index missing: ${key}`);
  const json = (await obj.json()) as RepoIndexEntry[] | { repos?: RepoIndexEntry[] };
  if (Array.isArray(json)) return json;
  if (Array.isArray((json as any).repos)) return (json as any).repos;
  return [];
}

async function loadScanState(env: Env, id: string): Promise<{
  cursor_key: string | null;
  cursor_offset: number;
  index_date: string | null;
}> {
  const row = await env.DB.prepare("SELECT cursor_key, cursor_offset, index_date FROM catalog_repo_scan_state WHERE id = ?1 LIMIT 1")
    .bind(id)
    .first<{ cursor_key: string | null; cursor_offset: number; index_date: string | null }>();
  return {
    cursor_key: row?.cursor_key ?? null,
    cursor_offset: row?.cursor_offset ?? 0,
    index_date: row?.index_date ?? null,
  };
}

async function saveScanState(
  env: Env,
  id: string,
  input: { cursorKey: string | null; cursorOffset: number; indexDate: string | null; status: string; error?: string | null; success?: boolean },
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO catalog_repo_scan_state (id, cursor_key, cursor_offset, index_date, last_run_at, last_success_at, status, error)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)\n" +
      "ON CONFLICT(id) DO UPDATE SET cursor_key = excluded.cursor_key, cursor_offset = excluded.cursor_offset, index_date = excluded.index_date, last_run_at = excluded.last_run_at, last_success_at = excluded.last_success_at, status = excluded.status, error = excluded.error",
  )
    .bind(
      id,
      input.cursorKey,
      input.cursorOffset,
      input.indexDate,
      now,
      input.success ? now : null,
      input.status,
      input.error ?? null,
    )
    .run();
}

export async function scanCatalogIndexBatch(
  env: Env,
  input: { batchSize?: number } = {},
): Promise<{ repos: number; skills: number; errors: Array<{ repo: string; error: string }> }> {
  const prefix = (env.CATALOG_REPO_INDEX_PREFIX || "repo-index").replace(/\/+$/, "") + "/";
  const keys = await listRepoIndexKeys(env, prefix);
  if (keys.length === 0) {
    await saveScanState(env, "github-index", {
      cursorKey: null,
      cursorOffset: 0,
      indexDate: null,
      status: "empty",
      success: false,
      error: "No repo index found in R2.",
    });
    return { repos: 0, skills: 0, errors: [{ repo: "index", error: "No repo index found in R2." }] };
  }

  const dateSet = new Set<string>();
  for (const key of keys) {
    const date = extractIndexDate(prefix, key);
    if (date) dateSet.add(date);
  }
  const dates = Array.from(dateSet).sort();
  const latestDate = dates[dates.length - 1] ?? null;
  if (!latestDate) {
    return { repos: 0, skills: 0, errors: [{ repo: "index", error: "Repo index date missing." }] };
  }

  const partKeys = keys
    .filter(key => key.includes(`${prefix}${latestDate}/`))
    .sort();
  if (partKeys.length === 0) {
    return { repos: 0, skills: 0, errors: [{ repo: "index", error: "No repo index parts found." }] };
  }

  const state = await loadScanState(env, "github-index");
  let cursorKey = state.cursor_key;
  let cursorOffset = state.cursor_offset;

  if (!cursorKey || !partKeys.includes(cursorKey) || state.index_date !== latestDate) {
    cursorKey = partKeys[0] || null;
    cursorOffset = 0;
  }

  if (!cursorKey) {
    return { repos: 0, skills: 0, errors: [{ repo: "index", error: "Missing cursor key." }] };
  }

  const batchSize = Math.min(Math.max(input.batchSize ?? parseEnvInt(env.CATALOG_REPO_SCAN_BATCH, 50, 1, 500), 1), 500);
  const entries = await loadRepoIndexPart(env, cursorKey);
  if (cursorOffset >= entries.length) {
    cursorOffset = 0;
  }

  const slice = entries.slice(cursorOffset, cursorOffset + batchSize);
  if (slice.length === 0) {
    await saveScanState(env, "github-index", {
      cursorKey,
      cursorOffset,
      indexDate: latestDate,
      status: "idle",
      success: true,
    });
    return { repos: 0, skills: 0, errors: [] };
  }

  const concurrency = parseEnvInt(env.CATALOG_SCAN_CONCURRENCY, 2, 1, 8);
  const delayMs = parseEnvInt(env.CATALOG_SCAN_DELAY_MS, 250, 0, 5000);
  const queue = slice.slice();
  const errors: Array<{ repo: string; error: string }> = [];
  let scanned = 0;
  let skills = 0;

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) return;
      try {
        const result = await scanRepo(env, entry);
        scanned += 1;
        skills += result.skills;
        errors.push(...result.errors);
      } catch (err) {
        errors.push({ repo: entry.repo, error: err instanceof Error ? err.message : String(err) });
      } finally {
        if (delayMs > 0) await sleep(delayMs);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const nextOffset = cursorOffset + slice.length;
  let nextKey: string | null = cursorKey;
  let nextIndexDate = latestDate;
  let nextCursorOffset = nextOffset;

  if (nextOffset >= entries.length) {
    const currentIndex = partKeys.indexOf(cursorKey);
    const nextPart = currentIndex >= 0 ? partKeys[currentIndex + 1] : null;
    if (nextPart) {
      nextKey = nextPart;
      nextCursorOffset = 0;
    } else {
      nextKey = partKeys[0] || cursorKey;
      nextCursorOffset = 0;
    }
  }

  await saveScanState(env, "github-index", {
    cursorKey: nextKey,
    cursorOffset: nextCursorOffset,
    indexDate: nextIndexDate,
    status: errors.length ? "partial" : "ok",
    error: errors.length ? errors.map(e => `${e.repo}: ${e.error}`).join("; ") : null,
    success: errors.length === 0,
  });

  return { repos: scanned, skills, errors };
}

export async function scanCatalogRepo(env: Env, repo: string): Promise<RepoScanResult> {
  const normalized = normalizeRepo(repo);
  const entry: RepoIndexEntry = { repo: normalized };
  return scanRepo(env, entry);
}

export async function ingestCatalogIndexPart(
  env: Env,
  input: { date: string; part: string; repos: RepoIndexEntry[] },
): Promise<{ key: string; count: number }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Invalid date. Expected YYYY-MM-DD.");
  }
  const part = input.part.trim() || "part-0001.json";
  const prefix = (env.CATALOG_REPO_INDEX_PREFIX || "repo-index").replace(/\/+$/, "");
  const key = `${prefix}/${input.date}/${part}`;
  const bucket = env.CATALOG_BUCKET ?? env.BUCKET;
  await bucket.put(key, JSON.stringify(input.repos ?? [], null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
  return { key, count: input.repos?.length ?? 0 };
}
