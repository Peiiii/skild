import type { Env } from "./env.js";
import type { LinkedItemRow } from "./linked-items.js";

export type DiscoverItemType = "registry" | "linked";
export type DiscoverSort = "updated" | "new" | "downloads_7d" | "downloads_30d";

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
  discover_at: string;
  created_at: string;
  updated_at: string;
  downloads_total: number;
  downloads_7d: number;
  downloads_30d: number;
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
}

export interface DiscoverItemsPage {
  rows: DiscoverItemRow[];
  nextCursor: string | null;
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
): { sortValue: string; discoverAt: string; type: DiscoverItemType; sourceId: string } | null {
  if (!cursor) return null;
  const parts = cursor.split("|");
  if (parts.length === 3) {
    const [discoverAt, typeRaw, sourceId] = parts;
    const type = typeRaw === "registry" || typeRaw === "linked" ? typeRaw : null;
    if (!discoverAt || !type || !sourceId) return null;
    return { sortValue: discoverAt, discoverAt, type, sourceId };
  }
  if (parts.length < 4) return null;
  const [sortValue, discoverAt, typeRaw, sourceId] = parts;
  const type = typeRaw === "registry" || typeRaw === "linked" ? typeRaw : null;
  if (!sortValue || !discoverAt || !type || !sourceId) return null;
  return { sortValue, discoverAt, type, sourceId };
}

function encodeCursor(row: DiscoverItemRow, sort: DiscoverSort): string {
  const sortValue = getSortValue(row, sort);
  return `${sortValue}|${row.discover_at}|${row.type}|${row.source_id}`;
}

function buildRegistryInstall(name: string): string {
  return `skild install ${name}`;
}

function buildLinkedInstall(input: { repo: string; path: string | null; ref: string | null }): string {
  const path = input.path ? `/${input.path}` : "";
  const ref = input.ref ? `#${input.ref}` : "";
  return `skild install "${input.repo}${path}${ref}"`;
}

export function toDiscoverItem(row: DiscoverItemRow): DiscoverItem {
  return {
    type: row.type,
    sourceId: row.source_id,
    alias: row.alias ?? null,
    title: row.title,
    description: row.description,
    tags: parseTags(row.tags_json),
    install: row.install,
    publisherHandle: row.publisher_handle,
    skillset: row.skillset === 1,
    source:
      row.type === "linked"
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
  input: { q?: string; limit?: number; cursor?: string | null; sort?: string | null; skillset?: boolean | null },
): Promise<DiscoverItemsPage> {
  const q = (input.q ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const sort = resolveSort(input.sort);
  const cursor = decodeCursor(input.cursor ?? null, sort);
  const skillsetFilter = input.skillset ?? null;

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    clauses.push(
      "(title LIKE ? OR description LIKE ? OR tags_json LIKE ? OR source_repo LIKE ? OR source_id LIKE ? OR alias LIKE ?)",
    );
    params.push(like, like, like, like, like, like);
  }

  if (skillsetFilter !== null) {
    clauses.push("skillset = ?");
    params.push(skillsetFilter ? 1 : 0);
  }

  const today = new Date();
  const endDay = today.toISOString().slice(0, 10);
  const start7d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6))
    .toISOString()
    .slice(0, 10);
  const start30d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29))
    .toISOString()
    .slice(0, 10);

  const baseSql =
    "SELECT d.*, COALESCE(s.alias, li.alias) AS alias, " +
    "COALESCE(dt.downloads, 0) AS downloads_total, " +
    "COALESCE(d7.downloads, 0) AS downloads_7d, " +
    "COALESCE(d30.downloads, 0) AS downloads_30d " +
    "FROM discover_items d " +
    "LEFT JOIN skills s ON s.name = d.source_id AND d.type = 'registry' " +
    "LEFT JOIN linked_items li ON li.id = d.source_id AND d.type = 'linked' " +
    "LEFT JOIN download_total dt ON dt.entity_type = d.type AND dt.entity_id = d.source_id " +
    "LEFT JOIN (SELECT entity_type, entity_id, SUM(downloads) AS downloads FROM download_daily WHERE day >= ? AND day <= ? GROUP BY entity_type, entity_id) d7 " +
    "  ON d7.entity_type = d.type AND d7.entity_id = d.source_id " +
    "LEFT JOIN (SELECT entity_type, entity_id, SUM(downloads) AS downloads FROM download_daily WHERE day >= ? AND day <= ? GROUP BY entity_type, entity_id) d30 " +
    "  ON d30.entity_type = d.type AND d30.entity_id = d.source_id";

  const baseParams: Array<string | number> = [start7d, endDay, start30d, endDay];

  const outerClauses = [...clauses];
  const outerParams = [...params];

  if (cursor) {
    outerClauses.push(
      "(sort_value < ? OR (sort_value = ? AND discover_at < ?) OR (sort_value = ? AND discover_at = ? AND type < ?) OR (sort_value = ? AND discover_at = ? AND type = ? AND source_id < ?))",
    );
    outerParams.push(
      cursor.sortValue,
      cursor.sortValue,
      cursor.discoverAt,
      cursor.sortValue,
      cursor.discoverAt,
      cursor.type,
      cursor.sortValue,
      cursor.discoverAt,
      cursor.type,
      cursor.sourceId,
    );
  }

  let sortExpr = "discover_at";
  if (sort === "downloads_7d") sortExpr = "downloads_7d";
  else if (sort === "downloads_30d") sortExpr = "downloads_30d";
  else if (sort === "new") sortExpr = "created_at";

  let sql = `SELECT *, ${sortExpr} AS sort_value FROM (${baseSql}) base`;
  const paramsList = [...baseParams, ...outerParams];
  if (outerClauses.length > 0) sql += ` WHERE ${outerClauses.join(" AND ")}`;
  sql += ` ORDER BY ${sortExpr} DESC, discover_at DESC, type DESC, source_id DESC LIMIT ?`;
  paramsList.push(limit + 1);

  const result = await env.DB.prepare(sql).bind(...paramsList).all();
  const rows = result.results as unknown as DiscoverItemRow[];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && sliced.length > 0 ? encodeCursor(sliced[sliced.length - 1], sort) : null;
  return { rows: sliced, nextCursor };
}
