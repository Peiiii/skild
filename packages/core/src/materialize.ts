import fs from 'fs';
import os from 'os';
import path from 'path';
import degit from 'degit';
import simpleGit from 'simple-git';
import type { SourceType } from './types.js';
import { classifySource, extractSkillName, resolveLocalPath, stripSourceRef, toDegitPath } from './source.js';
import { copyDir, createTempDir, isDirEmpty, isDirectory, removeDir } from './fs.js';
import { SkildError } from './errors.js';

function ensureInstallableDir(sourcePath: string): void {
  if (!isDirectory(sourcePath)) {
    throw new SkildError('NOT_A_DIRECTORY', `Source path is not a directory: ${sourcePath}`, { sourcePath });
  }
}

type DegitCloneMode = 'tar' | 'git';

function resetTargetDir(targetPath: string): void {
  removeDir(targetPath);
  fs.mkdirSync(targetPath, { recursive: true });
}

type GitCloneSpec = {
  url: string;
  ref?: string;
  subpath?: string;
};

function splitSourceRef(source: string): { base: string; ref?: string } {
  const [base, ref] = source.split('#', 2);
  return { base, ref: ref?.trim() || undefined };
}

function parseGitCloneSpec(source: string): GitCloneSpec | null {
  const trimmed = source.trim();
  if (!trimmed) return null;
  if (resolveLocalPath(trimmed)) return null;

  const { base, ref } = splitSourceRef(trimmed);

  const githubTreeWithPathMatch = base.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (githubTreeWithPathMatch) {
    const [, owner, repo, branch, subpath] = githubTreeWithPathMatch;
    return { url: `https://github.com/${owner}/${repo}.git`, ref: branch, subpath };
  }

  const githubTreeMatch = base.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)$/);
  if (githubTreeMatch) {
    const [, owner, repo, branch] = githubTreeMatch;
    return { url: `https://github.com/${owner}/${repo}.git`, ref: branch };
  }

  const githubRepoMatch = base.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (githubRepoMatch) {
    const [, owner, repoRaw] = githubRepoMatch;
    const repo = repoRaw.replace(/\.git$/, '');
    return { url: `https://github.com/${owner}/${repo}.git`, ref };
  }

  const gitlabTreeWithPathMatch = base.match(/gitlab\.com\/([^/]+)\/([^/]+)\/-\/tree\/([^/]+)\/(.+)/);
  if (gitlabTreeWithPathMatch) {
    const [, owner, repo, branch, subpath] = gitlabTreeWithPathMatch;
    return { url: `https://gitlab.com/${owner}/${repo}.git`, ref: branch, subpath };
  }

  const gitlabTreeMatch = base.match(/gitlab\.com\/([^/]+)\/([^/]+)\/-\/tree\/([^/]+)$/);
  if (gitlabTreeMatch) {
    const [, owner, repo, branch] = gitlabTreeMatch;
    return { url: `https://gitlab.com/${owner}/${repo}.git`, ref: branch };
  }

  const gitlabRepoMatch = base.match(/gitlab\.com\/([^/]+)\/([^/]+)/);
  if (gitlabRepoMatch) {
    const [, owner, repoRaw] = gitlabRepoMatch;
    const repo = repoRaw.replace(/\.git$/, '');
    return { url: `https://gitlab.com/${owner}/${repo}.git`, ref };
  }

  const shorthandMatch = base.match(/^([^/]+)\/([^/]+)(?:\/(.+))?$/);
  if (shorthandMatch && !base.includes(':') && !base.startsWith('.') && !base.startsWith('/')) {
    const [, owner, repo, subpath] = shorthandMatch;
    return { url: `https://github.com/${owner}/${repo}.git`, ref, subpath };
  }

  if (/^(https?:|git@|ssh:)/i.test(base)) {
    return { url: base, ref };
  }

  return null;
}

async function cloneWithGit(spec: GitCloneSpec, targetPath: string): Promise<string> {
  const cloneOptions = spec.ref ? ['--depth', '1', '--branch', spec.ref] : ['--depth', '1'];
  const git = simpleGit();

  if (!spec.subpath) {
    resetTargetDir(targetPath);
    await git.clone(spec.url, targetPath, cloneOptions);
    return spec.url;
  }

  const tempRoot = createTempDir(path.join(os.tmpdir(), 'skild-git'), extractSkillName(spec.url));
  try {
    await git.clone(spec.url, tempRoot, cloneOptions);
    const resolvedSubpath = path.resolve(tempRoot, spec.subpath);
    const resolvedRoot = path.resolve(tempRoot);
    if (!resolvedSubpath.startsWith(`${resolvedRoot}${path.sep}`)) {
      throw new SkildError('INVALID_SOURCE', `Subpath escapes repository root: ${spec.subpath}`, { subpath: spec.subpath });
    }
    ensureInstallableDir(resolvedSubpath);
    resetTargetDir(targetPath);
    copyDir(resolvedSubpath, targetPath);
    return spec.url;
  } finally {
    removeDir(tempRoot);
  }
}

async function cloneRemote(degitSrc: string, targetPath: string, mode: DegitCloneMode): Promise<void> {
  const emitter = degit(degitSrc, { force: true, verbose: false, mode });
  await emitter.clone(targetPath);
}

function isMissingRefError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /could not find commit hash/i.test(message);
}

async function cloneRemoteWithFallback(degitSrc: string, targetPath: string): Promise<string> {
  const fallbackSrc = degitSrc.includes('#') ? stripSourceRef(degitSrc) : degitSrc;
  const candidates: Array<{ src: string; mode: DegitCloneMode }> = [
    { src: degitSrc, mode: 'git' },
  ];
  if (fallbackSrc !== degitSrc) {
    candidates.push({ src: fallbackSrc, mode: 'git' });
  }
  candidates.push({ src: degitSrc, mode: 'tar' });
  if (fallbackSrc !== degitSrc) {
    candidates.push({ src: fallbackSrc, mode: 'tar' });
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      resetTargetDir(targetPath);
      await cloneRemote(candidate.src, targetPath, candidate.mode);
      return candidate.src;
    } catch (error) {
      lastError = error;
      if (candidate.src === degitSrc && isMissingRefError(error)) {
        continue;
      }
    }
  }

  throw lastError;
}

export async function materializeSourceToDir(input: {
  source: string;
  targetDir: string;
  materializedDir?: string | null;
}): Promise<{ sourceType: SourceType; materializedFrom: string }> {
  const sourceType = classifySource(input.source);
  const targetDir = path.resolve(input.targetDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const overridden = input.materializedDir?.trim() ? path.resolve(input.materializedDir.trim()) : null;
  if (overridden) {
    ensureInstallableDir(overridden);
    copyDir(overridden, targetDir);
    return { sourceType, materializedFrom: overridden };
  }

  const localPath = resolveLocalPath(input.source);
  if (localPath) {
    ensureInstallableDir(localPath);
    copyDir(localPath, targetDir);
    return { sourceType: 'local', materializedFrom: localPath };
  }

  const gitSpec = parseGitCloneSpec(input.source);
  if (gitSpec) {
    try {
      const materializedFrom = await cloneWithGit(gitSpec, targetDir);
      return { sourceType, materializedFrom };
    } catch {
      // Fall back to degit path below.
    }
  }

  const degitPath = toDegitPath(input.source);
  const materializedFrom = await cloneRemoteWithFallback(degitPath, targetDir);
  return { sourceType, materializedFrom };
}

export async function materializeSourceToTemp(source: string): Promise<{ dir: string; cleanup: () => void; sourceType: SourceType }> {
  const sourceType = classifySource(source);
  const tempParent = path.join(os.tmpdir(), 'skild-materialize');
  const tempRoot = createTempDir(tempParent, extractSkillName(source));
  const dir = path.join(tempRoot, 'staging');
  fs.mkdirSync(dir, { recursive: true });

  try {
    await materializeSourceToDir({ source, targetDir: dir });
    if (isDirEmpty(dir)) {
      throw new SkildError(
        'EMPTY_INSTALL_DIR',
        `Installed directory is empty for source: ${source}\nSource likely does not point to a valid subdirectory.\nTry: https://github.com/<owner>/<repo>/tree/<branch>/skills/<skill-name>\nExample: https://github.com/anthropics/skills/tree/main/skills/pdf`,
        { source }
      );
    }
    return { dir, sourceType, cleanup: () => removeDir(tempRoot) };
  } catch (e) {
    removeDir(tempRoot);
    throw e;
  }
}
