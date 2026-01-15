import fs from 'node:fs';
import path from 'node:path';

export type DiscoveredSkillDir = {
  relPath: string;
  absDir: string;
};

export function parsePositiveInt(input: unknown, fallback: number): number {
  if (input == null) return fallback;
  const n = typeof input === 'number' ? input : Number(String(input).trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function normalizeRelPath(relPath: string): string {
  return relPath.split(path.sep).join('/').replace(/^\/+/, '').replace(/\/+$/, '');
}

function shouldSkipDir(name: string): boolean {
  if (!name) return true;
  if (name === '.git') return true;
  if (name === '.skild') return true;
  if (name === 'node_modules') return true;
  if (name === 'dist') return true;
  if (name === 'build') return true;
  if (name === '.wrangler') return true;
  return false;
}

function discoverSkillDirs(rootDir: string, options: { maxDepth: number; maxSkills: number }): DiscoveredSkillDir[] {
  const root = path.resolve(rootDir);
  const found: DiscoveredSkillDir[] = [];
  const stack: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];

  while (stack.length) {
    const next = stack.pop()!;
    const dir = next.dir;
    const depth = next.depth;

    const skillMd = path.join(dir, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      const relPath = path.relative(root, dir) || '.';
      found.push({ relPath: normalizeRelPath(relPath), absDir: dir });
      if (found.length >= options.maxSkills + 1) return found;
      continue;
    }

    if (depth >= options.maxDepth) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (shouldSkipDir(entry.name)) continue;
      const child = path.join(dir, entry.name);
      stack.push({ dir: child, depth: depth + 1 });
    }
  }

  return found;
}

export function discoverSkillDirsWithHeuristics(
  rootDir: string,
  options: { maxDepth: number; maxSkills: number }
): DiscoveredSkillDir[] {
  const root = path.resolve(rootDir);
  const candidates = [
    'skills',
    path.join('.agent', 'skills'),
    path.join('.claude', 'skills'),
    path.join('.codex', 'skills'),
    path.join('.github', 'skills'),
  ];

  for (const rel of candidates) {
    const candidateDir = path.join(root, rel);
    if (!fs.existsSync(candidateDir)) continue;
    try {
      if (!fs.statSync(candidateDir).isDirectory()) continue;
    } catch {
      continue;
    }
    const found = discoverSkillDirs(candidateDir, options).map(s => ({
      relPath: normalizeRelPath(path.join(rel, s.relPath)),
      absDir: s.absDir,
    }));
    if (found.length) return found;
  }

  return discoverSkillDirs(root, options);
}

export function deriveRemoteChildSource(baseSource: string, relPath: string): string {
  const [pathPart, ref] = baseSource.split('#', 2);
  const clean = normalizeRelPath(relPath);
  const joined = clean ? `${pathPart.replace(/\/+$/, '')}/${clean}` : pathPart;
  return ref ? `${joined}#${ref}` : joined;
}

