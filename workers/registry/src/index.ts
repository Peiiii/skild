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
import { buildLinkedInstall, listDiscoverItems, toDiscoverItem, upsertDiscoverItemForLinkedItem, upsertDiscoverItemForSkill } from "./discover-items.js";
import { getDownloadStats, getLeaderboard, recordDownloadEvent } from "./stats.js";
import { refreshRepoMetrics } from "./github-metrics.js";
import { discoverGithubSkills } from "./github-discovery.js";
import { discoverAwesomeSkills } from "./awesome-discovery.js";
import { requireAdmin } from "./admin.js";
import { getCatalogRepo, getCatalogSkillById, listCatalogCategories, listCatalogRepoSkills, listCatalogSkills, toCatalogRepo, toCatalogSkill, toCatalogSkillDetail } from "./catalog-db.js";
import { readCatalogSnapshot } from "./catalog-storage.js";
import { ingestCatalogIndexPart, scanCatalogIndexBatch, scanCatalogRepo } from "./catalog-scan.js";
import { tagCatalogSkillCategories } from "./catalog-category-ai.js";

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
    if (hostname === "hub.skild.sh") return origin;

    // Cloudflare Pages (project domain + preview deployments)
    if (hostname === "skild-console.pages.dev") return origin;
    if (hostname.endsWith(".skild-console.pages.dev")) return origin;

    return null;
  } catch {
    return null;
  }
}

async function listDiscoverRepos(env: Env, limit: number, offset: number): Promise<string[]> {
  const rows = await env.DB.prepare(
    "SELECT DISTINCT source_repo FROM discover_items WHERE source_repo IS NOT NULL ORDER BY source_repo LIMIT ?1 OFFSET ?2",
  )
    .bind(limit, offset)
    .all();
  const results = (rows.results as Array<{ source_repo: string | null }>).map((r) => r.source_repo).filter(Boolean) as string[];
  return results;
}

function parseOptionalBoolean(input: string | null | undefined): boolean | null {
  if (input == null) return null;
  const raw = String(input).trim().toLowerCase();
  if (!raw) return null;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return null;
}

function normalizeAlias(input: string): string {
  return input.trim().toLowerCase();
}

function assertAlias(alias: string): void {
  const a = normalizeAlias(alias);
  if (!a) throw new Error("Missing alias.");
  if (a.length < 3 || a.length > 64) throw new Error("Alias length must be between 3 and 64.");
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(a)) {
    throw new Error("Invalid alias format. Use lowercase letters, numbers, and hyphens.");
  }
  if (a.includes("--")) throw new Error("Invalid alias format: consecutive hyphens are not allowed.");
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
      "SELECT s.id, s.name, s.description, s.updated_at, s.skillset, s.alias, COUNT(v.version) AS versionsCount\n" +
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

app.get("/publisher/linked-items", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const rows = await c.env.DB.prepare("SELECT * FROM linked_items WHERE submitted_by_publisher_id = ?1 ORDER BY created_at DESC LIMIT 200")
      .bind(auth.publisherId)
      .all();
    const publisher = await getPublisherHandleById(c.env, auth.publisherId);
    return c.json({
      ok: true,
      items: (rows.results as any[]).map((r) => {
        const item = toLinkedItem(r as any, publisher);
        return { ...item, install: buildInstallCommand(item.source) };
      }),
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 401);
  }
});

// Deprecated list endpoint: use /discover for registry + linked listings.
app.get("/skills", async (c) => {
  const q = (c.req.query("q") || "").trim().toLowerCase();
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50", 10) || 50, 100);

  const sql = q
    ? "SELECT id, name, description, targets_json, skillset, alias, created_at, updated_at FROM skills WHERE name LIKE ?1 OR description LIKE ?1 OR alias LIKE ?1 ORDER BY updated_at DESC LIMIT ?2"
    : "SELECT id, name, description, targets_json, skillset, alias, created_at, updated_at FROM skills ORDER BY updated_at DESC LIMIT ?1";

  const stmt = q ? c.env.DB.prepare(sql).bind(`%${q}%`, limit) : c.env.DB.prepare(sql).bind(limit);
  const result = await stmt.all();
  return c.json({ ok: true, skills: result.results, deprecated: true, replacement: "/discover" });
});

app.get("/resolve", async (c) => {
  try {
    const raw = String(c.req.query("alias") || "").trim();
    if (!raw) return errorJson(c as any, "Missing alias.", 400);
    const alias = normalizeAlias(raw);
    assertAlias(alias);

    const skillRow = await c.env.DB.prepare("SELECT name, alias FROM skills WHERE alias = ?1 LIMIT 1")
      .bind(alias)
      .first<{ name: string; alias: string }>();
    if (skillRow) {
      return c.json({
        ok: true,
        alias: skillRow.alias,
        type: "registry",
        spec: skillRow.name,
        install: `skild install ${skillRow.name}`,
      });
    }

    const linkedRow = await c.env.DB.prepare(
      "SELECT id, alias, source_repo, source_path, source_ref, source_url FROM linked_items WHERE alias = ?1 LIMIT 1",
    )
      .bind(alias)
      .first<{ id: string; alias: string; source_repo: string; source_path: string | null; source_ref: string | null; source_url: string | null }>();
    if (linkedRow) {
      const install = buildInstallCommand({
        provider: "github",
        repo: linkedRow.source_repo,
        path: linkedRow.source_path,
        ref: linkedRow.source_ref,
        url: linkedRow.source_url,
      });
      return c.json({
        ok: true,
        alias: linkedRow.alias,
        type: "linked",
        id: linkedRow.id,
        spec: install.replace(/^skild install\s+/, ""),
        install,
      });
    }

    return errorJson(c as any, "Alias not found.", 404);

  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
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
    const rawCursor = (c.req.query("cursor") || "").trim() || null;
    const cursor = rawCursor;
    const sort = (c.req.query("sort") || "").trim() || null;
    const skillset = parseOptionalBoolean(c.req.query("skillset"));
    const category = (c.req.query("category") || "").trim() || null;
    const page = await listDiscoverItems(c.env, { q, limit, cursor, sort, skillset, category });
    return c.json({
      ok: true,
      items: page.rows.map((r) => toDiscoverItem(r)),
      nextCursor: page.nextCursor,
      cursor: rawCursor,
      total: page.total,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/catalog/skills", async (c) => {
  try {
    const q = (c.req.query("q") || "").trim();
    const limit = Number.parseInt(c.req.query("limit") || "20", 10) || 20;
    const cursor = (c.req.query("cursor") || "").trim() || null;
    const sort = (c.req.query("sort") || "").trim() || null;
    const risk = parseOptionalBoolean(c.req.query("risk"));
    const installable = parseOptionalBoolean(c.req.query("installable"));
    const usageArtifact = parseOptionalBoolean(c.req.query("usage"));
    const repo = (c.req.query("repo") || "").trim() || null;
    const sourceType = (c.req.query("source") || "").trim() || null;
    const category = (c.req.query("category") || "").trim() || null;

    const page = await listCatalogSkills(c.env, {
      q,
      limit,
      cursor,
      sort,
      risk,
      installable,
      usageArtifact,
      repo,
      sourceType,
      category,
    });

    return c.json({
      ok: true,
      items: page.rows.map(toCatalogSkill),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/catalog/categories", async (c) => {
  try {
    const items = await listCatalogCategories(c.env);
    return c.json({
      ok: true,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        total: item.total,
        installableTotal: item.installableTotal,
        riskTotal: item.riskTotal,
      })),
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/catalog/skills/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const row = await getCatalogSkillById(c.env, id);
    if (!row) return errorJson(c as any, "Not found.", 404);
    const repoRow = await getCatalogRepo(c.env, row.repo);
    const detail = toCatalogSkillDetail(row, repoRow);
    const snapshot = await readCatalogSnapshot(c.env, detail.snapshotKey);
    return c.json({ ok: true, ...detail, snapshot });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/catalog/repos/:owner/:name", async (c) => {
  try {
    const owner = decodeURIComponent(c.req.param("owner"));
    const name = decodeURIComponent(c.req.param("name"));
    const repo = `${owner}/${name}`;
    const repoRow = await getCatalogRepo(c.env, repo);
    if (!repoRow) return errorJson(c as any, "Not found.", 404);
    const skills = await listCatalogRepoSkills(c.env, repo, 200);
    return c.json({
      ok: true,
      repo: toCatalogRepo(repoRow),
      skills: skills.map(toCatalogSkill),
    });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/refresh-repo-metrics", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ limit?: number; offset?: number }>().catch(() => ({}))) as {
      limit?: number;
      offset?: number;
    };
    const limit = Math.min(Math.max(body.limit ?? 50, 1), 500);
    const offset = Math.max(body.offset ?? 0, 0);
    const repos = await listDiscoverRepos(c.env, limit, offset);
    const result = await refreshRepoMetrics(c.env, repos);
    return c.json({ ok: true, repos: repos.length, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/catalog/scan-index", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ batchSize?: number }>().catch(() => ({}))) as { batchSize?: number };
    const result = await scanCatalogIndexBatch(c.env, { batchSize: body.batchSize });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/catalog/reset-scan", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ scope?: string }>().catch(() => ({}))) as { scope?: string };
    const scope = (body.scope || "all").trim().toLowerCase();
    const resetRepos = scope === "all" || scope === "repos";
    const resetIndex = scope === "all" || scope === "index";

    let reposCleared = 0;
    let indexCleared = 0;
    if (resetRepos) {
      const result = await c.env.DB.prepare("DELETE FROM catalog_repo_scan_state WHERE id LIKE 'repo:%'").run();
      reposCleared = Number(result.meta?.changes ?? 0);
    }
    if (resetIndex) {
      const result = await c.env.DB.prepare("DELETE FROM catalog_repo_scan_state WHERE id = 'github-index'").run();
      indexCleared = Number(result.meta?.changes ?? 0);
    }

    return c.json({ ok: true, scope, reposCleared, indexCleared });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/catalog/scan-repo", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ repo?: string; maxSkills?: number }>().catch(() => ({}))) as {
      repo?: string;
      maxSkills?: number;
    };
    const repo = (body.repo || "").trim();
    if (!repo) return errorJson(c as any, "Missing repo.", 400);
    const result = await scanCatalogRepo(c.env, repo, { maxSkills: body.maxSkills });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/catalog/tag-categories", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ limit?: number; delayMs?: number; force?: boolean; repo?: string; skillId?: string; category?: string }>().catch(() => ({}))) as {
      limit?: number;
      delayMs?: number;
      force?: boolean;
      repo?: string;
      skillId?: string;
      category?: string;
    };
    const result = await tagCatalogSkillCategories(c.env, {
      limit: body.limit,
      delayMs: body.delayMs,
      force: body.force,
      repo: body.repo,
      skillId: body.skillId,
      category: body.category,
    });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/catalog/index", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ date?: string; part?: string; repos?: Array<Record<string, unknown>> }>().catch(() => ({}))) as {
      date?: string;
      part?: string;
      repos?: Array<Record<string, unknown>>;
    };
    const date = (body.date || "").trim();
    const part = (body.part || "").trim();
    if (!date) return errorJson(c as any, "Missing date.", 400);
    const result = await ingestCatalogIndexPart(c.env, {
      date,
      part: part || "part-0001.json",
      repos: (body.repos ?? []) as any,
    });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/discover-github-skills", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ q?: string; pages?: number; perPage?: number }>().catch(() => ({}))) as {
      q?: string;
      pages?: number;
      perPage?: number;
    };
    const result = await discoverGithubSkills(c.env, {
      q: body.q,
      pages: body.pages,
      perPage: body.perPage,
    });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/admin/discover-awesome-skills", async (c) => {
  try {
    requireAdmin(c);
    const body = (await c.req.json<{ repos?: string[] }>().catch(() => ({}))) as { repos?: string[] };
    const result = await discoverAwesomeSkills(c.env, { repos: body.repos });
    return c.json({ ok: true, ...result });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.post("/stats/downloads", async (c) => {
  try {
    const body = await c.req.json<{
      entityType?: "registry" | "linked";
      entityId?: string;
      source?: string;
      clientHash?: string | null;
      sourceInput?: {
        provider: "github";
        repo?: string | null;
        path?: string | null;
        ref?: string | null;
        url?: string | null;
        spec?: string | null;
      } | null;
    }>();

    const entityType = body.entityType ?? (body.sourceInput ? "linked" : "registry");
    const source = (body.source ?? "unknown").trim().toLowerCase() || "unknown";
    const clientHash = body.clientHash ?? null;
    const requestIp = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || null;
    const userAgent = c.req.header("user-agent") || null;

    const res = await recordDownloadEvent(c.env, {
      entityType,
      entityId: body.entityId ?? null,
      source,
      clientHash,
      sourceInput: body.sourceInput ?? null,
      requestIp,
      userAgent,
    });
    return c.json({ ok: true, entityId: res.entityId });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/stats/registry/:scope/:skill", async (c) => {
  try {
    const scope = decodeURIComponent(c.req.param("scope"));
    const skillSegment = decodeURIComponent(c.req.param("skill"));
    assertHandle(scope);
    assertSkillSegment(skillSegment);
    const name = `@${scope}/${skillSegment}`;
    const window = (c.req.query("window") || "").trim() || null;
    const stats = await getDownloadStats(c.env, { entityType: "registry", entityId: name, window });
    return c.json({ ok: true, ...stats });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/stats/linked-items/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const window = (c.req.query("window") || "").trim() || null;
    const stats = await getDownloadStats(c.env, { entityType: "linked", entityId: id, window });
    return c.json({ ok: true, ...stats });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), 400);
  }
});

app.get("/leaderboard", async (c) => {
  try {
    const type = (c.req.query("type") || "all").trim() as "all" | "registry" | "linked";
    const period = (c.req.query("period") || "7d").trim();
    const limit = Number.parseInt(c.req.query("limit") || "20", 10) || 20;
    const result = await getLeaderboard(c.env, { type, period, limit });
    return c.json({ ok: true, ...result });
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
    if (row) {
      const submittedBy = await getPublisherHandleById(c.env, row.submitted_by_publisher_id);
      const item = toLinkedItem(row, submittedBy);
      return c.json({ ok: true, item, install: buildInstallCommand(item.source) });
    }

    // Fallback: auto-discovered GitHub skills stored only in discover_items
    const discoverRow = await c.env.DB.prepare(
      "SELECT * FROM discover_items WHERE type = 'linked' AND source_id = ?1 LIMIT 1",
    )
      .bind(id)
      .first<{
        source_repo: string | null;
        source_path: string | null;
        source_ref: string | null;
        source_url: string | null;
        title: string;
        description: string;
        tags_json: string;
        alias: string | null;
        discover_at: string;
        created_at: string;
        updated_at: string;
      }>();

    if (!discoverRow) return errorJson(c as any, "Not found.", 404);

    const tags =
      (() => {
        try {
          const parsed = JSON.parse(discoverRow.tags_json);
          return Array.isArray(parsed) ? parsed.filter(t => typeof t === "string") : [];
        } catch {
          return [];
        }
      })() || [];

    const item = {
      id,
      alias: discoverRow.alias,
      source: {
        provider: "github" as const,
        repo: discoverRow.source_repo || "",
        path: discoverRow.source_path,
        ref: discoverRow.source_ref,
        url: discoverRow.source_url,
      },
      title: discoverRow.title || (discoverRow.source_path?.split("/").pop() || discoverRow.source_repo || id),
      description: discoverRow.description || "",
      license: null,
      category: null,
      tags,
      submittedBy: null,
      createdAt: discoverRow.created_at,
      updatedAt: discoverRow.updated_at,
    };

    const install = buildLinkedInstall({
      repo: discoverRow.source_repo || "",
      path: discoverRow.source_path,
      ref: discoverRow.source_ref,
    });
    return c.json({ ok: true, item, install });
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

    const skill = await c.env.DB.prepare(
      "SELECT id, name, description, targets_json, skillset, dependencies_json, alias, publisher_id, created_at, updated_at FROM skills WHERE name = ?1 LIMIT 1",
    )
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

app.post("/publisher/skills/:scope/:skill/alias", async (c) => {
  try {
    const auth = await requirePublisherAuth(c);

    const scope = decodeURIComponent(c.req.param("scope"));
    const skill = decodeURIComponent(c.req.param("skill"));
    assertHandle(scope);
    assertSkillSegment(skill);
    const name = `@${scope}/${skill}`;

    const body = await c.req.json<{ alias?: unknown }>().catch(() => ({} as { alias?: unknown }));
    const raw = body.alias == null ? null : String(body.alias).trim();
    const alias = raw ? normalizeAlias(raw) : null;
    if (alias) assertAlias(alias);

    if (alias) {
      const conflict = await c.env.DB.prepare("SELECT 1 FROM linked_items WHERE alias = ?1 LIMIT 1").bind(alias).first();
      if (conflict) return errorJson(c as any, "Alias already in use.", 409);
    }

    const now = new Date().toISOString();
    try {
      const result = await c.env.DB.prepare(
        "UPDATE skills SET alias = ?1, updated_at = ?2 WHERE name = ?3 AND publisher_id = ?4",
      )
        .bind(alias, now, name, auth.publisherId)
        .run();
      if (!result.success || (result.meta?.changes ?? 0) === 0) return errorJson(c as any, "Skill not found.", 404);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("unique") && msg.toLowerCase().includes("skills.alias")) {
        return errorJson(c as any, "Alias already in use.", 409);
      }
      if (msg.toLowerCase().includes("unique constraint failed")) {
        return errorJson(c as any, "Alias already in use.", 409);
      }
      throw e;
    }

    return c.json({ ok: true, name, alias });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 400);
  }
});

app.post("/publisher/linked-items/:id/alias", async (c) => {
  try {
    const auth = await requirePublisherAuth(c);
    const id = c.req.param("id");
    if (!id) return errorJson(c as any, "Missing id.", 400);

    const body = await c.req.json<{ alias?: unknown }>().catch(() => ({} as { alias?: unknown }));
    const raw = body.alias == null ? null : String(body.alias).trim();
    const alias = raw ? normalizeAlias(raw) : null;
    if (alias) assertAlias(alias);

    if (alias) {
      const conflict = await c.env.DB.prepare("SELECT 1 FROM skills WHERE alias = ?1 LIMIT 1").bind(alias).first();
      if (conflict) return errorJson(c as any, "Alias already in use.", 409);
    }

    const now = new Date().toISOString();
    try {
      const result = await c.env.DB.prepare(
        "UPDATE linked_items SET alias = ?1, updated_at = ?2 WHERE id = ?3 AND submitted_by_publisher_id = ?4",
      )
        .bind(alias, now, id, auth.publisherId)
        .run();
      if (!result.success || (result.meta?.changes ?? 0) === 0) return errorJson(c as any, "Not found.", 404);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("unique") && msg.toLowerCase().includes("linked_items.alias")) {
        return errorJson(c as any, "Alias already in use.", 409);
      }
      if (msg.toLowerCase().includes("unique constraint failed")) {
        return errorJson(c as any, "Alias already in use.", 409);
      }
      throw e;
    }

    return c.json({ ok: true, id, alias });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 400);
  }
});

app.delete("/publisher/skills/:scope/:skill", async (c) => {
  try {
    const auth = await requireSessionAuth(c);

    const scope = decodeURIComponent(c.req.param("scope"));
    const skill = decodeURIComponent(c.req.param("skill"));
    assertHandle(scope);
    assertSkillSegment(skill);
    const name = `@${scope}/${skill}`;

    const exists = await c.env.DB.prepare("SELECT 1 FROM skills WHERE name = ?1 AND publisher_id = ?2 LIMIT 1")
      .bind(name, auth.publisherId)
      .first();
    if (!exists) return errorJson(c as any, "Skill not found.", 404);

    const batch = [
      c.env.DB.prepare("DELETE FROM dist_tags WHERE skill_name = ?1").bind(name),
      c.env.DB.prepare("DELETE FROM skill_versions WHERE skill_name = ?1").bind(name),
      c.env.DB.prepare("DELETE FROM discover_items WHERE type = 'registry' AND source_id = ?1").bind(name),
      c.env.DB.prepare("DELETE FROM download_total WHERE entity_type = 'registry' AND entity_id = ?1").bind(name),
      c.env.DB.prepare("DELETE FROM download_daily WHERE entity_type = 'registry' AND entity_id = ?1").bind(name),
      c.env.DB.prepare("DELETE FROM skills WHERE name = ?1 AND publisher_id = ?2").bind(name, auth.publisherId),
    ];
    await c.env.DB.batch(batch);

    return c.json({ ok: true, deleted: true, name });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 400);
  }
});

app.delete("/publisher/linked-items/:id", async (c) => {
  try {
    const auth = await requireSessionAuth(c);
    const id = c.req.param("id");
    if (!id) return errorJson(c as any, "Missing id.", 400);

    const row = await c.env.DB.prepare("SELECT id FROM linked_items WHERE id = ?1 AND submitted_by_publisher_id = ?2 LIMIT 1")
      .bind(id, auth.publisherId)
      .first<{ id: string }>();
    if (!row) return errorJson(c as any, "Not found.", 404);

    const batch = [
      c.env.DB.prepare("DELETE FROM discover_items WHERE type = 'linked' AND source_id = ?1").bind(id),
      c.env.DB.prepare("DELETE FROM download_total WHERE entity_type = 'linked' AND entity_id = ?1").bind(id),
      c.env.DB.prepare("DELETE FROM download_daily WHERE entity_type = 'linked' AND entity_id = ?1").bind(id),
      c.env.DB.prepare("DELETE FROM linked_items WHERE id = ?1 AND submitted_by_publisher_id = ?2").bind(id, auth.publisherId),
    ];
    await c.env.DB.batch(batch);
    return c.json({ ok: true, deleted: true, id });
  } catch (e) {
    return errorJson(c as any, e instanceof Error ? e.message : String(e), c.res.status || 400);
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
        `Email not verified. Verify your email in the Skild Hub first: ${consoleUrl}/verify-email/request`,
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
    const skillsetRaw = String(form.get("skillset") || "").trim().toLowerCase();
    const skillset = skillsetRaw === "true" || skillsetRaw === "1" || skillsetRaw === "yes";
    const dependenciesRaw = String(form.get("dependencies") || "[]").trim() || "[]";
    let dependenciesJson = "[]";
    try {
      const parsed = JSON.parse(dependenciesRaw);
      if (!Array.isArray(parsed) || parsed.some((d) => typeof d !== "string")) {
        return errorJson(c as any, "Invalid dependencies. Expected JSON array of strings.", 400);
      }
      dependenciesJson = JSON.stringify(parsed);
    } catch {
      return errorJson(c as any, "Invalid dependencies. Expected JSON array of strings.", 400);
    }
    const tag = String(form.get("tag") || "latest").trim() || "latest";
    const file = form.get("tarball");
    if (!version || !file || !(file instanceof File)) return errorJson(c as any, "Missing version or tarball.", 400);
    assertSemver(version);

    const bytes = await file.arrayBuffer();
    const integrity = await sha256Hex(bytes);
    const artifactKey = `sha256/${integrity}.tgz`;

    const existingSkill = await c.env.DB.prepare("SELECT id, publisher_id, created_at FROM skills WHERE name = ?1 LIMIT 1")
      .bind(name)
      .first<{ id: string | null; publisher_id: string; created_at: string }>();
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
    const skillId = existingSkill?.id || crypto.randomUUID();
    const batch = [
      c.env.DB.prepare(
        "INSERT INTO skills (id, name, publisher_id, description, targets_json, skillset, dependencies_json, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)\n" +
          "ON CONFLICT(name) DO UPDATE SET id = COALESCE(skills.id, excluded.id), description = excluded.description, targets_json = excluded.targets_json, skillset = excluded.skillset, dependencies_json = excluded.dependencies_json, updated_at = excluded.updated_at",
      ).bind(skillId, name, publisher.id, description, targetsJson, skillset ? 1 : 0, dependenciesJson, now, now),
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
      skillset,
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

// =============================================================================
// Scheduled tasks (Cloudflare Cron)
// =============================================================================

type ScheduledCtx = { waitUntil(promise: Promise<unknown>): void };

function parseEnvInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt((value || "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

async function runCatalogIndexScan(env: Env): Promise<void> {
  const maxDurationMs = parseEnvInt(env.CATALOG_SCAN_MAX_DURATION_MS, 540000, 60000, 900000);
  const maxBatches = parseEnvInt(env.CATALOG_SCAN_MAX_BATCHES, 50, 1, 500);
  const start = Date.now();
  let batches = 0;
  let totalRepos = 0;
  let totalSkills = 0;
  let totalErrors = 0;

  while (batches < maxBatches && Date.now() - start < maxDurationMs) {
    const result = await scanCatalogIndexBatch(env);
    batches += 1;
    totalRepos += result.repos;
    totalSkills += result.skills;
    totalErrors += result.errors.length;
    if (result.repos === 0) break;
  }

  if (totalRepos > 0 || totalErrors > 0) {
    console.log("catalog_scan_summary", {
      batches,
      repos: totalRepos,
      skills: totalSkills,
      errors: totalErrors,
    });
  }
}

async function runGithubDiscovery(env: Env): Promise<void> {
  const discoveryEnabled = (env.DISCOVER_CRON_ENABLED || "").trim().toLowerCase() !== "false";
  if (!discoveryEnabled) return;

  const q = (env.DISCOVER_CRON_QUERY || "").trim() || "filename:SKILL.md path:skills";
  const pages = parseEnvInt(env.DISCOVER_CRON_PAGES, 1, 0, 5);
  if (pages <= 0) return;
  const perPage = parseEnvInt(env.DISCOVER_CRON_PER_PAGE, 30, 1, 100);
  const delayMs = parseEnvInt(env.DISCOVER_CRON_DELAY_MS, 1200, 200, 10_000);

  await discoverGithubSkills(env, { q, pages, perPage, delayMs });
}

async function runAwesomeDiscovery(env: Env): Promise<void> {
  const enabled = (env.AWESOME_CRON_ENABLED || "").trim().toLowerCase();
  if (enabled === "false" || enabled === "0") return;
  await discoverAwesomeSkills(env);
}

async function runRepoMetricsRefresh(env: Env): Promise<void> {
  // Refresh top repos seen in discover_items to keep stars fresh.
  const limit = parseEnvInt(env.REPO_METRICS_REFRESH_LIMIT, 200, 0, 500);
  if (limit <= 0) return;
  const repos = await listDiscoverRepos(env, limit, 0);
  if (repos.length === 0) return;
  await refreshRepoMetrics(env, repos);
}

async function runCatalogCategoryTagging(env: Env): Promise<void> {
  const enabled = (env.CATALOG_TAGGING_ENABLED || "").trim().toLowerCase();
  if (enabled === "false" || enabled === "0") return;
  const batchSize = parseEnvInt(env.CATALOG_TAGGING_BATCH_SIZE, 10, 1, 200);
  const delayMs = parseEnvInt(env.CATALOG_TAGGING_DELAY_MS, 0, 0, 3000);
  const result = await tagCatalogSkillCategories(env, { limit: batchSize, delayMs });
  const remaining = Math.max(batchSize - result.scanned, 0);
  let otherResult = { scanned: 0, tagged: 0, errors: [] as string[] };
  if (remaining > 0) {
    otherResult = await tagCatalogSkillCategories(env, {
      limit: remaining,
      delayMs,
      force: true,
      category: "other",
    });
  }
  if (result.tagged > 0 || otherResult.tagged > 0 || result.errors.length > 0 || otherResult.errors.length > 0) {
    console.log("catalog_category_tagging", {
      scanned: result.scanned + otherResult.scanned,
      tagged: result.tagged + otherResult.tagged,
      errors: [...result.errors, ...otherResult.errors],
      retaggedOther: otherResult.tagged,
    });
  }
}

export const scheduled = async (_event: unknown, env: Env, ctx: ScheduledCtx): Promise<void> => {
  ctx.waitUntil(
    (async () => {
      try {
        await runCatalogIndexScan(env);
      } catch (err) {
        console.error("catalog_scan_failed", err instanceof Error ? err.message : String(err));
      }

      try {
        await runGithubDiscovery(env);
      } catch (err) {
        console.error("discover_cron_failed", err instanceof Error ? err.message : String(err));
      }

      try {
        await runAwesomeDiscovery(env);
      } catch (err) {
        console.error("awesome_discover_failed", err instanceof Error ? err.message : String(err));
      }

      try {
        await runRepoMetricsRefresh(env);
      } catch (err) {
        console.error("repo_metrics_refresh_failed", err instanceof Error ? err.message : String(err));
      }

      try {
        await runCatalogCategoryTagging(env);
      } catch (err) {
        console.error("catalog_category_tagging_failed", err instanceof Error ? err.message : String(err));
      }
    })(),
  );
};
