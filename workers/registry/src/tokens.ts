import type { Env } from "./env.js";
import { newSalt, pbkdf2Sha256, randomToken } from "./crypto.js";

export interface IssuedToken {
  token: string;
  tokenId: string;
  name: string;
  createdAt: string;
}

function getIterations(env: Env): number {
  return Number.parseInt(env.PBKDF2_ITERATIONS || "100000", 10);
}

export async function issuePublishToken(env: Env, input: { publisherId: string; name?: string }): Promise<IssuedToken> {
  const tokenId = crypto.randomUUID();
  const tokenSecret = randomToken(32);
  const tokenSalt = newSalt();
  const iterations = getIterations(env);
  const tokenHash = await pbkdf2Sha256(tokenSecret, tokenSalt, iterations);
  const createdAt = new Date().toISOString();
  const name = (input.name || "default").trim().slice(0, 64) || "default";

  await env.DB.prepare(
    "INSERT INTO tokens (id, publisher_id, name, token_salt, token_hash, created_at, last_used_at, revoked_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, NULL)",
  )
    .bind(tokenId, input.publisherId, name, tokenSalt, tokenHash, createdAt)
    .run();

  return { token: `${tokenId}.${tokenSecret}`, tokenId, name, createdAt };
}

export async function listTokens(
  env: Env,
  publisherId: string,
): Promise<Array<{ id: string; name: string; created_at: string; last_used_at: string | null; revoked_at: string | null }>> {
  const result = await env.DB.prepare(
    "SELECT id, name, created_at, last_used_at, revoked_at FROM tokens WHERE publisher_id = ?1 ORDER BY created_at DESC LIMIT 200",
  )
    .bind(publisherId)
    .all();
  return result.results as Array<{ id: string; name: string; created_at: string; last_used_at: string | null; revoked_at: string | null }>;
}

export async function revokeToken(env: Env, input: { publisherId: string; tokenId: string }): Promise<boolean> {
  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    "UPDATE tokens SET revoked_at = ?1 WHERE id = ?2 AND publisher_id = ?3 AND revoked_at IS NULL",
  )
    .bind(now, input.tokenId, input.publisherId)
    .run();
  return (res.meta.changes || 0) > 0;
}

