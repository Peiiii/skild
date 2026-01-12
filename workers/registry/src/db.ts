import type { Env } from "./env.js";

export interface PublisherRow {
  id: string;
  handle: string;
  email: string;
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
    "SELECT id, handle, email, password_salt, password_hash, created_at FROM publishers WHERE handle = ?1 OR email = ?1 LIMIT 1",
  )
    .bind(value)
    .first<PublisherRow>();
  return result ?? null;
}

export async function getPublisherById(env: Env, id: string): Promise<PublisherRow | null> {
  const result = await env.DB.prepare(
    "SELECT id, handle, email, password_salt, password_hash, created_at FROM publishers WHERE id = ?1 LIMIT 1",
  )
    .bind(id)
    .first<PublisherRow>();
  return result ?? null;
}

export async function getTokenById(env: Env, id: string): Promise<TokenRow | null> {
  const result = await env.DB.prepare(
    "SELECT id, publisher_id, name, token_salt, token_hash, created_at, last_used_at FROM tokens WHERE id = ?1 LIMIT 1",
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

