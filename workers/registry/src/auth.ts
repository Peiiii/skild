import type { Context } from "hono";
import type { Env } from "./env.js";
import { getPublisherById, getTokenById, touchToken } from "./db.js";
import { pbkdf2Sha256, timingSafeEqual } from "./crypto.js";

export interface AuthContext {
  publisherId: string;
  tokenId: string;
}

export async function requireAuth(c: Context<{ Bindings: Env }>): Promise<AuthContext> {
  const header = c.req.header("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    c.status(401);
    throw new Error("Missing Authorization header.");
  }

  const raw = match[1].trim();
  const [tokenId, tokenSecret] = raw.split(".", 2);
  if (!tokenId || !tokenSecret) {
    c.status(401);
    throw new Error("Invalid token format.");
  }

  const tokenRow = await getTokenById(c.env, tokenId);
  if (!tokenRow) {
    c.status(401);
    throw new Error("Invalid token.");
  }

  const iterations = Number.parseInt(c.env.PBKDF2_ITERATIONS || "100000", 10);
  const expected = await pbkdf2Sha256(tokenSecret, tokenRow.token_salt, iterations);
  if (!timingSafeEqual(expected, tokenRow.token_hash)) {
    c.status(401);
    throw new Error("Invalid token.");
  }

  const publisher = await getPublisherById(c.env, tokenRow.publisher_id);
  if (!publisher) {
    c.status(401);
    throw new Error("Invalid token.");
  }

  await touchToken(c.env, tokenId);
  return { publisherId: publisher.id, tokenId };
}
