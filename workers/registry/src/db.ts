import type { Env } from "./env.js";

export interface PublisherRow {
  id: string;
  handle: string;
  email: string;
  email_verified: number;
  email_verified_at: string | null;
  password_salt: string;
  password_hash: string;
  created_at: string;
}

export interface TokenRow {
  id: string;
  publisher_id: string;
  name: string;
  token_salt: string;
  token_hash: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface EmailVerificationTokenRow {
  id: string;
  publisher_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
}

export interface SkillRow {
  name: string;
  publisher_id: string;
  description: string;
  targets_json: string;
  created_at: string;
  updated_at: string;
}

export interface SkillVersionRow {
  skill_name: string;
  version: string;
  integrity: string;
  artifact_key: string;
  published_at: string;
  publisher_id: string;
}

export interface DistTagRow {
  skill_name: string;
  tag: string;
  version: string;
  updated_at: string;
}

export async function getPublisherByHandleOrEmail(env: Env, value: string): Promise<PublisherRow | null> {
  const result = await env.DB.prepare(
    "SELECT id, handle, email, email_verified, email_verified_at, password_salt, password_hash, created_at FROM publishers WHERE handle = ?1 OR email = ?1 LIMIT 1",
  )
    .bind(value)
    .first<PublisherRow>();
  return result ?? null;
}

export async function getPublisherById(env: Env, id: string): Promise<PublisherRow | null> {
  const result = await env.DB.prepare(
    "SELECT id, handle, email, email_verified, email_verified_at, password_salt, password_hash, created_at FROM publishers WHERE id = ?1 LIMIT 1",
  )
    .bind(id)
    .first<PublisherRow>();
  return result ?? null;
}

export async function getTokenById(env: Env, id: string): Promise<TokenRow | null> {
  const result = await env.DB.prepare(
    "SELECT id, publisher_id, name, token_salt, token_hash, created_at, last_used_at, revoked_at FROM tokens WHERE id = ?1 LIMIT 1",
  )
    .bind(id)
    .first<TokenRow>();
  return result ?? null;
}

export async function touchToken(env: Env, id: string): Promise<void> {
  await env.DB.prepare("UPDATE tokens SET last_used_at = ?1 WHERE id = ?2")
    .bind(new Date().toISOString(), id)
    .run();
}

export async function insertEmailVerificationToken(
  env: Env,
  input: { publisherId: string; tokenHash: string; expiresAt: string },
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO email_verification_tokens (id, publisher_id, token_hash, created_at, expires_at, consumed_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
  )
    .bind(id, input.publisherId, input.tokenHash, now, input.expiresAt)
    .run();
}

export async function consumeEmailVerificationToken(
  env: Env,
  tokenHash: string,
): Promise<{ publisherId: string } | null> {
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    "SELECT publisher_id, expires_at, consumed_at FROM email_verification_tokens WHERE token_hash = ?1 LIMIT 1",
  )
    .bind(tokenHash)
    .first<{ publisher_id: string; expires_at: string; consumed_at: string | null }>();
  if (!row) return null;
  if (row.consumed_at) return null;
  if (row.expires_at <= now) return null;

  await env.DB.prepare("UPDATE email_verification_tokens SET consumed_at = ?1 WHERE token_hash = ?2 AND consumed_at IS NULL")
    .bind(now, tokenHash)
    .run();
  return { publisherId: row.publisher_id };
}

export async function markPublisherEmailVerified(env: Env, publisherId: string): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE publishers SET email_verified = 1, email_verified_at = ?1 WHERE id = ?2")
    .bind(now, publisherId)
    .run();
}
