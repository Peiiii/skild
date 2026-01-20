import type { Env } from "./env.js";

export type CatalogSnapshot = {
  skillMd: string | null;
  readmeMd: string | null;
  meta: Record<string, unknown> | null;
};

function slugify(value: string): string {
  return value
    .replace(/\//g, "__")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getCatalogBucket(env: Env): R2Bucket {
  return env.CATALOG_BUCKET ?? env.BUCKET;
}

export function buildCatalogSnapshotPrefix(input: { repo: string; path: string | null; ref: string | null }): string {
  const repo = slugify(input.repo);
  const path = slugify(input.path || "root");
  const ref = slugify(input.ref || "head");
  return `catalog/skill-snapshots/${repo}/${path}/${ref}`;
}

export async function writeCatalogSnapshot(
  env: Env,
  input: {
    repo: string;
    path: string | null;
    ref: string | null;
    skillMd: string | null;
    readmeMd: string | null;
    meta: Record<string, unknown> | null;
  },
): Promise<string> {
  const bucket = getCatalogBucket(env);
  const prefix = buildCatalogSnapshotPrefix({ repo: input.repo, path: input.path, ref: input.ref });
  const writes: Promise<unknown>[] = [];

  if (input.skillMd) {
    writes.push(
      bucket.put(`${prefix}/SKILL.md`, input.skillMd, {
        httpMetadata: { contentType: "text/markdown; charset=utf-8", cacheControl: "public, max-age=3600" },
      }),
    );
  }

  if (input.readmeMd) {
    writes.push(
      bucket.put(`${prefix}/README.md`, input.readmeMd, {
        httpMetadata: { contentType: "text/markdown; charset=utf-8", cacheControl: "public, max-age=3600" },
      }),
    );
  }

  if (input.meta) {
    writes.push(
      bucket.put(`${prefix}/meta.json`, JSON.stringify(input.meta, null, 2), {
        httpMetadata: { contentType: "application/json; charset=utf-8", cacheControl: "public, max-age=3600" },
      }),
    );
  }

  if (writes.length > 0) await Promise.all(writes);
  return prefix;
}

export async function readCatalogSnapshot(env: Env, prefix: string | null): Promise<CatalogSnapshot | null> {
  if (!prefix) return null;
  const bucket = getCatalogBucket(env);

  const [skillObj, readmeObj, metaObj] = await Promise.all([
    bucket.get(`${prefix}/SKILL.md`),
    bucket.get(`${prefix}/README.md`),
    bucket.get(`${prefix}/meta.json`),
  ]);

  const skillMd = skillObj ? await skillObj.text() : null;
  const readmeMd = readmeObj ? await readmeObj.text() : null;
  let meta: Record<string, unknown> | null = null;
  if (metaObj) {
    try {
      meta = (await metaObj.json()) as Record<string, unknown>;
    } catch {
      meta = null;
    }
  }

  return { skillMd, readmeMd, meta };
}
