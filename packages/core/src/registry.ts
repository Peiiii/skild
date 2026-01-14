import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as tar from 'tar';
import semver from 'semver';
import { SkildError } from './errors.js';
import { fetchWithTimeout } from './http.js';

export const DEFAULT_REGISTRY_URL = 'https://registry.skild.sh';

export interface RegistrySpecifier {
  canonicalName: string; // @publisher/skill
  versionOrTag: string; // semver or dist-tag
}

export interface RegistryResolvedVersion {
  canonicalName: string;
  version: string;
  integrity: string;
  tarballUrl: string;
  publishedAt?: string;
}

export function parseRegistrySpecifier(input: string): RegistrySpecifier {
  const raw = input.trim();
  if (!raw.startsWith('@') || !raw.includes('/')) {
    throw new SkildError('INVALID_SOURCE', `Invalid registry specifier "${input}". Expected @publisher/skill[@version].`);
  }

  const slash = raw.indexOf('/');
  const at = raw.lastIndexOf('@');
  const hasVersion = at > slash;
  const canonicalName = hasVersion ? raw.slice(0, at) : raw;
  const versionOrTag = hasVersion ? raw.slice(at + 1) : 'latest';

  if (!/^@[a-z0-9][a-z0-9-]{1,31}\/[a-z0-9][a-z0-9-]{1,63}$/.test(canonicalName)) {
    throw new SkildError('INVALID_SOURCE', `Invalid skill name "${canonicalName}". Expected @publisher/skill (lowercase letters/digits/dashes).`);
  }
  if (!versionOrTag || /\s/.test(versionOrTag)) {
    throw new SkildError('INVALID_SOURCE', `Invalid version or tag "${versionOrTag}".`);
  }

  return { canonicalName, versionOrTag };
}

export function canonicalNameToInstallDirName(canonicalName: string): string {
  const match = canonicalName.match(/^@([^/]+)\/(.+)$/);
  if (!match) return canonicalName;
  const [, scope, name] = match;
  return `${scope}__${name}`;
}

export function splitCanonicalName(canonicalName: string): { scope: string; name: string } {
  const match = canonicalName.match(/^@([^/]+)\/(.+)$/);
  if (!match) {
    throw new SkildError('INVALID_SOURCE', `Invalid skill name "${canonicalName}". Expected @publisher/skill.`);
  }
  return { scope: match[1], name: match[2] };
}

export function resolveRegistryUrl(explicit?: string): string {
  const fromEnv = process.env.SKILD_REGISTRY_URL?.trim();
  if (explicit?.trim()) return explicit.trim().replace(/\/+$/, '');
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return DEFAULT_REGISTRY_URL;
}

export async function resolveRegistryVersion(registryUrl: string, spec: RegistrySpecifier): Promise<RegistryResolvedVersion> {
  const { scope, name } = splitCanonicalName(spec.canonicalName);
  const versionOrTag = spec.versionOrTag;
  const range = semver.validRange(versionOrTag);

  if (range && !semver.valid(versionOrTag)) {
    const metaUrl = `${registryUrl}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(name)}`;
    const metaRes = await fetchWithTimeout(metaUrl, { headers: { accept: 'application/json' } }, 10_000);
    if (!metaRes.ok) {
      const text = await metaRes.text().catch(() => '');
      throw new SkildError('REGISTRY_RESOLVE_FAILED', `Failed to resolve ${spec.canonicalName}@${versionOrTag} (${metaRes.status}). ${text}`.trim());
    }
    const meta = (await metaRes.json()) as { ok: boolean; versions?: Array<{ version: string }> };
    if (!meta?.ok || !Array.isArray(meta.versions)) {
      throw new SkildError('REGISTRY_RESOLVE_FAILED', `Invalid registry response for ${spec.canonicalName}@${versionOrTag}.`);
    }

    const versions = meta.versions.map(v => v.version).filter(v => semver.valid(v));
    const matched = semver.maxSatisfying(versions, range);
    if (!matched) {
      throw new SkildError('REGISTRY_RESOLVE_FAILED', `No published version satisfies ${spec.canonicalName}@${versionOrTag}.`);
    }
    return resolveRegistryVersion(registryUrl, { canonicalName: spec.canonicalName, versionOrTag: matched });
  }

  const url = `${registryUrl}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(name)}/versions/${encodeURIComponent(versionOrTag)}`;
  const res = await fetchWithTimeout(url, { headers: { accept: 'application/json' } }, 10_000);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Failed to resolve ${spec.canonicalName}@${versionOrTag} (${res.status}). ${text}`.trim());
  }
  const json = (await res.json()) as {
    ok: boolean;
    name: string;
    version: string;
    integrity: string;
    tarballUrl: string;
    publishedAt?: string;
  };
  if (!json?.ok || !json.tarballUrl || !json.integrity || !json.version) {
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Invalid registry response for ${spec.canonicalName}@${versionOrTag}.`);
  }
  const tarballUrl = json.tarballUrl.startsWith('http') ? json.tarballUrl : `${registryUrl}${json.tarballUrl}`;
  return { canonicalName: spec.canonicalName, version: json.version, integrity: json.integrity, tarballUrl, publishedAt: json.publishedAt };
}

function sha256Hex(buffer: Buffer): string {
  const h = crypto.createHash('sha256');
  h.update(buffer);
  return h.digest('hex');
}

export async function searchRegistrySkills(
  registryUrl: string,
  query: string,
  limit = 50
): Promise<Array<{ name: string; description?: string; targets_json?: string; created_at?: string; updated_at?: string }>> {
  const q = query.trim();
  const url = new URL(`${registryUrl}/skills`);
  if (q) url.searchParams.set('q', q);
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 100)));

  const res = await fetchWithTimeout(url.toString(), { headers: { accept: 'application/json' } }, 10_000);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Failed to search skills (${res.status}). ${text}`.trim());
  }
  const json = (await res.json()) as { ok: boolean; skills: any[] };
  if (!json?.ok || !Array.isArray(json.skills)) {
    throw new SkildError('REGISTRY_RESOLVE_FAILED', 'Invalid registry response for /skills.');
  }
  return json.skills as any;
}

export async function resolveRegistryAlias(
  registryUrl: string,
  alias: string
): Promise<{ type: 'registry'; spec: string } | { type: 'linked'; spec: string }> {
  const a = alias.trim();
  if (!a) throw new SkildError('INVALID_SOURCE', 'Missing alias.');

  const url = new URL(`${registryUrl}/resolve`);
  url.searchParams.set('alias', a);
  const res = await fetchWithTimeout(url.toString(), { headers: { accept: 'application/json' } }, 10_000);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Failed to resolve alias "${a}" (${res.status}). ${text}`.trim());
  }
  const json = (await res.json()) as { ok: boolean; type?: string; spec?: string };
  if (!json?.ok || !json.type || typeof json.spec !== 'string' || !json.spec.trim()) {
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Invalid registry response for alias "${a}".`);
  }
  if (json.type === 'registry') return { type: 'registry', spec: json.spec.trim() };
  if (json.type === 'linked') return { type: 'linked', spec: json.spec.trim() };
  throw new SkildError('REGISTRY_RESOLVE_FAILED', `Unsupported alias target type "${json.type}".`);
}

export async function downloadAndExtractTarball(resolved: RegistryResolvedVersion, tempRoot: string, stagingDir: string): Promise<void> {
  const res = await fetchWithTimeout(resolved.tarballUrl, {}, 30_000);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SkildError('REGISTRY_DOWNLOAD_FAILED', `Failed to download tarball (${res.status}). ${text}`.trim());
  }

  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const computed = sha256Hex(buf);
  if (computed !== resolved.integrity) {
    throw new SkildError(
      'INTEGRITY_MISMATCH',
      `Integrity mismatch for ${resolved.canonicalName}@${resolved.version}. Expected ${resolved.integrity}, got ${computed}.`
    );
  }

  const tarballPath = path.join(tempRoot, 'skill.tgz');
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.writeFileSync(tarballPath, buf);

  try {
    await tar.x({ file: tarballPath, cwd: stagingDir, gzip: true });
  } catch (error) {
    throw error;
  }
}
