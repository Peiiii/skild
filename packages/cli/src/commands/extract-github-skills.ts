import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import {
  deriveChildSource,
  materializeSourceToTemp,
  SkildError,
} from '@skild/core';
import { createSpinner } from '../utils/logger.js';
import {
  discoverSkillDirsWithHeuristics,
  parseNonNegativeInt,
  parsePositiveInt,
  readSkillMetadata,
} from './install-discovery.js';
import { discoverMarkdownSkillsFromSource, parseGitHubSource, type MarkdownTreeNode } from './markdown-discovery.js';
import type { DiscoveredSkillInstall } from './install-types.js';

export interface ExtractGithubSkillsOptions {
  out?: string;
  force?: boolean;
  depth?: number | string;
  scanDepth?: number | string;
  maxSkills?: number | string;
  json?: boolean;
}

type CatalogSkill = {
  index: number;
  name?: string;
  description?: string;
  source: string;
  relPath: string;
  exportPath: string;
};

type CatalogOutput = {
  schemaVersion: 1;
  source: string;
  exportRoot: string;
  generatedAt: string;
  tree: MarkdownTreeNode[];
  skills: CatalogSkill[];
};

type RepoCacheEntry = { dir: string; cleanup: () => void };

export async function extractGithubSkills(source: string, options: ExtractGithubSkillsOptions): Promise<void> {
  const resolvedSource = source.trim();
  const jsonOnly = Boolean(options.json);

  if (!parseGitHubSource(resolvedSource)) {
    const message = `Only GitHub sources are supported for extract-github-skills: "${resolvedSource}"`;
    if (jsonOnly) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }, null, 2) + '\n');
    } else {
      console.error(chalk.red(message));
    }
    process.exitCode = 1;
    return;
  }

  const maxDocDepth = parseNonNegativeInt(options.depth, 0);
  const maxSkillDepth = parseNonNegativeInt(options.scanDepth, 6);
  const maxSkills = parsePositiveInt(options.maxSkills, 200);
  const outDir = resolveOutDir(options.out);
  const force = Boolean(options.force);

  try {
    prepareOutputDir(outDir, force);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (jsonOnly) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }, null, 2) + '\n');
    } else {
      console.error(chalk.red(message));
    }
    process.exitCode = 1;
    return;
  }

  const spinner = createSpinner(`Parsing markdown at ${chalk.cyan(resolvedSource)}...`);
  if (!jsonOnly) spinner.start();

  let skills: DiscoveredSkillInstall[] = [];
  let tree: MarkdownTreeNode[] = [];
  let cleanup: (() => void) | null = null;

  try {
    const markdownResult = await discoverMarkdownSkillsFromSource({
      source: resolvedSource,
      maxDocDepth,
      maxSkillDepth,
      maxSkills,
      onProgress: update => {
        if (!spinner) return;
        const current = update.current ? ` · ${update.current}` : '';
        const capped = update.linkLimitReached ? ' · link cap reached' : '';
        spinner.text = `Parsing markdown (${update.docsScanned} docs, ${update.linksChecked} links, ${update.skillsFound} skills)${current}${capped}`;
      },
    });

    if (markdownResult && markdownResult.skills.length > 0) {
      skills = markdownResult.skills;
      tree = markdownResult.tree;
      cleanup = markdownResult.cleanup;
    } else {
      if (!jsonOnly) spinner.text = `Scanning repository at ${chalk.cyan(resolvedSource)}...`;
      const materialized = await materializeSourceToTemp(resolvedSource);
      cleanup = materialized.cleanup;
      const discovered = discoverSkillDirsWithHeuristics(materialized.dir, { maxDepth: maxSkillDepth, maxSkills });
      if (discovered.length === 0) {
        throw new SkildError('SKILL_NOT_FOUND', `No SKILL.md found in source "${resolvedSource}".`);
      }
      skills = discovered.map(d => {
        const metadata = readSkillMetadata(d.absDir);
        return {
          relPath: d.relPath,
          suggestedSource: d.relPath === '.' ? resolvedSource : deriveChildSource(resolvedSource, d.relPath),
          materializedDir: d.absDir,
          displayName: metadata?.name,
          description: metadata?.description,
        };
      });
      tree = buildTreeFromRelPaths(skills);
    }

    if (skills.length > maxSkills) {
      throw new SkildError('INVALID_SOURCE', `Found more than ${maxSkills} skills. Increase --max-skills to proceed.`);
    }

    const exportPaths = buildExportPathMap(tree, skills);
    const repoCache = new Map<string, RepoCacheEntry>();

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]!;
      const exportSegments = exportPaths.get(i);
      if (!exportSegments || exportSegments.length === 0) continue;
      const exportPath = path.join(outDir, ...exportSegments);
      const localDir = await resolveSkillDirectory(skill, repoCache);
      copyDirectory(localDir, exportPath);

      const metadata = readSkillMetadata(localDir) || { name: skill.displayName, description: skill.description };
      const skillJson = {
        name: metadata?.name || skill.displayName || skill.relPath || undefined,
        description: metadata?.description || skill.description || undefined,
        source: skill.suggestedSource,
        relPath: skill.relPath,
        exportPath: path.relative(outDir, exportPath).split(path.sep).join('/'),
      };
      fs.writeFileSync(path.join(exportPath, 'skill.json'), JSON.stringify(skillJson, null, 2));
    }

    const catalogSkills: CatalogSkill[] = skills.map((skill, index) => {
      const exportSegments = exportPaths.get(index) || [];
      const exportPath = exportSegments.length > 0
        ? exportSegments.join('/')
        : slugifySegment(skill.displayName || skill.relPath || 'skill', 'skill');
      return {
        index,
        name: skill.displayName || undefined,
        description: skill.description || undefined,
        source: skill.suggestedSource,
        relPath: skill.relPath,
        exportPath,
      };
    });

    const catalog: CatalogOutput = {
      schemaVersion: 1,
      source: resolvedSource,
      exportRoot: outDir,
      generatedAt: new Date().toISOString(),
      tree,
      skills: catalogSkills,
    };
    fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2));

    for (const entry of repoCache.values()) entry.cleanup();
    cleanup?.();

    if (!jsonOnly) {
      spinner.succeed(`Exported ${skills.length} skill${skills.length > 1 ? 's' : ''} to ${chalk.cyan(outDir)}`);
    } else {
      process.stdout.write(JSON.stringify({ ok: true, outDir, skills: catalogSkills }, null, 2) + '\n');
    }
  } catch (error: unknown) {
    cleanup?.();
    if (!jsonOnly) spinner.stop();
    const message = error instanceof SkildError ? error.message : error instanceof Error ? error.message : String(error);
    if (jsonOnly) {
      process.stdout.write(JSON.stringify({ ok: false, error: message }, null, 2) + '\n');
    } else {
      console.error(chalk.red(message));
    }
    process.exitCode = 1;
  }
}

function resolveOutDir(out?: string): string {
  if (!out || !out.trim()) {
    return path.resolve(process.cwd(), 'skild-github-skills');
  }
  const trimmed = out.trim();
  if (trimmed.startsWith('~')) {
    return path.resolve(os.homedir(), trimmed.slice(1));
  }
  return path.resolve(process.cwd(), trimmed);
}

function prepareOutputDir(outDir: string, force: boolean): void {
  if (fs.existsSync(outDir)) {
    const entries = fs.readdirSync(outDir);
    if (entries.length > 0) {
      if (!force) {
        throw new Error(`Output directory is not empty: ${outDir}. Use --force to overwrite.`);
      }
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
}

async function resolveSkillDirectory(skill: DiscoveredSkillInstall, repoCache: Map<string, RepoCacheEntry>): Promise<string> {
  if (skill.materializedDir && fs.existsSync(skill.materializedDir)) return skill.materializedDir;
  const parsed = parseGitHubSource(skill.suggestedSource);
  if (!parsed) throw new SkildError('INVALID_SOURCE', `Unsupported skill source: ${skill.suggestedSource}`);
  const ref = parsed.ref || 'HEAD';
  const repoKey = `${parsed.owner}/${parsed.repo}#${ref}`;
  let cached = repoCache.get(repoKey);
  if (!cached) {
    const materialized = await materializeSourceToTemp(repoKey);
    cached = { dir: materialized.dir, cleanup: materialized.cleanup };
    repoCache.set(repoKey, cached);
  }
  const relPath = parsed.path ? parsed.path.replace(/^\/+/, '') : '';
  const resolved = relPath ? path.join(cached.dir, relPath) : cached.dir;
  if (!fs.existsSync(resolved)) {
    throw new SkildError('SKILL_NOT_FOUND', `Skill path missing in repo: ${skill.suggestedSource}`);
  }
  return resolved;
}

function copyDirectory(fromDir: string, toDir: string): void {
  fs.mkdirSync(path.dirname(toDir), { recursive: true });
  fs.cpSync(fromDir, toDir, { recursive: true, errorOnExist: false, force: true });
}

function buildTreeFromRelPaths(skills: DiscoveredSkillInstall[]): MarkdownTreeNode[] {
  let nodeId = 0;
  const root: MarkdownTreeNode = { id: 'root', label: 'root', kind: 'list', children: [] };

  const ensureChild = (parent: MarkdownTreeNode, label: string): MarkdownTreeNode => {
    const found = parent.children.find(child => child.label === label);
    if (found) return found;
    nodeId += 1;
    const child: MarkdownTreeNode = { id: `rel-${nodeId}`, label, kind: 'list', children: [] };
    parent.children.push(child);
    return child;
  };

  skills.forEach((skill, index) => {
    const relPath = skill.relPath === '.' ? '' : skill.relPath;
    const segments = relPath.split('/').filter(Boolean);
    let parent = root;
    if (segments.length === 0) {
      nodeId += 1;
      parent.children.push({
        id: `rel-${nodeId}`,
        label: skill.displayName || 'skill',
        kind: 'skill',
        skillIndex: index,
        children: [],
      });
      return;
    }
    for (let i = 0; i < segments.length - 1; i += 1) {
      parent = ensureChild(parent, segments[i]!);
    }
    nodeId += 1;
    parent.children.push({
      id: `rel-${nodeId}`,
      label: skill.displayName || segments[segments.length - 1]!,
      kind: 'skill',
      skillIndex: index,
      children: [],
    });
  });

  return collapseSingleChildNodes(root.children);
}

function buildExportPathMap(tree: MarkdownTreeNode[], skills: DiscoveredSkillInstall[]): Map<number, string[]> {
  const paths = new Map<number, string[]>();
  const usedPaths = new Set<string>();

  const walk = (nodes: MarkdownTreeNode[], parentSegments: string[]) => {
    const siblingCounts = new Map<string, number>();
    for (const node of nodes) {
      const base = slugifySegment(node.label, node.kind === 'skill' ? 'skill' : 'section');
      const segment = ensureUniqueSegment(base, siblingCounts);
      if (node.kind === 'skill' && node.skillIndex != null) {
        const segments = ensureUniquePath([...parentSegments, segment], usedPaths);
        paths.set(node.skillIndex, segments);
        usedPaths.add(segments.join('/'));
        continue;
      }
      if (node.children.length > 0) {
        walk(node.children, [...parentSegments, segment]);
      }
    }
  };

  walk(tree, []);

  for (let i = 0; i < skills.length; i++) {
    if (paths.has(i)) continue;
    const skill = skills[i]!;
    const fallbackSegments = relPathSegments(skill);
    const segments = ensureUniquePath(fallbackSegments, usedPaths);
    paths.set(i, segments);
    usedPaths.add(segments.join('/'));
  }

  return paths;
}

function relPathSegments(skill: DiscoveredSkillInstall): string[] {
  if (skill.relPath && skill.relPath !== '.') {
    return skill.relPath.split('/').filter(Boolean).map(segment => slugifySegment(segment, 'skill'));
  }
  return [slugifySegment(skill.displayName || skill.relPath || 'skill', 'skill')];
}

function ensureUniqueSegment(base: string, counts: Map<string, number>): string {
  const next = (counts.get(base) || 0) + 1;
  counts.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

function ensureUniquePath(segments: string[], usedPaths: Set<string>): string[] {
  let candidate = segments.join('/');
  if (!usedPaths.has(candidate)) return segments;
  let suffix = 2;
  const baseSegments = [...segments];
  while (usedPaths.has(candidate)) {
    candidate = [...baseSegments.slice(0, -1), `${baseSegments[baseSegments.length - 1]}-${suffix}`].join('/');
    suffix += 1;
  }
  return candidate.split('/');
}

function slugifySegment(label: string, fallback: string): string {
  const normalized = label.trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function collapseSingleChildNodes(nodes: MarkdownTreeNode[]): MarkdownTreeNode[] {
  return nodes.map(node => collapseNode(node)).filter(Boolean) as MarkdownTreeNode[];
}

function collapseNode(node: MarkdownTreeNode): MarkdownTreeNode | null {
  node.children = node.children.map(child => collapseNode(child)).filter(Boolean) as MarkdownTreeNode[];
  if (node.kind !== 'heading' && node.kind !== 'skill' && node.children.length === 1 && !node.skillIndex) {
    return node.children[0]!;
  }
  return node;
}
