import type { Env } from "./env.js";
import { buildLinkedInstall } from "./discover-items.js";

export type CatalogSort = "updated" | "stars";

export interface CatalogSkillRow {
  id: string;
  repo: string;
  path: string;
  name: string | null;
  description: string | null;
  tags_json: string;
  source_ref: string | null;
  source_url: string | null;
  snapshot_key: string | null;
  has_readme: number;
  has_code: number;
  usage_artifact: number;
  installable: number;
  has_risk: number;
  risk_evidence: string | null;
  discovered_at: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  stars_total?: number | null;
  license_spdx?: string | null;
  topics_json?: string | null;
  default_branch?: string | null;
  source_type?: string | null;
}

export interface CatalogRepoRow {
  repo: string;
  source_type: string;
  source_url: string | null;
  default_branch: string | null;
  description: string | null;
  homepage: string | null;
  topics_json: string | null;
  license_spdx: string | null;
  stars_total: number | null;
  forks_total: number | null;
  updated_at: string | null;
  pushed_at: string | null;
  created_at: string | null;
  last_seen: string | null;
  last_scanned_at: string | null;
  scan_status: string | null;
  scan_error: string | null;
  is_skill_repo: number | null;
  has_risk: number | null;
  risk_evidence: string | null;
}

export interface CatalogSkill {
  id: string;
  repo: string;
  path: string;
  name: string;
  description: string;
  tags: string[];
  topics: string[];
  sourceRef: string | null;
  sourceUrl: string | null;
  install: string;
  discoveredAt: string;
  lastSeen: string;
  starsTotal: number | null;
  licenseSpdx: string | null;
  hasRisk: boolean;
  usageArtifact: boolean;
  installable: boolean;
}

export interface CatalogRepo {
  repo: string;
  sourceType: string;
  sourceUrl: string | null;
  defaultBranch: string | null;
  description: string | null;
  homepage: string | null;
  topics: string[];
  licenseSpdx: string | null;
  starsTotal: number | null;
  forksTotal: number | null;
  updatedAt: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  lastSeen: string | null;
  lastScannedAt: string | null;
  scanStatus: string | null;
  scanError: string | null;
  isSkillRepo: boolean;
  hasRisk: boolean;
  riskEvidence: string | null;
}

export interface CatalogSkillsPage {
  rows: CatalogSkillRow[];
  nextCursor: string | null;
  total: number;
}

export interface CatalogSkillDetail {
  skill: CatalogSkill;
  repo: CatalogRepo | null;
  snapshotKey: string | null;
  riskEvidence: string[];
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

function parseRiskEvidence(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

function encodeCursor(row: CatalogSkillRow, sort: CatalogSort): string {
  if (sort === "stars") {
    const stars = row.stars_total ?? 0;
    return `v1|stars|${stars}|${row.last_seen}|${row.id}`;
  }
  return `v1|updated|${row.last_seen}|${row.id}`;
}

function decodeCursor(cursor: string | null | undefined): { sort: CatalogSort; stars?: number; lastSeen: string; id: string } | null {
  if (!cursor) return null;
  const parts = cursor.split("|");
  if (parts.length < 4 || parts[0] !== "v1") return null;
  if (parts[1] === "stars" && parts.length >= 5) {
    const stars = Number.parseInt(parts[2] || "0", 10) || 0;
    const lastSeen = parts[3] || "";
    const id = parts[4] || "";
    if (!lastSeen || !id) return null;
    return { sort: "stars", stars, lastSeen, id };
  }
  if (parts[1] === "updated" && parts.length >= 4) {
    const lastSeen = parts[2] || "";
    const id = parts[3] || "";
    if (!lastSeen || !id) return null;
    return { sort: "updated", lastSeen, id };
  }
  return null;
}

function resolveSort(input: string | null | undefined): CatalogSort {
  if ((input ?? "").trim().toLowerCase() === "stars") return "stars";
  return "updated";
}

export function toCatalogSkill(row: CatalogSkillRow): CatalogSkill {
  const safePath = row.path ?? "";
  const name = (row.name ?? safePath.split("/").pop() ?? row.repo).trim();
  const description = (row.description ?? "").trim();
  const tags = parseJsonArray(row.tags_json);
  const topics = parseJsonArray(row.topics_json);
  return {
    id: row.id,
    repo: row.repo,
    path: safePath,
    name,
    description,
    tags,
    topics,
    sourceRef: row.source_ref ?? null,
    sourceUrl: row.source_url ?? null,
    install: buildLinkedInstall({ repo: row.repo, path: safePath || null, ref: row.source_ref ?? null }),
    discoveredAt: row.discovered_at,
    lastSeen: row.last_seen,
    starsTotal: row.stars_total ?? null,
    licenseSpdx: row.license_spdx ?? null,
    hasRisk: row.has_risk === 1,
    usageArtifact: row.usage_artifact === 1,
    installable: row.installable === 1,
  };
}

export function toCatalogRepo(row: CatalogRepoRow): CatalogRepo {
  return {
    repo: row.repo,
    sourceType: row.source_type,
    sourceUrl: row.source_url ?? null,
    defaultBranch: row.default_branch ?? null,
    description: row.description ?? null,
    homepage: row.homepage ?? null,
    topics: parseJsonArray(row.topics_json),
    licenseSpdx: row.license_spdx ?? null,
    starsTotal: row.stars_total ?? null,
    forksTotal: row.forks_total ?? null,
    updatedAt: row.updated_at ?? null,
    pushedAt: row.pushed_at ?? null,
    createdAt: row.created_at ?? null,
    lastSeen: row.last_seen ?? null,
    lastScannedAt: row.last_scanned_at ?? null,
    scanStatus: row.scan_status ?? null,
    scanError: row.scan_error ?? null,
    isSkillRepo: row.is_skill_repo === 1,
    hasRisk: row.has_risk === 1,
    riskEvidence: row.risk_evidence ?? null,
  };
}

export async function listCatalogSkills(
  env: Env,
  input: {
    q?: string;
    limit?: number;
    cursor?: string | null;
    sort?: string | null;
    risk?: boolean | null;
    installable?: boolean | null;
    usageArtifact?: boolean | null;
    repo?: string | null;
    sourceType?: string | null;
  },
): Promise<CatalogSkillsPage> {
  const q = (input.q ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const sort = resolveSort(input.sort);
  const cursor = decodeCursor(input.cursor ?? null);
  const riskFilter = input.risk ?? null;
  const installable = input.installable ?? null;
  const usageArtifact = input.usageArtifact ?? null;
  const repoFilter = (input.repo ?? "").trim();
  const sourceType = (input.sourceType ?? "").trim().toLowerCase();

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    clauses.push("(s.name LIKE ? OR s.description LIKE ? OR s.repo LIKE ? OR s.path LIKE ? OR s.tags_json LIKE ?)");
    params.push(like, like, like, like, like);
  }

  if (riskFilter !== null) {
    clauses.push("s.has_risk = ?");
    params.push(riskFilter ? 1 : 0);
  }

  if (installable !== null) {
    clauses.push("s.installable = ?");
    params.push(installable ? 1 : 0);
  }

  if (usageArtifact !== null) {
    clauses.push("s.usage_artifact = ?");
    params.push(usageArtifact ? 1 : 0);
  }

  if (repoFilter) {
    clauses.push("s.repo = ?");
    params.push(repoFilter);
  }

  if (sourceType) {
    clauses.push("LOWER(r.source_type) = ?");
    params.push(sourceType);
  }

  let cursorClause = "";
  const cursorParams: Array<string | number> = [];
  if (cursor && cursor.sort === sort) {
    if (sort === "updated") {
      cursorClause = "(s.last_seen < ? OR (s.last_seen = ? AND s.id < ?))";
      cursorParams.push(cursor.lastSeen, cursor.lastSeen, cursor.id);
    } else if (sort === "stars" && typeof cursor.stars === "number") {
      cursorClause =
        "(COALESCE(r.stars_total, 0) < ? OR (COALESCE(r.stars_total, 0) = ? AND s.last_seen < ?) OR (COALESCE(r.stars_total, 0) = ? AND s.last_seen = ? AND s.id < ?))";
      cursorParams.push(cursor.stars, cursor.stars, cursor.lastSeen, cursor.stars, cursor.lastSeen, cursor.id);
    }
  }

  const whereClauses = cursorClause ? [...clauses, cursorClause] : clauses;
  const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const order =
    sort === "stars"
      ? "ORDER BY COALESCE(r.stars_total, 0) DESC, s.last_seen DESC, s.id DESC"
      : "ORDER BY s.last_seen DESC, s.id DESC";

  const sql =
    "SELECT s.*, r.stars_total, r.license_spdx, r.topics_json, r.default_branch, r.source_type\n" +
    "FROM catalog_skills s\n" +
    "LEFT JOIN catalog_repos r ON r.repo = s.repo\n" +
    `${where}\n${order}\nLIMIT ?`;
  const rows = await env.DB.prepare(sql)
    .bind(...params, ...cursorParams, limit + 1)
    .all<CatalogSkillRow>();

  const resultRows = rows.results ?? [];
  const next = resultRows.length > limit ? resultRows.pop() ?? null : null;
  const nextCursor = next ? encodeCursor(next, sort) : null;

  const countWhere = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const countSql =
    "SELECT COUNT(1) as total\n" +
    "FROM catalog_skills s\n" +
    "LEFT JOIN catalog_repos r ON r.repo = s.repo\n" +
    `${countWhere}`;
  const totalRow = await env.DB.prepare(countSql)
    .bind(...params)
    .first<{ total: number }>();
  const total = totalRow?.total ?? resultRows.length;

  return { rows: resultRows, nextCursor, total };
}

export async function getCatalogSkillById(env: Env, id: string): Promise<CatalogSkillRow | null> {
  return env.DB.prepare(
    "SELECT s.*, r.stars_total, r.license_spdx, r.topics_json, r.default_branch, r.source_type\n" +
      "FROM catalog_skills s LEFT JOIN catalog_repos r ON r.repo = s.repo WHERE s.id = ?1 LIMIT 1",
  )
    .bind(id)
    .first<CatalogSkillRow>();
}

export async function listCatalogRepoSkills(env: Env, repo: string, limit = 200): Promise<CatalogSkillRow[]> {
  const rows = await env.DB.prepare(
    "SELECT s.*, r.stars_total, r.license_spdx, r.topics_json, r.default_branch, r.source_type\n" +
      "FROM catalog_skills s LEFT JOIN catalog_repos r ON r.repo = s.repo WHERE s.repo = ?1 ORDER BY s.last_seen DESC LIMIT ?2",
  )
    .bind(repo, limit)
    .all<CatalogSkillRow>();
  return rows.results ?? [];
}

export async function getCatalogRepo(env: Env, repo: string): Promise<CatalogRepoRow | null> {
  return env.DB.prepare("SELECT * FROM catalog_repos WHERE repo = ?1 LIMIT 1")
    .bind(repo)
    .first<CatalogRepoRow>();
}

export async function upsertCatalogRepo(
  env: Env,
  input: {
    repo: string;
    sourceType: string;
    sourceUrl: string | null;
    defaultBranch: string | null;
    description: string | null;
    homepage: string | null;
    topics: string[];
    licenseSpdx: string | null;
    starsTotal: number | null;
    forksTotal: number | null;
    updatedAt: string | null;
    pushedAt: string | null;
    createdAt: string | null;
    lastSeen: string;
    lastScannedAt: string | null;
    scanStatus: string | null;
    scanError: string | null;
    isSkillRepo: boolean;
    hasRisk: boolean;
    riskEvidence: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO catalog_repos (repo, source_type, source_url, default_branch, description, homepage, topics_json, license_spdx, stars_total, forks_total, updated_at, pushed_at, created_at, last_seen, last_scanned_at, scan_status, scan_error, is_skill_repo, has_risk, risk_evidence)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)\n" +
      "ON CONFLICT(repo) DO UPDATE SET source_type = excluded.source_type, source_url = excluded.source_url, default_branch = excluded.default_branch, description = excluded.description, homepage = excluded.homepage, topics_json = excluded.topics_json, license_spdx = excluded.license_spdx, stars_total = excluded.stars_total, forks_total = excluded.forks_total, updated_at = excluded.updated_at, pushed_at = excluded.pushed_at, last_seen = excluded.last_seen, last_scanned_at = excluded.last_scanned_at, scan_status = excluded.scan_status, scan_error = excluded.scan_error, is_skill_repo = excluded.is_skill_repo, has_risk = excluded.has_risk, risk_evidence = excluded.risk_evidence",
  )
    .bind(
      input.repo,
      input.sourceType,
      input.sourceUrl,
      input.defaultBranch,
      input.description,
      input.homepage,
      JSON.stringify(input.topics ?? []),
      input.licenseSpdx,
      input.starsTotal,
      input.forksTotal,
      input.updatedAt,
      input.pushedAt,
      input.createdAt ?? now,
      input.lastSeen,
      input.lastScannedAt,
      input.scanStatus,
      input.scanError,
      input.isSkillRepo ? 1 : 0,
      input.hasRisk ? 1 : 0,
      input.riskEvidence,
    )
    .run();
}

export async function upsertCatalogSkill(
  env: Env,
  input: {
    id: string;
    repo: string;
    path: string;
    name: string | null;
    description: string | null;
    tags: string[];
    sourceRef: string | null;
    sourceUrl: string | null;
    snapshotKey: string | null;
    hasReadme: boolean;
    hasCode: boolean;
    usageArtifact: boolean;
    installable: boolean;
    hasRisk: boolean;
    riskEvidence: string[];
    discoveredAt: string;
    lastSeen: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO catalog_skills (id, repo, path, name, description, tags_json, source_ref, source_url, snapshot_key, has_readme, has_code, usage_artifact, installable, has_risk, risk_evidence, discovered_at, last_seen, created_at, updated_at)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)\n" +
      "ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, tags_json = excluded.tags_json, source_ref = excluded.source_ref, source_url = excluded.source_url, snapshot_key = excluded.snapshot_key, has_readme = excluded.has_readme, has_code = excluded.has_code, usage_artifact = excluded.usage_artifact, installable = excluded.installable, has_risk = excluded.has_risk, risk_evidence = excluded.risk_evidence, last_seen = excluded.last_seen, updated_at = excluded.updated_at",
  )
    .bind(
      input.id,
      input.repo,
      input.path,
      input.name,
      input.description,
      JSON.stringify(input.tags ?? []),
      input.sourceRef,
      input.sourceUrl,
      input.snapshotKey,
      input.hasReadme ? 1 : 0,
      input.hasCode ? 1 : 0,
      input.usageArtifact ? 1 : 0,
      input.installable ? 1 : 0,
      input.hasRisk ? 1 : 0,
      input.riskEvidence.join("\n"),
      input.discoveredAt,
      input.lastSeen,
      now,
      now,
    )
    .run();
}

export async function upsertCatalogSkillSource(
  env: Env,
  input: {
    skillId: string;
    sourceType: string;
    sourceUrl: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO catalog_skill_sources (skill_id, source_type, source_url, created_at)\n" +
      "VALUES (?1, ?2, ?3, ?4)\n" +
      "ON CONFLICT(skill_id, source_type, source_url) DO NOTHING",
  )
    .bind(input.skillId, input.sourceType, input.sourceUrl, now)
    .run();
}

export function toCatalogSkillDetail(row: CatalogSkillRow, repo: CatalogRepoRow | null): CatalogSkillDetail {
  return {
    skill: toCatalogSkill(row),
    repo: repo ? toCatalogRepo(repo) : null,
    snapshotKey: row.snapshot_key ?? null,
    riskEvidence: parseRiskEvidence(row.risk_evidence),
  };
}
