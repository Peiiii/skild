import path from 'path';
import { pathExists } from './fs.js';
import type { SourceType } from './types.js';
import { SkildError } from './errors.js';

export function resolveLocalPath(source: string): string | null {
  const resolved = path.resolve(source);
  return pathExists(resolved) ? resolved : null;
}

export function classifySource(source: string): SourceType {
  const local = resolveLocalPath(source);
  if (local) return 'local';
  if (/^https?:\/\//i.test(source) || source.includes('github.com')) return 'github-url';
  if (/^[^/]+\/[^/]+/.test(source)) return 'degit-shorthand';
  throw new SkildError(
    'INVALID_SOURCE',
    `Unsupported source "${source}". Use a Git URL (e.g. https://github.com/owner/repo/tree/<branch>/<subdir>) or degit shorthand (e.g. owner/repo[/subdir][#ref]) or a local directory.`
  );
}

export function extractSkillName(source: string): string {
  const local = resolveLocalPath(source);
  if (local) return path.basename(local) || 'unknown-skill';

  const cleaned = source.replace(/[#?].*$/, '');

  const treeMatch = cleaned.match(/\/tree\/[^/]+\/(.+?)(?:\/)?$/);
  if (treeMatch) return treeMatch[1].split('/').pop() || 'unknown-skill';

  const repoMatch = cleaned.match(/github\.com\/[^/]+\/([^/]+)/);
  if (repoMatch) return repoMatch[1].replace(/\.git$/, '');

  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1] || 'unknown-skill';

  return cleaned || 'unknown-skill';
}

export function toDegitPath(url: string): string {
  const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)(?:\/)?$/);
  if (treeMatch) {
    const [, owner, repo, branch, subpath] = treeMatch;
    return `${owner}/${repo}/${subpath}#${branch}`;
  }

  const repoMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
  if (repoMatch) return repoMatch[1].replace(/\.git$/, '');

  return url;
}

