import type { Env } from "./env.js";
import { newSalt, pbkdf2Sha256, randomToken, timingSafeEqual } from "./crypto.js";

export interface SessionRow {
  id: string;
  publisher_id: string;
  session_salt: string;
  session_hash: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
}

export interface CreatedSession {
  sessionId: string;
  sessionSecret: string;
  expiresAt: string;
}

function getIterations(env: Env): number {
  return Number.parseInt(env.PBKDF2_ITERATIONS || "100000", 10);
}

function getSessionTtlMs(): number {
  return 30 * 24 * 60 * 60 * 1000;
}

export function parseSessionCookies(cookieHeader: string | null | undefined): Array<{ sessionId: string; sessionSecret: string }> {
  if (!cookieHeader) return [];
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const out: Array<{ sessionId: string; sessionSecret: string }> = [];
  for (const part of parts) {
    if (!part.startsWith("skild_session=")) continue;
    const raw = part.slice("skild_session=".length).trim();
    if (!raw) continue;
    const [sessionId, sessionSecret] = raw.split(".", 2);
    if (!sessionId || !sessionSecret) continue;
    out.push({ sessionId, sessionSecret });
  }
  return out;
}

export function parseSessionCookie(cookieHeader: string | null | undefined): { sessionId: string; sessionSecret: string } | null {
  const cookies = parseSessionCookies(cookieHeader);
  return cookies.length ? cookies[cookies.length - 1] : null;
}

export function serializeSessionCookie(input: { value: string; expiresAt: Date; requestUrl: string }): string {
  const url = new URL(input.requestUrl);
  const isHttps = url.protocol === "https:";

  const attrs: string[] = [];
  attrs.push(`skild_session=${input.value}`);
  attrs.push("Path=/");
  attrs.push("HttpOnly");
  // Dev (http): Lax is enough. Prod (https): None enables cookie on cross-site XHR (e.g. Pages preview domains).
  attrs.push(`SameSite=${isHttps ? "None" : "Lax"}`);
  if (isHttps) attrs.push("Secure");
  attrs.push(`Expires=${input.expiresAt.toUTCString()}`);
  return attrs.join("; ");
}

export function serializeClearSessionCookie(requestUrl: string): string {
  return serializeSessionCookie({ value: "", expiresAt: new Date(0), requestUrl });
}

export async function createSession(env: Env, input: { publisherId: string }): Promise<CreatedSession> {
  const sessionId = crypto.randomUUID();
  const sessionSecret = randomToken(32);
  const sessionSalt = newSalt();
  const iterations = getIterations(env);
  const sessionHash = await pbkdf2Sha256(sessionSecret, sessionSalt, iterations);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + getSessionTtlMs()).toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions (id, publisher_id, session_salt, session_hash, created_at, expires_at, last_seen_at, revoked_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, NULL)",
  )
    .bind(sessionId, input.publisherId, sessionSalt, sessionHash, createdAt, expiresAt)
    .run();

  return { sessionId, sessionSecret, expiresAt };
}

export async function getSessionById(env: Env, sessionId: string): Promise<SessionRow | null> {
  const row = await env.DB.prepare(
    "SELECT id, publisher_id, session_salt, session_hash, created_at, expires_at, last_seen_at, revoked_at FROM sessions WHERE id = ?1 LIMIT 1",
  )
    .bind(sessionId)
    .first<SessionRow>();
  return row ?? null;
}

export async function touchSession(env: Env, sessionId: string): Promise<void> {
  await env.DB.prepare("UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2")
    .bind(new Date().toISOString(), sessionId)
    .run();
}

export async function revokeSession(env: Env, sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE sessions SET revoked_at = ?1 WHERE id = ?2 AND revoked_at IS NULL")
    .bind(now, sessionId)
    .run();
}

export async function verifySessionSecret(env: Env, input: { session: SessionRow; sessionSecret: string }): Promise<boolean> {
  if (input.session.revoked_at) return false;
  if (input.session.expires_at <= new Date().toISOString()) return false;
  const iterations = getIterations(env);
  const computed = await pbkdf2Sha256(input.sessionSecret, input.session.session_salt, iterations);
  return timingSafeEqual(computed, input.session.session_hash);
}
