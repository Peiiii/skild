import type { Context } from "hono";
import type { Env } from "./env.js";
import { getPublisherById, getTokenById, touchToken } from "./db.js";
import { pbkdf2Sha256, timingSafeEqual } from "./crypto.js";
import { getSessionById, parseSessionCookie, touchSession, verifySessionSecret } from "./sessions.js";

export interface AuthContext {
  publisherId: string;
  tokenId: string;
}

async function requireTokenAuth(c: Context<{ Bindings: Env }>): Promise<AuthContext> {
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
  if (tokenRow.revoked_at) {
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

export async function requirePublisherAuth(
  c: Context<{ Bindings: Env }>,
): Promise<{ publisherId: string; via: "session" | "token" }> {
  const sessionCookie = parseSessionCookie(c.req.header("cookie"));
  if (sessionCookie) {
    const session = await getSessionById(c.env, sessionCookie.sessionId);
    if (!session) {
      c.status(401);
      throw new Error("Invalid session.");
    }
    const ok = await verifySessionSecret(c.env, { session, sessionSecret: sessionCookie.sessionSecret });
    if (!ok) {
      c.status(401);
      throw new Error("Invalid session.");
    }
    const publisher = await getPublisherById(c.env, session.publisher_id);
    if (!publisher) {
      c.status(401);
      throw new Error("Invalid session.");
    }
    await touchSession(c.env, session.id);
    return { publisherId: publisher.id, via: "session" };
  }

  const tokenAuth = await requireTokenAuth(c);
  return { publisherId: tokenAuth.publisherId, via: "token" };
}

export async function requireSessionAuth(c: Context<{ Bindings: Env }>): Promise<{ publisherId: string }> {
  const sessionCookie = parseSessionCookie(c.req.header("cookie"));
  if (!sessionCookie) {
    c.status(401);
    throw new Error("Missing session.");
  }

  const session = await getSessionById(c.env, sessionCookie.sessionId);
  if (!session) {
    c.status(401);
    throw new Error("Invalid session.");
  }

  const ok = await verifySessionSecret(c.env, { session, sessionSecret: sessionCookie.sessionSecret });
  if (!ok) {
    c.status(401);
    throw new Error("Invalid session.");
  }

  const publisher = await getPublisherById(c.env, session.publisher_id);
  if (!publisher) {
    c.status(401);
    throw new Error("Invalid session.");
  }

  await touchSession(c.env, session.id);
  return { publisherId: publisher.id };
}
