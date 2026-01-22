import type { Env } from "./env.js";
import { formatInstallSpec } from "./github-utils.js";
import type { LinkedItemRow } from "./linked-items.js";

export type DiscoverItemType = "registry" | "linked" | "catalog";
export type DiscoverSort = "updated" | "new" | "downloads_7d" | "downloads_30d" | "stars" | "stars_30d";

export interface DiscoverItemRow {
  type: DiscoverItemType;
  source_id: string;
  alias: string | null;
  title: string;
  description: string;
  tags_json: string;
  install: string;
  publisher_handle: string | null;
  skillset: number;
  source_repo: string | null;
  source_path: string | null;
  source_ref: string | null;
  source_url: string | null;
  category: string | null;
  has_risk: number | null;
  usage_artifact: number | null;
  installable: number | null;
  discover_at: string;
  created_at: string;
  updated_at: string;
  downloads_total: number;
  downloads_7d: number;
  downloads_30d: number;
  stars_total: number | null;
  stars_30d: number | null;
}

export interface DiscoverItem {
  type: DiscoverItemType;
  sourceId: string;
  alias: string | null;
  title: string;
  description: string;
  tags: string[];
  install: string;
  publisherHandle: string | null;
  skillset: boolean;
  category?: string | null;
  hasRisk?: boolean;
  usageArtifact?: boolean;
  installable?: boolean;
  source: {
    repo: string | null;
    path: string | null;
    ref: string | null;
    url: string | null;
  } | null;
  discoverAt: string;
  createdAt: string;
  updatedAt: string;
  downloadsTotal: number;
  downloads7d: number;
  downloads30d: number;
  starsTotal: number | null;
  stars30d: number | null;
}

export interface DiscoverItemsPage {
  rows: DiscoverItemRow[];
  nextCursor: string | null;
  total: number;
}

function getMinStars(env: Env): number {
  const raw = (env.DISCOVER_MIN_STARS || "").trim();
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 0) return n;
  return 50;
}

function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson);
    if (Array.isArray(parsed)) return parsed.filter((t) => typeof t === "string");
  } catch {
    return [];
  }
  return [];
}

function resolveSort(input: string | null | undefined): DiscoverSort {
  switch ((input ?? "").trim().toLowerCase()) {
    case "downloads_7d":
      return "downloads_7d";
    case "downloads_30d":
      return "downloads_30d";
    case "stars":
      return "stars";
    case "stars_30d":
      return "stars_30d";
    case "new":
      return "new";
    case "updated":
    default:
      return "updated";
  }
}

function getSortValue(row: DiscoverItemRow, sort: DiscoverSort): string {
  switch (sort) {
    case "downloads_7d":
      return String(row.downloads_7d ?? 0);
    case "downloads_30d":
      return String(row.downloads_30d ?? 0);
    case "stars":
      return String(row.stars_total ?? 0);
    case "stars_30d":
      return String(row.stars_30d ?? 0);
    case "new":
      return row.created_at;
    case "updated":
    default:
      return row.discover_at;
  }
}

function decodeCursor(
  cursor: string | null | undefined,
  sort: DiscoverSort,
): { sortValue: string; discoverAt: string; id: string } | null {
  if (!cursor) return null;
  const parts = cursor.split("|");
  if (parts[0] === "v2") {
    if (parts.length < 4) return null;
    const [, sortValue, discoverAt, id] = parts;
    if (sortValue === undefined || sortValue === null || discoverAt === undefined || discoverAt === null || id === undefined || id === null) {
      return null;
    }
    return { sortValue, discoverAt, id };
  }
  if (parts.length === 3) {
    const [discoverAt, typeRaw, sourceId] = parts;
    const type = typeRaw === "registry" || typeRaw === "linked" || typeRaw === "catalog" ? typeRaw : null;
    if (!discoverAt || !type || !sourceId) return null;
    return { sortValue: discoverAt, discoverAt, id: `${type}:${sourceId}` };
  }
  if (parts.length < 4) return null;
  const [sortValue, discoverAt, typeRaw, sourceId] = parts;
  const type = typeRaw === "registry" || typeRaw === "linked" || typeRaw === "catalog" ? typeRaw : null;
  if (!sortValue || !discoverAt || !type || !sourceId) return null;
  return { sortValue, discoverAt, id: `${type}:${sourceId}` };
}

function encodeCursor(row: DiscoverItemRow, sort: DiscoverSort): string {
  const sortValue = getSortValue(row, sort);
  const cursorId = `${row.type}:${row.source_id}`;
  return `v2|${sortValue}|${row.discover_at}|${cursorId}`;
}

function buildRegistryInstall(name: string): string {
  return `skild install ${name}`;
}

export function buildLinkedInstall(input: { repo: string; path: string | null; ref: string | null }): string {
  return `skild install ${formatInstallSpec({ repo: input.repo, path: input.path, ref: input.ref })}`;
}

export function toDiscoverItem(row: DiscoverItemRow): DiscoverItem {
  const install =
    (row.type === "linked" || row.type === "catalog") && row.source_repo
      ? buildLinkedInstall({ repo: row.source_repo, path: row.source_path, ref: row.source_ref })
      : row.install;
  const hasRisk = row.has_risk == null ? undefined : row.has_risk === 1;
  const usageArtifact = row.usage_artifact == null ? undefined : row.usage_artifact === 1;
  const installable = row.installable == null ? undefined : row.installable === 1;
  return {
    type: row.type,
    sourceId: row.source_id,
    alias: row.alias ?? null,
    title: row.title,
    description: row.description,
    tags: parseTags(row.tags_json),
    install,
    publisherHandle: row.publisher_handle,
    skillset: row.skillset === 1,
    category: row.category ?? null,
    hasRisk,
    usageArtifact,
    installable,
    source:
      row.type === "linked" || row.type === "catalog"
        ? {
            repo: row.source_repo,
            path: row.source_path,
            ref: row.source_ref,
            url: row.source_url,
          }
        : null,
    discoverAt: row.discover_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    downloadsTotal: row.downloads_total ?? 0,
    downloads7d: row.downloads_7d ?? 0,
    downloads30d: row.downloads_30d ?? 0,
    starsTotal: row.stars_total ?? null,
    stars30d: row.stars_30d ?? null,
  };
}

export async function upsertDiscoverItemForSkill(env: Env, input: {
  name: string;
  description: string | null;
  publisherHandle: string | null;
  skillset: boolean;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  const description = (input.description ?? "").trim();
  const discoverAt = input.updatedAt;
  await env.DB.prepare(
    "INSERT INTO discover_items (type, source_id, title, description, tags_json, install, publisher_handle, skillset, source_repo, source_path, source_ref, source_url, discover_at, created_at, updated_at)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL, NULL, NULL, NULL, ?9, ?10, ?11)\n" +
      "ON CONFLICT(type, source_id) DO UPDATE SET title = excluded.title, description = excluded.description, tags_json = excluded.tags_json, install = excluded.install, publisher_handle = excluded.publisher_handle, skillset = excluded.skillset, discover_at = excluded.discover_at, updated_at = excluded.updated_at",
  )
    .bind(
      "registry",
      input.name,
      input.name,
      description,
      "[]",
      buildRegistryInstall(input.name),
      input.publisherHandle,
      input.skillset ? 1 : 0,
      discoverAt,
      input.createdAt,
      input.updatedAt,
    )
    .run();
}

export async function upsertDiscoverItemForLinkedItem(env: Env, input: {
  row: LinkedItemRow;
  submittedByHandle: string | null;
}): Promise<void> {
  const row = input.row;
  const discoverAt = row.updated_at;
  const install = buildLinkedInstall({ repo: row.source_repo, path: row.source_path, ref: row.source_ref });

  await env.DB.prepare(
    "INSERT INTO discover_items (type, source_id, title, description, tags_json, install, publisher_handle, skillset, source_repo, source_path, source_ref, source_url, discover_at, created_at, updated_at)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)\n" +
      "ON CONFLICT(type, source_id) DO UPDATE SET title = excluded.title, description = excluded.description, tags_json = excluded.tags_json, install = excluded.install, publisher_handle = excluded.publisher_handle, skillset = excluded.skillset, source_repo = excluded.source_repo, source_path = excluded.source_path, source_ref = excluded.source_ref, source_url = excluded.source_url, discover_at = excluded.discover_at, updated_at = excluded.updated_at",
  )
    .bind(
      "linked",
      row.id,
      row.title,
      row.description,
      row.tags_json || "[]",
      install,
      input.submittedByHandle,
      0,
      row.source_repo,
      row.source_path,
      row.source_ref,
      row.source_url,
      discoverAt,
      row.created_at,
      row.updated_at,
    )
    .run();
}

export async function listDiscoverItems(
  env: Env,
  input: { q?: string; limit?: number; cursor?: string | null; sort?: string | null; skillset?: boolean | null; category?: string | null },
): Promise<DiscoverItemsPage> {
  const q = (input.q ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const sort = resolveSort(input.sort);
  const cursor = decodeCursor(input.cursor ?? null, sort);
  const skillsetFilter = input.skillset ?? null;
  const categoryFilter = (input.category ?? "").trim().toLowerCase() || null;
  const minStars = getMinStars(env);

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    clauses.push(
      "(title LIKE ? OR description LIKE ? OR tags_json LIKE ? OR source_repo LIKE ? OR source_id LIKE ? OR alias LIKE ? OR category LIKE ?)",
    );
    params.push(like, like, like, like, like, like, like);
  }

  if (skillsetFilter !== null) {
    clauses.push("skillset = ?");
    params.push(skillsetFilter ? 1 : 0);
  }

  if (categoryFilter) {
    clauses.push("LOWER(category) = ?");
    params.push(categoryFilter);
  }

  const today = new Date();
  const endDay = today.toISOString().slice(0, 10);
  const start7d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6))
    .toISOString()
    .slice(0, 10);
  const start30d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29))
    .toISOString()
    .slice(0, 10);

  const baseUnionSql =
    "SELECT d.type, d.source_id, d.title, d.description, d.tags_json, d.install, d.publisher_handle, d.skillset, d.source_repo, d.source_path, d.source_ref, d.source_url, " +
    "NULL AS category, NULL AS has_risk, NULL AS usage_artifact, NULL AS installable, d.discover_at, d.created_at, d.updated_at " +
    "FROM discover_items d " +
    "UNION ALL " +
    "SELECT 'catalog' AS type, s.id AS source_id, COALESCE(NULLIF(s.name, ''), s.path) AS title, COALESCE(s.description, '') AS description, " +
    "COALESCE(NULLIF(s.final_tags_json, ''), NULLIF(s.auto_tags_json, ''), s.tags_json, '[]') AS tags_json, '' AS install, NULL AS publisher_handle, 0 AS skillset, " +
    "s.repo AS source_repo, s.path AS source_path, s.source_ref AS source_ref, s.source_url AS source_url, s.category AS category, s.has_risk AS has_risk, s.usage_artifact AS usage_artifact, s.installable AS installable, " +
    "s.last_seen AS discover_at, s.created_at AS created_at, s.updated_at AS updated_at " +
    "FROM catalog_skills s WHERE s.installable = 1";

  const baseSql =
    "SELECT base.*, COALESCE(s.alias, li.alias) AS alias, " +
    "COALESCE(dt.downloads, 0) AS downloads_total, " +
    "COALESCE(d7.downloads, 0) AS downloads_7d, " +
    "COALESCE(d30.downloads, 0) AS downloads_30d, " +
    "COALESCE(rm.stars_total, cr.stars_total) AS stars_total, " +
    "COALESCE(rm.stars_delta_30d, 0) AS stars_30d " +
    `FROM (${baseUnionSql}) base ` +
    "LEFT JOIN skills s ON s.name = base.source_id AND base.type = 'registry' " +
    "LEFT JOIN linked_items li ON li.id = base.source_id AND base.type = 'linked' " +
    "LEFT JOIN download_total dt ON dt.entity_type = base.type AND dt.entity_id = base.source_id " +
    "LEFT JOIN (SELECT entity_type, entity_id, SUM(downloads) AS downloads FROM download_daily WHERE day >= ? AND day <= ? GROUP BY entity_type, entity_id) d7 " +
    "  ON d7.entity_type = base.type AND d7.entity_id = base.source_id " +
    "LEFT JOIN (SELECT entity_type, entity_id, SUM(downloads) AS downloads FROM download_daily WHERE day >= ? AND day <= ? GROUP BY entity_type, entity_id) d30 " +
    "  ON d30.entity_type = base.type AND d30.entity_id = base.source_id " +
    "LEFT JOIN repo_metrics rm ON rm.repo = base.source_repo " +
    "LEFT JOIN catalog_repos cr ON cr.repo = base.source_repo AND base.type = 'catalog'";

  const baseParams: Array<string | number> = [start7d, endDay, start30d, endDay];

  let sortExpr = "discover_at";
  if (sort === "downloads_7d") sortExpr = "downloads_7d";
  else if (sort === "downloads_30d") sortExpr = "downloads_30d";
  else if (sort === "stars") sortExpr = "COALESCE(stars_total, 0)";
  else if (sort === "stars_30d") sortExpr = "COALESCE(stars_30d, 0)";
  else if (sort === "new") sortExpr = "created_at";

  const filterClauses = [...clauses];
  const filterParams = [...params];

  // Filter low-star external items (registry items不受影响)
  filterClauses.push("(type = 'registry' OR COALESCE(stars_total, 0) >= ?)");
  filterParams.push(minStars);

  // Build sort-projected subquery so we can reuse sort_value in WHERE safely
  const withSortSql = `SELECT *, ${sortExpr} AS sort_value FROM (${baseSql}) base`;

  // For list query (with pagination cursor)
  const outerClauses = [...filterClauses];
  const outerParams = [...filterParams];

  const cursorSortValue =
    cursor && (sort === "downloads_7d" || sort === "downloads_30d" || sort === "stars" || sort === "stars_30d")
      ? Number(cursor.sortValue)
      : cursor?.sortValue ?? null;

  if (cursor && cursorSortValue !== null) {
    outerClauses.push(
      "(sort_value < ? OR (sort_value = ? AND discover_at < ?) OR (sort_value = ? AND discover_at = ? AND (type || ':' || source_id) < ?))",
    );
    outerParams.push(
      cursorSortValue,
      cursorSortValue,
      cursor.discoverAt,
      cursorSortValue,
      cursor.discoverAt,
      cursor.id,
    );
  }

  let sql = `SELECT * FROM (${withSortSql}) sorted`;
  const paramsList = [...baseParams, ...outerParams];
  if (outerClauses.length > 0) sql += ` WHERE ${outerClauses.join(" AND ")}`;
  sql += ` ORDER BY sort_value DESC, discover_at DESC, (type || ':' || source_id) DESC LIMIT ?`;
  paramsList.push(limit + 1);

  const result = await env.DB.prepare(sql).bind(...paramsList).all();
  const rows = result.results as unknown as DiscoverItemRow[];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && sliced.length > 0 ? encodeCursor(sliced[sliced.length - 1], sort) : null;

  // Total count (without cursor pagination)
  let total = 0;
  try {
    let countSql = `SELECT COUNT(*) AS total FROM (${baseSql}) base`;
    const countParams = [...baseParams, ...filterParams];
    if (filterClauses.length > 0) countSql += ` WHERE ${filterClauses.join(" AND ")}`;
    const countRes = await env.DB.prepare(countSql).bind(...countParams).first<{ total: number }>();
    total = countRes?.total ?? 0;
  } catch {
    total = 0;
  }

  return { rows: sliced, nextCursor, total };
}
