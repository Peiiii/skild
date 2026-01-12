import { Hono } from "hono";
import type { Env } from "./env.js";
import { newSalt, pbkdf2Sha256, randomToken, sha256Hex, timingSafeEqual } from "./crypto.js";
import { consumeEmailVerificationToken, getPublisherByHandleOrEmail, insertEmailVerificationToken, markPublisherEmailVerified } from "./db.js";
import { requireAuth } from "./auth.js";
import { assertEmail, assertHandle, assertSemver, assertSkillName, assertSkillSegment } from "./validate.js";
import { getConsolePublicUrl, getEmailVerifyTtlHours, sendVerificationEmail } from "./email.js";

const app = new Hono<{ Bindings: Env }>();

function errorJson(c: any, message: string, status = 400) {
  return c.json({ ok: false, error: message }, status);
}

function isAllowedOrigin(origin: string | null | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const protocol = url.protocol;
    const hostname = url.hostname;
    const port = url.port;

    // Local dev
    if (protocol === "http:" && port === "5173" && (hostname === "localhost" || hostname === "127.0.0.1")) {
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

app.use("*", async (c, next) => {
  const origin = c.req.header("origin");
  const allowedOrigin = isAllowedOrigin(origin);

  if (allowedOrigin) {
    c.header("access-control-allow-origin", allowedOrigin);
    c.header("vary", "Origin");
  }

  if (c.req.method === "OPTIONS") {
    if (allowedOrigin) {
      c.header("access-control-allow-methods", "GET, POST, OPTIONS");
      c.header("access-control-allow-headers", "content-type, authorization");
      c.header("access-control-max-age", "86400");
    }
    return c.body(null, 204);
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

    const ttlHours = getEmailVerifyTtlHours(c.env);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    const verifyToken = randomToken(32);
    const tokenHash = await sha256Hex(new TextEncoder().encode(verifyToken).buffer);
    await insertEmailVerificationToken(c.env, { publisherId, tokenHash, expiresAt });

    const sent = await sendVerificationEmail(c.env, { toEmail: email, handle, token: verifyToken });

    return c.json({
      ok: true,
      publisher: { id: publisherId, handle, email, emailVerified: false },
      verification: {
        requiredForPublish: true,
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

    const publisher = await getPublisherByHandleOrEmail(c.env, handleOrEmail);
    if (!publisher) return errorJson(c as any, "Invalid credentials.", 401);

    const iterations = Number.parseInt(c.env.PBKDF2_ITERATIONS || "100000", 10);
    const computed = await pbkdf2Sha256(password, publisher.password_salt, iterations);
    if (!timingSafeEqual(computed, publisher.password_hash)) {
      return errorJson(c as any, "Invalid credentials.", 401);
    }

    const tokenId = crypto.randomUUID();
    const tokenSecret = randomToken(32);
    const tokenSalt = newSalt();
    const tokenHash = await pbkdf2Sha256(tokenSecret, tokenSalt, iterations);
    const now = new Date().toISOString();
    const tokenName = (body.tokenName || "default").slice(0, 64);

    await c.env.DB.prepare(
      "INSERT INTO tokens (id, publisher_id, name, token_salt, token_hash, created_at, last_used_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL)",
    )
      .bind(tokenId, publisher.id, tokenName, tokenSalt, tokenHash, now)
      .run();

    return c.json({
      ok: true,
      token: `${tokenId}.${tokenSecret}`,
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

    const publisher = await getPublisherByHandleOrEmail(c.env, handleOrEmail);
    if (!publisher) return errorJson(c as any, "Invalid credentials.", 401);

    const iterations = Number.parseInt(c.env.PBKDF2_ITERATIONS || "100000", 10);
    const computed = await pbkdf2Sha256(password, publisher.password_salt, iterations);
    if (!timingSafeEqual(computed, publisher.password_hash)) {
      return errorJson(c as any, "Invalid credentials.", 401);
    }

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
    const auth = await requireAuth(c);
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

    const auth = await requireAuth(c);
    const publisher = await c.env.DB.prepare("SELECT id, handle, email_verified FROM publishers WHERE id = ?1 LIMIT 1")
      .bind(auth.publisherId)
      .first<{ id: string; handle: string; email_verified: number }>();
    if (!publisher) return errorJson(c as any, "Invalid publisher.", 401);

    if (scope !== publisher.handle) return errorJson(c as any, "Scope is not owned by this publisher.", 403);

    if (!publisher.email_verified) {
      const consoleUrl = getConsolePublicUrl(c.env);
      return errorJson(
        c as any,
        `Email not verified. Verify your email in the Publisher Console first: ${consoleUrl}/verify-email/request`,
        403,
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

    const existingSkill = await c.env.DB.prepare("SELECT publisher_id FROM skills WHERE name = ?1 LIMIT 1").bind(name).first<{ publisher_id: string }>();
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

    return c.json({
      ok: true,
      name,
      version,
      integrity,
      tag,
    });
  } catch (e) {
    const status = e instanceof Error && c.res.status ? c.res.status : 400;
    return errorJson(c as any, e instanceof Error ? e.message : String(e), status);
  }
});

export default app;
