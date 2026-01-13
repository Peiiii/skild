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
  title: string;
  description: string;
  license: string | null;
  category: string | null;
  tags_json: string;
  submitted_by_publisher_id: string;
  created_at: string;
  updated_at: string;
}

export interface LinkedItem {
  id: string;
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

function buildGithubUrl(input: { repo: string; path: string | null; ref: string | null }): string {
  const ref = input.ref ?? "main";
  const path = input.path ? `/${input.path}` : "";
  return `https://github.com/${input.repo}/tree/${encodeURIComponent(ref)}${path}`;
}

export function buildInstallCommand(source: { provider: LinkedItemSourceProvider; repo: string; path: string | null; ref: string | null; url: string | null }): string {
  if (source.provider !== "github") throw new Error("Unsupported provider.");
  const url = source.url?.trim() || buildGithubUrl({ repo: source.repo, path: source.path, ref: source.ref });
  return `skild install ${url}`;
}

export async function createLinkedItem(
  env: Env,
  input: {
    submittedByPublisherId: string;
    source: { provider: LinkedItemSourceProvider; repo: string; path?: string | null; ref?: string | null; url?: string | null };
    title: string;
    description: string;
    license?: string | null;
    category?: string | null;
    tags?: unknown;
  },
): Promise<LinkedItemRow> {
  const provider: LinkedItemSourceProvider = input.source.provider;
  if (provider !== "github") throw new Error("Unsupported provider.");

  const repo = normalizeRepo(input.source.repo);
  const path = normalizePath(input.source.path);
  const ref = normalizeRef(input.source.ref);
  const url = (input.source.url ?? "").trim() || null;

  const title = input.title.trim().slice(0, 80);
  const description = input.description.trim().slice(0, 500);
  if (!title) throw new Error("Missing title.");
  if (!description) throw new Error("Missing description.");

  const license = (input.license ?? "").trim().slice(0, 120) || null;
  const category = (input.category ?? "").trim().slice(0, 40) || null;
  const tags = normalizeTags(input.tags);
  if (url && !url.startsWith("https://github.com/")) throw new Error("Invalid url. Expected a GitHub URL.");

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

export async function listLinkedItems(env: Env, input: { q?: string; limit?: number }): Promise<LinkedItemRow[]> {
  const q = (input.q ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  if (q) {
    const result = await env.DB.prepare(
      "SELECT * FROM linked_items WHERE (title LIKE ?1 OR description LIKE ?1 OR source_repo LIKE ?1) ORDER BY created_at DESC LIMIT ?2",
    )
      .bind(`%${q}%`, limit)
      .all();
    return result.results as unknown as LinkedItemRow[];
  }

  const result = await env.DB.prepare("SELECT * FROM linked_items ORDER BY created_at DESC LIMIT ?1").bind(limit).all();
  return result.results as unknown as LinkedItemRow[];
}

export async function getLinkedItemById(env: Env, id: string): Promise<LinkedItemRow | null> {
  const row = await env.DB.prepare("SELECT * FROM linked_items WHERE id = ?1 LIMIT 1").bind(id).first<LinkedItemRow>();
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
