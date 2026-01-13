import { Hono } from "hono";
import type { Env } from "./env.js";
import { newSalt, pbkdf2Sha256, randomToken, sha256Hex, timingSafeEqual } from "./crypto.js";
import type { PublisherRow } from "./db.js";
import { consumeEmailVerificationToken, getPublisherByHandleOrEmail, insertEmailVerificationToken, markPublisherEmailVerified } from "./db.js";
import { requirePublisherAuth, requireSessionAuth } from "./auth.js";
import { assertEmail, assertHandle, assertSemver, assertSkillName, assertSkillSegment } from "./validate.js";
import { getConsolePublicUrl, getEmailVerifyTtlHours, sendVerificationEmail } from "./email.js";
import { createSession, parseSessionCookies, revokeSession, serializeClearSessionCookie, serializeSessionCookie } from "./sessions.js";
import { issuePublishToken, listTokens, revokeToken } from "./tokens.js";
import { buildInstallCommand, createLinkedItem, getLinkedItemById, getPublisherHandleById, listLinkedItems, parseLinkedItemUrl, toLinkedItem } from "./linked-items.js";
import { listDiscoverItems, toDiscoverItem, upsertDiscoverItemForLinkedItem, upsertDiscoverItemForSkill } from "./discover-items.js";

const app = new Hono<{ Bindings: Env }>();

function errorJson(c: any, message: string, status = 400) {
  return c.json({ ok: false, error: message }, status);
}

function isRequireEmailVerificationForPublish(env: Env): boolean {
  const raw = (env.REQUIRE_EMAIL_VERIFICATION_FOR_PUBLISH ?? "true").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function isAllowedOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const protocol = url.protocol;
    const hostname = url.hostname;

    // Local dev
    if (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1")) {
      return origin;
    }

    if (protocol !== "https:") return null;

    // Production
    if (hostname === "skild.sh") return origin;
    if (hostname === "www.skild.sh") return origin;
    if (hostname === "console.skild.sh") return origin;

    // Cloudflare Pages (project domain + preview deployments)
    if (hostname === "skild-console.pages.dev") return origin;
    if (hostname.endsWith(".skild-console.pages.dev")) return origin;

    return null;
  } catch {
    return null;
  }
}

function getAllowedOriginFromRequest(c: any): string | null {
  const origin = c.req.header("origin");
  const allowedFromOrigin = isAllowedOrigin(origin);
  if (allowedFromOrigin) return allowedFromOrigin;

  const referer = c.req.header("referer");
  if (!referer) return null;
  try {
    const refOrigin = new URL(referer).origin;
    return isAllowedOrigin(refOrigin);
  } catch {
    return null;
  }
}

function getCookieRequestUrl(c: any): string {
  const parsed = new URL(c.req.url);
  const host = c.req.header("host") || parsed.host;
  const forwardedProto = (c.req.header("x-forwarded-proto") || "").trim();
  const protocol = (forwardedProto || parsed.protocol.replace(":", "") || "http").toLowerCase();
  return `${protocol}://${host}${parsed.pathname}`;
}

async function authenticateWithPassword(env: Env, handleOrEmail: string, password: string): Promise<PublisherRow | null> {
  const publisher = await getPublisherByHandleOrEmail(env, handleOrEmail);
  if (!publisher) return null;

  const iterations = Number.parseInt(env.PBKDF2_ITERATIONS || "100000", 10);
  const computed = await pbkdf2Sha256(password, publisher.password_salt, iterations);
  if (!timingSafeEqual(computed, publisher.password_hash)) return null;
  return publisher;
}

app.use("*", async (c, next) => {
  const origin = c.req.header("origin");
  const allowedOrigin = isAllowedOrigin(origin);

  if (allowedOrigin) {
    c.header("access-control-allow-origin", allowedOrigin);
    c.header("vary", "Origin");
    c.header("access-control-allow-credentials", "true");
  }

  if (c.req.method === "OPTIONS") {
    if (allowedOrigin) {
      c.header("access-control-allow-methods", "GET, POST, DELETE, OPTIONS");
      c.header("access-control-allow-headers", "content-type, authorization");
      c.header("access-control-max-age", "86400");
      c.header("access-control-allow-credentials", "true");
    }
    return c.body(null, 204);
  }

  const method = c.req.method.toUpperCase();
  const isWrite = method !== "GET" && method !== "HEAD";
  // CSRF protection for cookie-based session endpoints: require an allowed Origin/Referer when a session cookie is present.
  const cookieHeader = c.req.header("cookie") || "";
  const hasSessionCookie = cookieHeader.includes("skild_session=");
  if (isWrite && hasSessionCookie) {
    const allowed = getAllowedOriginFromRequest(c);
    if (!allowed) return errorJson(c as any, "Origin not allowed.", 403);
  } else if (isWrite && origin && !allowedOrigin) {
    return errorJson(c as any, "Origin not allowed.", 403);
  }

  await next();
});

app.get("/health", (c) => c.json({ ok: true }));

app.post("/auth/signup", async (c) => {
  try {
    const body = await c.req.json<{ email: string; handle: string; password: string }>();
    const email = body.email?.trim().toLowerCase();
    const handle = body.handle?.trim().toLowerCase();
    const password = body.password || "";
    if (!email || !handle || !password) return errorJson(c as any, "Missing email/handle/password.", 400);
    assertEmail(email);
    assertHandle(handle);

    const exists = await c.env.DB.prepare("SELECT 1 FROM publishers WHERE handle = ?1 OR email = ?2 LIMIT 1")
      .bind(handle, email)
      .first();
    if (exists) return errorJson(c as any, "Handle or email already exists.", 409);

    const publisherId = crypto.randomUUID();
    const salt = newSalt();
    const iterations = Number.parseInt(c.env.PBKDF2_ITERATIONS || "100000", 10);
    const hash = await pbkdf2Sha256(password, salt, iterations);
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      "INSERT INTO publishers (id, handle, email, password_salt, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
      .bind(publisherId, handle, email, salt, hash, now)
      .run();

    const session = await createSession(c.env, { publisherId });
    c.header(
      "set-cookie",
      serializeSessionCookie({
        value: `${session.sessionId}.${session.sessionSecret}`,
        expiresAt: new Date(session.expiresAt),
        requestUrl: getCookieRequestUrl(c),
      }),
    );

    const ttlHours = getEmailVerifyTtlHours(c.env);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    const verifyToken = randomToken(32);
    const tokenHash = await sha256Hex(new TextEncoder().encode(verifyToken).buffer);
    await insertEmailVerificationToken(c.env, { publisherId, tokenHash, expiresAt });

    const sent = await sendVerificationEmail(c.env, { toEmail: email, handle, token: verifyToken });
    const requireEmailVerification = isRequireEmailVerificationForPublish(c.env);

    return c.json({
      ok: true,
      publisher: { id: publisherId, handle, email, emailVerified: false },
      verification: {
        requiredForPublish: requireEmailVerification,
        sent: sent.dispatched,
        mode: sent.mode,
        consoleUrl: getConsolePublicUrl(c.env),
      },
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/auth/login", async (c) => {
  try {
    const body = await c.req.json<{ handleOrEmail: string; password: string; tokenName?: string }>();
    const handleOrEmail = body.handleOrEmail?.trim().toLowerCase();
    const password = body.password || "";
    if (!handleOrEmail || !password) return errorJson(c as any, "Missing credentials.", 400);

    const publisher = await authenticateWithPassword(c.env, handleOrEmail, password);
    if (!publisher) return errorJson(c as any, "Invalid credentials.", 401);

    const issued = await issuePublishToken(c.env, { publisherId: publisher.id, name: body.tokenName });

    return c.json({
      ok: true,
      token: issued.token,
      publisher: {
        id: publisher.id,
        handle: publisher.handle,
        email: publisher.email,
        emailVerified: Boolean(publisher.email_verified),
      },
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/auth/session/login", async (c) => {
  try {
    const body = await c.req.json<{ handleOrEmail: string; password: string }>();
    const handleOrEmail = body.handleOrEmail?.trim().toLowerCase();
    const password = body.password || "";
    if (!handleOrEmail || !password) return errorJson(c as any, "Missing credentials.", 400);

    const publisher = await authenticateWithPassword(c.env, handleOrEmail, password);
    if (!publisher) return errorJson(c as any, "Invalid credentials.", 401);

    const session = await createSession(c.env, { publisherId: publisher.id });
    c.header(
      "set-cookie",
      serializeSessionCookie({
        value: `${session.sessionId}.${session.sessionSecret}`,
        expiresAt: new Date(session.expiresAt),
        requestUrl: getCookieRequestUrl(c),
      }),
    );

    return c.json({
      ok: true,
      publisher: { id: publisher.id, handle: publisher.handle, email: publisher.email, emailVerified: Boolean(publisher.email_verified) },
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/auth/session/logout", async (c) => {
  try {
    const cookies = parseSessionCookies(c.req.header("cookie"));
    for (const parsed of cookies) {
      try {
        await revokeSession(c.env, parsed.sessionId);
      } catch {
        // ignore
      }
    }

    c.header("set-cookie", serializeClearSessionCookie(getCookieRequestUrl(c)));
    return c.json({ ok: true });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/auth/verify-email", async (c) => {
  try {
    const body = await c.req.json<{ token: string }>();
    const token = body.token?.trim();
    if (!token) return errorJson(c as any, "Missing token.", 400);
    const tokenHash = await sha256Hex(new TextEncoder().encode(token).buffer);

    const consumed = await consumeEmailVerificationToken(c.env, tokenHash);
    if (!consumed) return errorJson(c as any, "Invalid or expired token.", 400);

    await markPublisherEmailVerified(c.env, consumed.publisherId);

    const publisher = await c.env.DB.prepare("SELECT id, handle, email, email_verified, created_at FROM publishers WHERE id = ?1 LIMIT 1")
      .bind(consumed.publisherId)
      .first<{ id: string; handle: string; email: string; email_verified: number; created_at: string }>();

    return c.json({
      ok: true,
      publisher: publisher
        ? { id: publisher.id, handle: publisher.handle, email: publisher.email, emailVerified: Boolean(publisher.email_verified) }
        : null,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/auth/verify-email/request", async (c) => {
  try {
    const body = await c.req.json<{ handleOrEmail: string; password: string }>();
    const handleOrEmail = body.handleOrEmail?.trim().toLowerCase();
    const password = body.password || "";
    if (!handleOrEmail || !password) return errorJson(c as any, "Missing credentials.", 400);

    const publisher = await authenticateWithPassword(c.env, handleOrEmail, password);
    if (!publisher) return errorJson(c as any, "Invalid credentials.", 401);

    if (publisher.email_verified) {
      return c.json({ ok: true, alreadyVerified: true });
    }

    const ttlHours = getEmailVerifyTtlHours(c.env);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    const verifyToken = randomToken(32);
    const tokenHash = await sha256Hex(new TextEncoder().encode(verifyToken).buffer);
    await insertEmailVerificationToken(c.env, { publisherId: publisher.id, tokenHash, expiresAt });

    const sent = await sendVerificationEmail(c.env, { toEmail: publisher.email, handle: publisher.handle, token: verifyToken });
    return c.json({
      ok: true,
      sent: sent.dispatched,
      mode: sent.mode,
      consoleUrl: getConsolePublicUrl(c.env),
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/auth/me", async (c) => {
  try {
    const hasSession = parseSessionCookies(c.req.header("cookie")).length > 0;
    const hasBearer = Boolean((c.req.header("authorization") || "").trim());
    if (!hasSession && !hasBearer) {
      return c.json({ ok: true, publisher: null });
    }

    const auth = await requirePublisherAuth(c);
    const publisher = await c.env.DB.prepare("SELECT id, handle, email, email_verified, created_at FROM publishers WHERE id = ?1 LIMIT 1")
      .bind(auth.publisherId)
      .first<{ id: string; handle: string; email: string; email_verified: number; created_at: string }>();
    return c.json({
      ok: true,
      publisher: publisher
        ? { id: publisher.id, handle: publisher.handle, email: publisher.email, created_at: publisher.created_at, emailVerified: Boolean(publisher.email_verified) }
        : null,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 401);
  }
});

app.get("/tokens", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const tokens = await listTokens(c.env, auth.publisherId);
    return c.json({ ok: true, tokens });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 401);
  }
});

app.post("/tokens", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const body = await c.req.json<{ name?: string }>().catch(() => ({} as { name?: string }));
    const issued = await issuePublishToken(c.env, { publisherId: auth.publisherId, name: body.name });
    return c.json({
      ok: true,
      token: issued.token,
      tokenMeta: { id: issued.tokenId, name: issued.name, created_at: issued.createdAt, last_used_at: null, revoked_at: null },
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 401);
  }
});

app.delete("/tokens/:id", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const tokenId = c.req.param("id");
    if (!tokenId) return errorJson(c as any, "Missing token id.", 400);
    const revoked = await revokeToken(c.env, { publisherId: auth.publisherId, tokenId });
    return c.json({ ok: true, revoked });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 401);
  }
});

app.get("/publisher/skills", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const rows = await c.env.DB.prepare(
      "SELECT s.name, s.description, s.updated_at, COUNT(v.version) AS versionsCount\n" +
        "FROM skills s\n" +
        "LEFT JOIN skill_versions v ON v.skill_name = s.name\n" +
        "WHERE s.publisher_id = ?1\n" +
        "GROUP BY s.name\n" +
        "ORDER BY s.updated_at DESC\n" +
        "LIMIT 200",
    )
      .bind(auth.publisherId)
      .all();
    return c.json({ ok: true, skills: rows.results });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 401);
  }
});

app.get("/skills", async (c) => {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50", 10) || 50, 100);

  const sql = q
    ? "SELECT name, description, targets_json, created_at, updated_at FROM skills WHERE name LIKE ?1 OR description LIKE ?1 ORDER BY updated_at DESC LIMIT ?2"
    : "SELECT name, description, targets_json, created_at, updated_at FROM skills ORDER BY updated_at DESC LIMIT ?1";

  const stmt = q ? c.env.DB.prepare(sql).bind(`%${q}%`, limit) : c.env.DB.prepare(sql).bind(limit);
  const result = await stmt.all();
  return c.json({ ok: true, skills: result.results });
});

app.get("/linked-items", async (c) => {
  try {
    const q = (c.req.query("q") || "").trim();
    const limit = Number.parseInt(c.req.query("limit") || "20", 10) || 20;
    const cursor = (c.req.query("cursor") || "").trim() || null;
    const page = await listLinkedItems(c.env, { q, limit, cursor });
    const rows = page.rows;
    const publisherIds = Array.from(new Set(rows.map((r) => r.submitted_by_publisher_id)));
    const publisherMap = new Map<string, { id: string; handle: string }>();
    for (const id of publisherIds) {
      const p = await getPublisherHandleById(c.env, id);
      if (p) publisherMap.set(id, p);
    }
    return c.json({
      ok: true,
      items: rows.map((r) => {
        const item = toLinkedItem(r, publisherMap.get(r.submitted_by_publisher_id) ?? null);
        return { ...item, install: buildInstallCommand(item.source) };
      }),
      nextCursor: page.nextCursor,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/discover", async (c) => {
  try {
    const q = (c.req.query("q") || "").trim();
    const limit = Number.parseInt(c.req.query("limit") || "20", 10) || 20;
    const cursor = (c.req.query("cursor") || "").trim() || null;
    const page = await listDiscoverItems(c.env, { q, limit, cursor });
    return c.json({
      ok: true,
      items: page.rows.map((r) => toDiscoverItem(r)),
      nextCursor: page.nextCursor,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/linked-items/parse", async (c) => {
  try {
    const body = await c.req.json<{ url: string }>();
    const parsed = parseLinkedItemUrl(body.url);
    return c.json({ ok: true, ...parsed });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/linked-items/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const row = await getLinkedItemById(c.env, id);
    if (!row) return errorJson(c as any, "Not found.", 404);
    const submittedBy = await getPublisherHandleById(c.env, row.submitted_by_publisher_id);
    const item = toLinkedItem(row, submittedBy);
    return c.json({ ok: true, item, install: buildInstallCommand(item.source) });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/linked-items", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const body = await c.req.json<{
      source: { provider: "github"; repo?: string | null; path?: string | null; ref?: string | null; url?: string | null };
      title?: string | null;
      description?: string | null;
      license?: string | null;
      category?: string | null;
      tags?: unknown;
    }>();

    const row = await createLinkedItem(c.env, {
      submittedByPublisherId: auth.publisherId,
      source: body.source,
      title: body.title,
      description: body.description,
      license: body.license,
      category: body.category,
      tags: body.tags,
    });
    const submittedBy = await getPublisherHandleById(c.env, row.submitted_by_publisher_id);
    await upsertDiscoverItemForLinkedItem(c.env, {
      row,
      submittedByHandle: submittedBy?.handle ?? null,
    });
    const item = toLinkedItem(row, submittedBy);
    return c.json({ ok: true, item, install: buildInstallCommand(item.source) }, 201);
  } catch (e) {
    const status = e instanceof Error && typeof (e as any).status === "number" ? (e as any).status : 400;
    return errorJson(c as any, e instanceof Error ? e.message : String(e), status);
  }
});

app.get("/skills/:scope/:skill", async (c) => {
  try {
    const scope = decodeURIComponent(c.req.param("scope"));
    const skillSegment = decodeURIComponent(c.req.param("skill"));
    assertHandle(scope);
    assertSkillSegment(skillSegment);
    const name = `@${scope}/${skillSegment}`;

    const skill = await c.env.DB.prepare("SELECT name, description, targets_json, publisher_id, created_at, updated_at FROM skills WHERE name = ?1 LIMIT 1")
      .bind(name)
      .first();
    if (!skill) return errorJson(c as any, "Skill not found.", 404);

    const tags = await c.env.DB.prepare("SELECT tag, version, updated_at FROM dist_tags WHERE skill_name = ?1")
      .bind(name)
      .all();

    const versions = await c.env.DB.prepare(
      "SELECT version, integrity, artifact_key, published_at FROM skill_versions WHERE skill_name = ?1 ORDER BY published_at DESC LIMIT 50",
    )
      .bind(name)
      .all();

    return c.json({
      ok: true,
      skill,
      distTags: tags.results,
      versions: versions.results,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

async function resolveVersion(env: Env, name: string, versionOrTag: string) {
  const bySemver = await env.DB.prepare(
    "SELECT skill_name, version, integrity, artifact_key, published_at FROM skill_versions WHERE skill_name = ?1 AND version = ?2 LIMIT 1",
  )
    .bind(name, versionOrTag)
    .first<{ skill_name: string; version: string; integrity: string; artifact_key: string; published_at: string }>();
  if (bySemver) return bySemver;

  const tagRow = await env.DB.prepare("SELECT version FROM dist_tags WHERE skill_name = ?1 AND tag = ?2 LIMIT 1")
    .bind(name, versionOrTag)
    .first<{ version: string }>();
  if (!tagRow) return null;

  const resolved = await env.DB.prepare(
    "SELECT skill_name, version, integrity, artifact_key, published_at FROM skill_versions WHERE skill_name = ?1 AND version = ?2 LIMIT 1",
  )
    .bind(name, tagRow.version)
    .first<{ skill_name: string; version: string; integrity: string; artifact_key: string; published_at: string }>();
  return resolved ?? null;
}

app.get("/skills/:scope/:skill/versions/:version", async (c) => {
  try {
    const scope = decodeURIComponent(c.req.param("scope"));
    const skill = decodeURIComponent(c.req.param("skill"));
    const versionOrTag = decodeURIComponent(c.req.param("version"));
    assertHandle(scope);
    assertSkillSegment(skill);
    const name = `@${scope}/${skill}`;

    const resolved = await resolveVersion(c.env, name, versionOrTag);
    if (!resolved) return errorJson(c as any, "Version not found.", 404);

    return c.json({
      ok: true,
      name,
      version: resolved.version,
      integrity: resolved.integrity,
      tarballUrl: `/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}/versions/${encodeURIComponent(resolved.version)}/tarball`,
      publishedAt: resolved.published_at,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/skills/:scope/:skill/versions/:version/tarball", async (c) => {
  try {
    const scope = decodeURIComponent(c.req.param("scope"));
    const skill = decodeURIComponent(c.req.param("skill"));
    const versionOrTag = decodeURIComponent(c.req.param("version"));
    assertHandle(scope);
    assertSkillSegment(skill);
    const name = `@${scope}/${skill}`;

    const resolved = await resolveVersion(c.env, name, versionOrTag);
    if (!resolved) return errorJson(c as any, "Version not found.", 404);

    const obj = await c.env.BUCKET.get(resolved.artifact_key);
    if (!obj) return errorJson(c as any, "Artifact not found.", 404);

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("content-type", "application/gzip");
    headers.set("content-disposition", `attachment; filename="${name.replace("/", "__")}@${resolved.version}.tgz"`);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("etag", resolved.integrity);
    return new Response(obj.body, { headers });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/skills/:scope/:skill/publish", async (c) => {
  try {
    const scope = decodeURIComponent(c.req.param("scope"));
    const skill = decodeURIComponent(c.req.param("skill"));
    assertHandle(scope);
    assertSkillSegment(skill);
    const name = `@${scope}/${skill}`;
    assertSkillName(name);

    const auth = await requirePublisherAuth(c);
    const publisher = await c.env.DB.prepare("SELECT id, handle, email_verified FROM publishers WHERE id = ?1 LIMIT 1")
      .bind(auth.publisherId)
      .first<{ id: string; handle: string; email_verified: number }>();
    if (!publisher) return errorJson(c as any, "Invalid publisher.", 401);

    if (scope !== publisher.handle) return errorJson(c as any, "Scope is not owned by this publisher.", 403);

    const requireEmailVerification = isRequireEmailVerificationForPublish(c.env);
    const warnings: string[] = [];

    if (!publisher.email_verified && requireEmailVerification) {
      const consoleUrl = getConsolePublicUrl(c.env);
      return errorJson(
        c as any,
        `Email not verified. Verify your email in the Publisher Console first: ${consoleUrl}/verify-email/request`,
        403,
      );
    }
    if (!publisher.email_verified && !requireEmailVerification) {
      warnings.push(
        "Email not verified. Publishing is temporarily allowed, but verification may be required in the future.",
      );
    }

    const form = await c.req.formData();
    const version = String(form.get("version") || "").trim();
    const description = String(form.get("description") || "").trim().slice(0, 500);
    const targetsJson = String(form.get("targets") || "[]");
    const tag = String(form.get("tag") || "latest").trim() || "latest";
    const file = form.get("tarball");
    if (!version || !file || !(file instanceof File)) return errorJson(c as any, "Missing version or tarball.", 400);
    assertSemver(version);

    const bytes = await file.arrayBuffer();
    const integrity = await sha256Hex(bytes);
    const artifactKey = `sha256/${integrity}.tgz`;

    const existingSkill = await c.env.DB.prepare("SELECT publisher_id, created_at FROM skills WHERE name = ?1 LIMIT 1")
      .bind(name)
      .first<{ publisher_id: string; created_at: string }>();
    if (existingSkill && existingSkill.publisher_id !== publisher.id) return errorJson(c as any, "Skill name is owned by another publisher.", 403);

    const existingVersion = await c.env.DB.prepare(
      "SELECT 1 FROM skill_versions WHERE skill_name = ?1 AND version = ?2 LIMIT 1",
    )
      .bind(name, version)
      .first();
    if (existingVersion) return errorJson(c as any, "Version already exists.", 409);

    const head = await c.env.BUCKET.head(artifactKey);
    if (!head) {
      await c.env.BUCKET.put(artifactKey, bytes, {
        httpMetadata: {
          contentType: "application/gzip",
          cacheControl: "public, max-age=31536000, immutable",
        },
      });
    }

    const now = new Date().toISOString();
    const batch = [
      c.env.DB.prepare(
        "INSERT INTO skills (name, publisher_id, description, targets_json, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)\n" +
          "ON CONFLICT(name) DO UPDATE SET description = excluded.description, targets_json = excluded.targets_json, updated_at = excluded.updated_at",
      ).bind(name, publisher.id, description, targetsJson, now, now),
      c.env.DB.prepare(
        "INSERT INTO skill_versions (skill_name, version, integrity, artifact_key, published_at, publisher_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
      ).bind(name, version, integrity, artifactKey, now, publisher.id),
      c.env.DB.prepare(
        "INSERT INTO dist_tags (skill_name, tag, version, updated_at) VALUES (?1, ?2, ?3, ?4)\n" +
          "ON CONFLICT(skill_name, tag) DO UPDATE SET version = excluded.version, updated_at = excluded.updated_at",
      ).bind(name, tag, version, now),
    ];
    await c.env.DB.batch(batch);
    await upsertDiscoverItemForSkill(c.env, {
      name,
      description,
      publisherHandle: publisher.handle,
      createdAt: existingSkill?.created_at ?? now,
      updatedAt: now,
    });

    return c.json({
      ok: true,
      name,
      version,
      integrity,
      tag,
      publisherEmailVerified: Boolean(publisher.email_verified),
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (e) {
    const status = e instanceof Error && c.res.status ? c.res.status : 400;
    return errorJson(c as any, e instanceof Error ? e.message : String(e), status);
  }
});

export default app;
