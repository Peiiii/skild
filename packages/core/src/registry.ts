import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as tar from 'tar';
import { SkildError } from './errors.js';

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
  if (!/^[A-Za-z0-9][A-Za-z0-9.+-]*$/.test(versionOrTag)) {
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
  const url = `${registryUrl}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(name)}/versions/${encodeURIComponent(spec.versionOrTag)}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Failed to resolve ${spec.canonicalName}@${spec.versionOrTag} (${res.status}). ${text}`.trim());
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
    throw new SkildError('REGISTRY_RESOLVE_FAILED', `Invalid registry response for ${spec.canonicalName}@${spec.versionOrTag}.`);
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

  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
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

export async function downloadAndExtractTarball(resolved: RegistryResolvedVersion, tempRoot: string, stagingDir: string): Promise<void> {
  const res = await fetch(resolved.tarballUrl);
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
