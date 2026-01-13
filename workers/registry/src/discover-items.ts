import type { Env } from "./env.js";
import type { LinkedItemRow } from "./linked-items.js";

export type DiscoverItemType = "registry" | "linked";

export interface DiscoverItemRow {
  type: DiscoverItemType;
  source_id: string;
  title: string;
  description: string;
  tags_json: string;
  install: string;
  publisher_handle: string | null;
  source_repo: string | null;
  source_path: string | null;
  source_ref: string | null;
  source_url: string | null;
  discover_at: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoverItem {
  type: DiscoverItemType;
  sourceId: string;
  title: string;
  description: string;
  tags: string[];
  install: string;
  publisherHandle: string | null;
  source: {
    repo: string | null;
    path: string | null;
    ref: string | null;
    url: string | null;
  } | null;
  discoverAt: string;
  createdAt: string;
  updatedAt: string;
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

function decodeCursor(cursor: string | null | undefined): { discoverAt: string; type: DiscoverItemType; sourceId: string } | null {
  if (!cursor) return null;
  const [discoverAt, typeRaw, sourceId] = cursor.split("|", 3);
  if (!discoverAt || !typeRaw || !sourceId) return null;
  const type = typeRaw === "registry" || typeRaw === "linked" ? typeRaw : null;
  if (!type) return null;
  return { discoverAt, type, sourceId };
}

function encodeCursor(row: DiscoverItemRow): string {
  return `${row.discover_at}|${row.type}|${row.source_id}`;
}

function buildRegistryInstall(name: string): string {
  return `skild install ${name}`;
}

function buildLinkedInstall(input: { repo: string; path: string | null; ref: string | null }): string {
  const path = input.path ? `/${input.path}` : "";
  const ref = input.ref ? `#${input.ref}` : "";
  return `skild install ${input.repo}${path}${ref}`;
}

export function toDiscoverItem(row: DiscoverItemRow): DiscoverItem {
  return {
    type: row.type,
    sourceId: row.source_id,
    title: row.title,
    description: row.description,
    tags: parseTags(row.tags_json),
    install: row.install,
    publisherHandle: row.publisher_handle,
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
  };
}

export async function upsertDiscoverItemForSkill(env: Env, input: {
  name: string;
  description: string | null;
  publisherHandle: string | null;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  const description = (input.description ?? "").trim();
  const discoverAt = input.updatedAt;
  await env.DB.prepare(
    "INSERT INTO discover_items (type, source_id, title, description, tags_json, install, publisher_handle, source_repo, source_path, source_ref, source_url, discover_at, created_at, updated_at)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, NULL, NULL, NULL, ?8, ?9, ?10)\n" +
      "ON CONFLICT(type, source_id) DO UPDATE SET title = excluded.title, description = excluded.description, tags_json = excluded.tags_json, install = excluded.install, publisher_handle = excluded.publisher_handle, discover_at = excluded.discover_at, updated_at = excluded.updated_at",
  )
    .bind(
      "registry",
      input.name,
      input.name,
      description,
      "[]",
      buildRegistryInstall(input.name),
      input.publisherHandle,
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
    "INSERT INTO discover_items (type, source_id, title, description, tags_json, install, publisher_handle, source_repo, source_path, source_ref, source_url, discover_at, created_at, updated_at)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)\n" +
      "ON CONFLICT(type, source_id) DO UPDATE SET title = excluded.title, description = excluded.description, tags_json = excluded.tags_json, install = excluded.install, publisher_handle = excluded.publisher_handle, source_repo = excluded.source_repo, source_path = excluded.source_path, source_ref = excluded.source_ref, source_url = excluded.source_url, discover_at = excluded.discover_at, updated_at = excluded.updated_at",
  )
    .bind(
      "linked",
      row.id,
      row.title,
      row.description,
      row.tags_json || "[]",
      install,
      input.submittedByHandle,
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

export async function listDiscoverItems(env: Env, input: { q?: string; limit?: number; cursor?: string | null }): Promise<DiscoverItemsPage> {
  const q = (input.q ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const cursor = decodeCursor(input.cursor ?? null);

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    clauses.push("(title LIKE ? OR description LIKE ? OR tags_json LIKE ? OR source_repo LIKE ? OR source_id LIKE ?)");
    params.push(like, like, like, like, like);
  }

  if (cursor) {
    clauses.push("(discover_at < ? OR (discover_at = ? AND type < ?) OR (discover_at = ? AND type = ? AND source_id < ?))");
    params.push(cursor.discoverAt, cursor.discoverAt, cursor.type, cursor.discoverAt, cursor.type, cursor.sourceId);
  }

  let sql = "SELECT * FROM discover_items";
  if (clauses.length > 0) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += " ORDER BY discover_at DESC, type DESC, source_id DESC LIMIT ?";
  params.push(limit + 1);

  const result = await env.DB.prepare(sql).bind(...params).all();
  const rows = result.results as unknown as DiscoverItemRow[];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && sliced.length > 0 ? encodeCursor(sliced[sliced.length - 1]) : null;
  return { rows: sliced, nextCursor };
}
