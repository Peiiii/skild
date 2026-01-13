import type { Env } from "./env.js";
import { assertSkillName } from "./validate.js";
import { normalizeLinkedSource, getLinkedItemBySource } from "./linked-items.js";

export type EntityType = "registry" | "linked";

export interface DownloadEventInput {
  entityType: EntityType;
  entityId?: string | null;
  source: string;
  clientHash?: string | null;
  sourceInput?: {
    provider: "github";
    repo?: string | null;
    path?: string | null;
    ref?: string | null;
    url?: string | null;
    spec?: string | null;
  } | null;
  requestIp?: string | null;
  userAgent?: string | null;
}

export interface DownloadTrendPoint {
  day: string;
  downloads: number;
}

export interface DownloadStats {
  total: number;
  window: string;
  trend: DownloadTrendPoint[];
}

export interface LeaderboardItem {
  type: EntityType;
  sourceId: string;
  title: string;
  install: string;
  downloads: number;
}

export interface LeaderboardResult {
  period: string;
  items: LeaderboardItem[];
}

const ALLOWED_SOURCES = new Set(["cli", "console", "api", "unknown"]);
const PERIODS = new Map<string, number>([
  ["7d", 7],
  ["30d", 30],
  ["90d", 90],
  ["180d", 180],
]);

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map((v) => Number.parseInt(v, 10));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function addDays(date: Date, delta: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + delta);
  return next;
}

function listDays(startDay: string, endDay: string): string[] {
  const start = parseDay(startDay);
  const end = parseDay(endDay);
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push(formatDay(d));
  }
  return days;
}

function resolveWindow(window: string | null | undefined): { label: string; days: number } {
  const key = (window ?? "30d").trim().toLowerCase();
  if (PERIODS.has(key)) return { label: key, days: PERIODS.get(key)! };
  return { label: "30d", days: 30 };
}

async function sha256HexFromString(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(hash);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function resolveLinkedEntityId(
  env: Env,
  sourceInput: DownloadEventInput["sourceInput"],
): Promise<string> {
  if (!sourceInput) throw new Error("Missing linked source.");
  const normalized = normalizeLinkedSource(sourceInput);
  const row = await getLinkedItemBySource(env, normalized);
  if (!row) throw new Error("Linked item not found.");
  return row.id;
}

export async function recordDownloadEvent(env: Env, input: DownloadEventInput): Promise<{ entityId: string }> {
  const entityType = input.entityType;
  if (entityType !== "registry" && entityType !== "linked") throw new Error("Invalid entity type.");

  let entityId = (input.entityId ?? "").trim();
  if (entityType === "registry") {
    if (!entityId) throw new Error("Missing entity id.");
    assertSkillName(entityId);
  } else {
    if (!entityId) {
      entityId = await resolveLinkedEntityId(env, input.sourceInput ?? null);
    }
  }

  const source = ALLOWED_SOURCES.has(input.source) ? input.source : "unknown";
  const createdAt = new Date();
  const createdAtIso = createdAt.toISOString();
  const day = formatDay(createdAt);

  const clientHash = (input.clientHash ?? "").trim() || null;
  const ip = (input.requestIp ?? "").trim();
  const ipHash = ip ? await sha256HexFromString(ip) : null;
  const userAgent = (input.userAgent ?? "").trim().slice(0, 300) || null;

  const id = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO download_events (id, entity_type, entity_id, source, client_hash, ip_hash, user_agent, day, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
    ).bind(id, entityType, entityId, source, clientHash, ipHash, userAgent, day, createdAtIso),
    env.DB.prepare(
      "INSERT INTO download_daily (entity_type, entity_id, day, downloads, updated_at) VALUES (?1, ?2, ?3, 1, ?4)\n" +
        "ON CONFLICT(entity_type, entity_id, day) DO UPDATE SET downloads = downloads + 1, updated_at = excluded.updated_at",
    ).bind(entityType, entityId, day, createdAtIso),
    env.DB.prepare(
      "INSERT INTO download_total (entity_type, entity_id, downloads, updated_at) VALUES (?1, ?2, 1, ?3)\n" +
        "ON CONFLICT(entity_type, entity_id) DO UPDATE SET downloads = downloads + 1, updated_at = excluded.updated_at",
    ).bind(entityType, entityId, createdAtIso),
  ]);

  return { entityId };
}

export async function getDownloadStats(env: Env, input: { entityType: EntityType; entityId: string; window?: string | null }): Promise<DownloadStats> {
  const entityType = input.entityType;
  const entityId = input.entityId.trim();
  if (entityType === "registry") assertSkillName(entityId);

  const window = resolveWindow(input.window);
  const endDay = formatDay(new Date());
  const start = addDays(new Date(Date.UTC(Number.parseInt(endDay.slice(0, 4), 10), Number.parseInt(endDay.slice(5, 7), 10) - 1, Number.parseInt(endDay.slice(8, 10), 10))), -(window.days - 1));
  const startDay = formatDay(start);

  const totalRow = await env.DB.prepare(
    "SELECT downloads FROM download_total WHERE entity_type = ?1 AND entity_id = ?2 LIMIT 1",
  )
    .bind(entityType, entityId)
    .first<{ downloads: number }>();
  const total = totalRow?.downloads ?? 0;

  const dailyRows = await env.DB.prepare(
    "SELECT day, downloads FROM download_daily WHERE entity_type = ?1 AND entity_id = ?2 AND day >= ?3 AND day <= ?4 ORDER BY day ASC",
  )
    .bind(entityType, entityId, startDay, endDay)
    .all();

  const map = new Map<string, number>();
  for (const row of dailyRows.results as Array<{ day: string; downloads: number }>) {
    map.set(row.day, row.downloads);
  }

  const trend = listDays(startDay, endDay).map((day) => ({ day, downloads: map.get(day) ?? 0 }));

  return { total, window: window.label, trend };
}

export async function getLeaderboard(env: Env, input: { type?: EntityType | "all"; period?: string | null; limit?: number }): Promise<LeaderboardResult> {
  const period = resolveWindow(input.period);
  const endDay = formatDay(new Date());
  const start = addDays(new Date(Date.UTC(Number.parseInt(endDay.slice(0, 4), 10), Number.parseInt(endDay.slice(5, 7), 10) - 1, Number.parseInt(endDay.slice(8, 10), 10))), -(period.days - 1));
  const startDay = formatDay(start);
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);

  const clauses: string[] = ["dd.day >= ?", "dd.day <= ?"];
  const params: Array<string | number> = [startDay, endDay];
  if (input.type && input.type !== "all") {
    clauses.push("dd.entity_type = ?");
    params.push(input.type);
  }

  const sql =
    "SELECT d.type, d.source_id, d.title, d.install, SUM(dd.downloads) AS downloads\n" +
    "FROM download_daily dd\n" +
    "JOIN discover_items d ON d.type = dd.entity_type AND d.source_id = dd.entity_id\n" +
    `WHERE ${clauses.join(" AND ")}\n` +
    "GROUP BY d.type, d.source_id\n" +
    "ORDER BY downloads DESC, d.type DESC, d.source_id DESC\n" +
    "LIMIT ?";

  params.push(limit);

  const rows = await env.DB.prepare(sql).bind(...params).all();
  const items = (rows.results as Array<{ type: EntityType; source_id: string; title: string; install: string; downloads: number }>).map((row) => ({
    type: row.type,
    sourceId: row.source_id,
    title: row.title,
    install: row.install,
    downloads: row.downloads,
  }));

  return { period: period.label, items };
}
