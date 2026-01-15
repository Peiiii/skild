import type { Env } from "./env.js";
import { assertHandle } from "./validate.js";

export type LinkedItemSourceProvider = "github";

export interface LinkedItemRow {
  id: string;
  source_provider: LinkedItemSourceProvider;
  source_repo: string;
  source_path: string | null;
  source_ref: string | null;
  source_url: string | null;
  alias: string | null;
  title: string;
  description: string;
  license: string | null;
  category: string | null;
  tags_json: string;
  submitted_by_publisher_id: string;
  created_at: string;
  updated_at: string;
}

export interface LinkedItemsPage {
  rows: LinkedItemRow[];
  nextCursor: string | null;
}

export interface LinkedItem {
  id: string;
  alias: string | null;
  source: {
    provider: LinkedItemSourceProvider;
    repo: string;
    path: string | null;
    ref: string | null;
    url: string | null;
  };
  title: string;
  description: string;
  license: string | null;
  category: string | null;
  tags: string[];
  submittedBy: { id: string; handle: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedLinkedItem {
  source: {
    provider: LinkedItemSourceProvider;
    repo: string;
    path: string | null;
    ref: string | null;
    url: string;
  };
  defaults: {
    title: string;
    description: string;
  };
  install: string;
}

const DEFAULT_DESCRIPTION = "No description";

function normalizeRepo(repo: string): string {
  const r = repo.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  const m = r.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!m) throw new Error("Invalid repo. Expected owner/repo.");
  return `${m[1]}/${m[2]}`;
}

function normalizePath(path: string | undefined | null): string | null {
  const p = (path ?? "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!p) return null;
  if (p.includes("..")) throw new Error("Invalid path.");
  return p;
}

function normalizeRef(ref: string | undefined | null): string | null {
  const r = (ref ?? "").trim();
  if (!r) return null;
  if (r.length > 200) throw new Error("Invalid ref.");
  return r;
}

function normalizeUrl(url: string | undefined | null): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) throw new Error("Invalid url. Expected http(s) URL.");
  return raw;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const t of tags) {
    if (typeof t !== "string") continue;
    const v = t.trim().toLowerCase();
    if (!v) continue;
    if (v.length > 32) continue;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) continue;
    if (!out.includes(v)) out.push(v);
    if (out.length >= 20) break;
  }
  return out;
}

function defaultTitleFromSource(repo: string, path: string | null): string {
  if (path) {
    const segment = path.split("/").filter(Boolean).pop();
    if (segment) return segment;
  }
  return repo.split("/")[1] ?? repo;
}

function normalizeTitle(input: string | undefined | null, repo: string, path: string | null): string {
  const value = (input ?? "").trim() || defaultTitleFromSource(repo, path);
  return value.slice(0, 80);
}

function normalizeDescription(input: string | undefined | null): string {
  const value = (input ?? "").trim() || DEFAULT_DESCRIPTION;
  return value.slice(0, 500);
}

function parseGithubUrl(input: string): { repo: string; path: string | null; ref: string | null; url: string } {
  const raw = input.trim();
  if (!raw) throw new Error("Missing GitHub URL.");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid GitHub URL.");
  }
  if (parsed.hostname !== "github.com") throw new Error("Invalid GitHub URL.");
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Invalid GitHub URL.");
  const repo = normalizeRepo(`${parts[0]}/${parts[1]}`);

  let ref: string | null = null;
  let path: string | null = null;
  if (parts.length >= 3) {
    if (parts[2] !== "tree") throw new Error("Invalid GitHub URL.");
    if (parts.length < 4) throw new Error("Invalid GitHub URL.");
    ref = normalizeRef(parts[3]);
    const rawPath = parts.slice(4).join("/");
    path = normalizePath(rawPath);
  }

  return { repo, path, ref, url: raw };
}

function parseGithubSpec(input: string): { repo: string; path: string | null; ref: string | null } {
  const raw = input.trim();
  if (!raw) throw new Error("Missing GitHub spec.");
  const [pathPart, refPart] = raw.split("#", 2);
  const parts = pathPart.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Invalid GitHub spec.");
  const repo = normalizeRepo(`${parts[0]}/${parts[1]}`);
  const path = normalizePath(parts.slice(2).join("/"));
  const ref = normalizeRef(refPart ?? null);
  return { repo, path, ref };
}

function resolveSourceInput(input: {
  provider: LinkedItemSourceProvider;
  repo?: string | null;
  path?: string | null;
  ref?: string | null;
  url?: string | null;
  spec?: string | null;
}): { repo: string; path: string | null; ref: string | null; url: string | null } {
  if (input.provider !== "github") throw new Error("Unsupported provider.");
  const url = normalizeUrl(input.url);
  const parsed = url ? parseGithubUrl(url) : null;
  const spec = (input.spec ?? "").trim();
  const parsedSpec = !parsed && spec ? parseGithubSpec(spec) : null;
  const repoInput = (input.repo ?? "").trim();
  if (!parsed && !parsedSpec && !repoInput) throw new Error("Missing repo.");

  const repo = normalizeRepo(parsed?.repo ?? parsedSpec?.repo ?? repoInput);
  const path = normalizePath(parsed?.path ?? parsedSpec?.path ?? input.path);
  const ref = normalizeRef(parsed?.ref ?? parsedSpec?.ref ?? input.ref);

  if (parsed && repoInput && normalizeRepo(repoInput) !== parsed.repo) throw new Error("Repo does not match URL.");
  if (parsed && input.path != null && normalizePath(input.path) !== parsed.path) throw new Error("Path does not match URL.");
  if (parsed && input.ref != null && normalizeRef(input.ref) !== parsed.ref) throw new Error("Ref does not match URL.");

  return { repo, path, ref, url: parsed?.url ?? url };
}

function buildGithubUrl(input: { repo: string; path: string | null; ref: string | null }): string {
  const ref = input.ref ?? "main";
  const path = input.path ? `/${input.path}` : "";
  return `https://github.com/${input.repo}/tree/${encodeURIComponent(ref)}${path}`;
}

function buildDegitPath(input: { repo: string; path: string | null; ref: string | null }): string {
  const path = input.path ? `/${input.path}` : "";
  const ref = input.ref ? `#${input.ref}` : "";
  return `${input.repo}${path}${ref}`;
}

export function buildInstallCommand(source: { provider: LinkedItemSourceProvider; repo: string; path: string | null; ref: string | null; url: string | null }): string {
  if (source.provider !== "github") throw new Error("Unsupported provider.");
  return `skild install "${buildDegitPath({ repo: source.repo, path: source.path, ref: source.ref })}"`;
}

export function normalizeLinkedSource(input: {
  provider: LinkedItemSourceProvider;
  repo?: string | null;
  path?: string | null;
  ref?: string | null;
  url?: string | null;
  spec?: string | null;
}): { provider: LinkedItemSourceProvider; repo: string; path: string | null; ref: string | null; url: string | null } {
  const resolved = resolveSourceInput(input);
  return {
    provider: input.provider,
    repo: resolved.repo,
    path: resolved.path,
    ref: resolved.ref,
    url: resolved.url ?? buildGithubUrl({ repo: resolved.repo, path: resolved.path, ref: resolved.ref }),
  };
}

export function parseLinkedItemUrl(url: string): ParsedLinkedItem {
  const source = resolveSourceInput({ provider: "github", url });
  const defaults = {
    title: normalizeTitle(null, source.repo, source.path),
    description: normalizeDescription(null),
  };
  return {
    source: {
      provider: "github",
      repo: source.repo,
      path: source.path,
      ref: source.ref,
      url: source.url ?? buildGithubUrl({ repo: source.repo, path: source.path, ref: source.ref }),
    },
    defaults,
    install: buildInstallCommand({
      provider: "github",
      repo: source.repo,
      path: source.path,
      ref: source.ref,
      url: source.url,
    }),
  };
}

export async function createLinkedItem(
  env: Env,
  input: {
    submittedByPublisherId: string;
    source: { provider: LinkedItemSourceProvider; repo?: string | null; path?: string | null; ref?: string | null; url?: string | null };
    title?: string | null;
    description?: string | null;
    license?: string | null;
    category?: string | null;
    tags?: unknown;
  },
): Promise<LinkedItemRow> {
  const provider: LinkedItemSourceProvider = input.source.provider;
  const source = resolveSourceInput(input.source);
  const repo = source.repo;
  const path = source.path;
  const ref = source.ref;
  const url = source.url;

  const title = normalizeTitle(input.title, repo, path);
  const description = normalizeDescription(input.description);

  const license = (input.license ?? "").trim().slice(0, 120) || null;
  const category = (input.category ?? "").trim().slice(0, 40) || null;
  const tags = normalizeTags(input.tags);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const existing = await env.DB.prepare(
    "SELECT id FROM linked_items WHERE source_provider = ?1 AND source_repo = ?2 AND COALESCE(source_path, '') = COALESCE(?3, '') LIMIT 1",
  )
    .bind(provider, repo, path)
    .first<{ id: string }>();
  if (existing) {
    const err = new Error("Duplicate upstream.");
    // @ts-expect-error typed escape hatch
    err.status = 409;
    throw err;
  }

  await env.DB.prepare(
    "INSERT INTO linked_items (id, source_provider, source_repo, source_path, source_ref, source_url, title, description, license, category, tags_json, submitted_by_publisher_id, created_at, updated_at)\n" +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
  )
    .bind(
      id,
      provider,
      repo,
      path,
      ref,
      url,
      title,
      description,
      license,
      category,
      JSON.stringify(tags),
      input.submittedByPublisherId,
      now,
      now,
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM linked_items WHERE id = ?1 LIMIT 1").bind(id).first<LinkedItemRow>();
  if (!row) throw new Error("Failed to create item.");
  return row;
}

function decodeCursor(cursor: string | null | undefined): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  const [createdAt, id] = cursor.split("|");
  if (!createdAt || !id) return null;
  return { createdAt, id };
}

function encodeCursor(row: LinkedItemRow): string {
  return `${row.created_at}|${row.id}`;
}

export async function listLinkedItems(env: Env, input: { q?: string; limit?: number; cursor?: string | null }): Promise<LinkedItemsPage> {
  const q = (input.q ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const cursor = decodeCursor(input.cursor ?? null);

  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (q) {
    clauses.push("(title LIKE ? OR description LIKE ? OR source_repo LIKE ? OR tags_json LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  if (cursor) {
    clauses.push("(created_at < ? OR (created_at = ? AND id < ?))");
    params.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  let sql = "SELECT * FROM linked_items";
  if (clauses.length > 0) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += " ORDER BY created_at DESC, id DESC LIMIT ?";
  params.push(limit + 1);

  const result = await env.DB.prepare(sql).bind(...params).all();
  const rows = result.results as unknown as LinkedItemRow[];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && sliced.length > 0 ? encodeCursor(sliced[sliced.length - 1]) : null;
  return { rows: sliced, nextCursor };
}

export async function getLinkedItemById(env: Env, id: string): Promise<LinkedItemRow | null> {
  const row = await env.DB.prepare("SELECT * FROM linked_items WHERE id = ?1 LIMIT 1").bind(id).first<LinkedItemRow>();
  return row ?? null;
}

export async function getLinkedItemBySource(
  env: Env,
  input: { repo: string; path: string | null },
): Promise<LinkedItemRow | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM linked_items WHERE source_provider = 'github' AND source_repo = ?1 AND COALESCE(source_path, '') = COALESCE(?2, '') LIMIT 1",
  )
    .bind(input.repo, input.path)
    .first<LinkedItemRow>();
  return row ?? null;
}

export async function getPublisherHandleById(env: Env, publisherId: string): Promise<{ id: string; handle: string } | null> {
  const row = await env.DB.prepare("SELECT id, handle FROM publishers WHERE id = ?1 LIMIT 1")
    .bind(publisherId)
    .first<{ id: string; handle: string }>();
  if (!row) return null;
  assertHandle(row.handle);
  return row;
}

export function toLinkedItem(row: LinkedItemRow, submittedBy: { id: string; handle: string } | null): LinkedItem {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags_json);
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    alias: row.alias ?? null,
    source: {
      provider: row.source_provider,
      repo: row.source_repo,
      path: row.source_path,
      ref: row.source_ref,
      url: row.source_url,
    },
    title: row.title,
    description: row.description,
    license: row.license,
    category: row.category,
    tags,
    submittedBy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
