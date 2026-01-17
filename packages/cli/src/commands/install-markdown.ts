import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';
import type { Content, Root } from 'mdast';
import { deriveChildSource, fetchWithTimeout, materializeSourceToTemp } from '@skild/core';
import { discoverSkillDirsWithHeuristics, extractSkillMetadata, readSkillMetadata } from './install-discovery.js';
import type { DiscoveredSkillInstall } from './install-types.js';

type ProgressUpdate = {
  docsScanned: number;
  linksChecked: number;
  skillsFound: number;
  current?: string;
  linkLimitReached?: boolean;
};

export type MarkdownTreeNode = {
  id: string;
  label: string;
  kind: 'heading' | 'list' | 'doc' | 'skill';
  skillIndex?: number;
  children: MarkdownTreeNode[];
};

export type MarkdownDiscoveryResult = {
  skills: DiscoveredSkillInstall[];
  tree: MarkdownTreeNode[];
  cleanup: () => void;
};

type GitHubSource = {
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
  isFile?: boolean;
};

type RepoCacheEntry = {
  owner: string;
  repo: string;
  ref?: string;
  dir?: string;
  cleanup?: () => void;
};

type MarkdownDocRef = {
  repo: RepoCacheEntry;
  docPath: string;
  filePath?: string;
  content?: string;
};

type DiscoveryContext = {
  maxDocDepth: number;
  maxSkillDepth: number;
  maxSkills: number;
  maxLinks: number;
  linkLimitReached: boolean;
  onProgress?: (update: ProgressUpdate) => void;
  docsScanned: number;
  linksChecked: number;
  skillsFound: number;
  repoCache: Map<string, RepoCacheEntry>;
  skillCache: Map<string, number[]>;
  skillIndexBySource: Map<string, number>;
  skills: DiscoveredSkillInstall[];
  skillCleanups: Array<() => void>;
  nodeId: number;
};

const README_CANDIDATES = ['README.md', 'readme.md', 'Readme.md', 'README.markdown', 'readme.markdown'];

export async function discoverMarkdownSkillsFromSource(input: {
  source: string;
  maxDocDepth: number;
  maxSkillDepth: number;
  maxSkills: number;
  onProgress?: (update: ProgressUpdate) => void;
}): Promise<MarkdownDiscoveryResult | null> {
  const ctx: DiscoveryContext = {
    maxDocDepth: input.maxDocDepth,
    maxSkillDepth: input.maxSkillDepth,
    maxSkills: input.maxSkills,
    maxLinks: Math.min(400, Math.max(200, input.maxSkills * 2)),
    linkLimitReached: false,
    onProgress: input.onProgress,
    docsScanned: 0,
    linksChecked: 0,
    skillsFound: 0,
    repoCache: new Map(),
    skillCache: new Map(),
    skillIndexBySource: new Map(),
    skills: [],
    skillCleanups: [],
    nodeId: 0,
  };

  try {
    const entryDoc = await resolveMarkdownDoc(input.source, ctx);
    if (!entryDoc) {
      cleanupRepoCache(ctx);
      return null;
    }

    const visitedDocs = new Set<string>();
    const tree = await parseMarkdownDoc(entryDoc, ctx, 0, visitedDocs);
    cleanupRepoCache(ctx);

    const compacted = collapseSingleChildNodes(tree);
    return {
      skills: ctx.skills,
      tree: compacted,
      cleanup: () => {
        for (const cleanup of ctx.skillCleanups) cleanup();
      },
    };
  } catch {
    cleanupRepoCache(ctx);
    return null;
  }
}

function cleanupRepoCache(ctx: DiscoveryContext): void {
  for (const entry of ctx.repoCache.values()) {
    entry.cleanup?.();
  }
  ctx.repoCache.clear();
}

async function parseMarkdownDoc(
  doc: MarkdownDocRef,
  ctx: DiscoveryContext,
  depth: number,
  visitedDocs: Set<string>
): Promise<MarkdownTreeNode[]> {
  if (depth > ctx.maxDocDepth) return [];
  const docKey = `${doc.repo.owner}/${doc.repo.repo}#${doc.repo.ref || ''}:${doc.docPath}`;
  if (visitedDocs.has(docKey)) return [];
  visitedDocs.add(docKey);

  let content: string;
  try {
    if (doc.content != null) {
      content = doc.content;
    } else if (doc.filePath) {
      content = fs.readFileSync(doc.filePath, 'utf-8');
    } else {
      return [];
    }
  } catch {
    return [];
  }

  ctx.docsScanned += 1;
  updateProgress(ctx, doc.docPath ? path.posix.basename(doc.docPath) : undefined);

  const ast = unified().use(remarkParse).parse(content) as Root;
  const rootNode: MarkdownTreeNode = createNode(ctx, 'root', 'doc', []);
  const headingStack: Array<{ depth: number; node: MarkdownTreeNode }> = [];

  for (const child of ast.children) {
    if (child.type === 'heading') {
      const label = normalizeLabel(toString(child)) || `Section ${child.depth}`;
      const headingNode = createNode(ctx, label, 'heading', []);
      const parent = findHeadingParent(headingStack, child.depth, rootNode);
      parent.children.push(headingNode);
      headingStack.push({ depth: child.depth, node: headingNode });
    } else if (child.type === 'list') {
      const parent = currentHeading(headingStack, rootNode);
      await parseListNode(child, parent, doc, ctx, depth, visitedDocs);
    } else {
      const parent = currentHeading(headingStack, rootNode);
      await parseInlineLinks(child, parent, doc, ctx, depth, visitedDocs);
    }
  }

  return rootNode.children;
}

function currentHeading(
  stack: Array<{ depth: number; node: MarkdownTreeNode }>,
  fallback: MarkdownTreeNode
): MarkdownTreeNode {
  return stack.length ? stack[stack.length - 1]!.node : fallback;
}

function findHeadingParent(
  stack: Array<{ depth: number; node: MarkdownTreeNode }>,
  depth: number,
  fallback: MarkdownTreeNode
): MarkdownTreeNode {
  while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
    stack.pop();
  }
  return stack.length ? stack[stack.length - 1]!.node : fallback;
}

async function parseListNode(
  node: Content & { type: 'list' },
  parent: MarkdownTreeNode,
  doc: MarkdownDocRef,
  ctx: DiscoveryContext,
  depth: number,
  visitedDocs: Set<string>
): Promise<void> {
  if (ctx.linkLimitReached || ctx.skillsFound >= ctx.maxSkills) return;
  for (const item of node.children) {
    const label = normalizeLabel(toString(item)) || 'Item';
    const listNode = createNode(ctx, label, 'list', []);

    let hasContent = false;
    for (const child of item.children) {
      if (child.type === 'list') {
        await parseListNode(child, listNode, doc, ctx, depth, visitedDocs);
        if (listNode.children.length > 0) hasContent = true;
      } else {
        const added = await parseInlineLinks(child, listNode, doc, ctx, depth, visitedDocs);
        if (added) hasContent = true;
      }
    }

    if (hasContent) {
      parent.children.push(listNode);
    }
  }
}

async function parseInlineLinks(
  node: Content,
  parent: MarkdownTreeNode,
  doc: MarkdownDocRef,
  ctx: DiscoveryContext,
  depth: number,
  visitedDocs: Set<string>
): Promise<boolean> {
  const links = collectLinks(node);
  let added = false;

  if (ctx.skillsFound >= ctx.maxSkills) {
    ctx.linkLimitReached = true;
    updateProgress(ctx);
    return false;
  }

  for (const link of links) {
    if (ctx.linkLimitReached) return added;
    if (ctx.linksChecked >= ctx.maxLinks) {
      ctx.linkLimitReached = true;
      updateProgress(ctx);
      return added;
    }
    ctx.linksChecked += 1;
    updateProgress(ctx);

    const resolved = resolveLink(doc, link.url);
    if (!resolved) continue;

    const label = normalizeLabel(link.label) || resolved.displayName;
    const maybeMarkdown = !isLikelyFilePath(resolved.pathHint) || looksLikeMarkdownPath(resolved.pathHint);
    const canRecurseMarkdown = depth < ctx.maxDocDepth;

    if (maybeMarkdown && canRecurseMarkdown) {
      const childDoc = await resolveMarkdownDoc(resolved.source, ctx);
      if (childDoc) {
        const childNodes = await parseMarkdownDoc(childDoc, ctx, depth + 1, visitedDocs);
        if (childNodes.length > 0) {
          const docNode = createNode(ctx, label, 'doc', childNodes);
          parent.children.push(docNode);
          added = true;
          continue;
        }
      }
    }

    if (isLikelyFilePath(resolved.pathHint)) continue;
    const skillIndices = await resolveSkillsFromSource(resolved.source, label, ctx, resolved.sameRepo ? { repo: doc.repo, pathHint: resolved.pathHint } : undefined);
    if (skillIndices.length === 0) continue;
    added = true;

    if (skillIndices.length === 1) {
      parent.children.push(createSkillLeaf(ctx, skillIndices[0], label));
    } else {
      const groupLabel = label || resolved.displayName || 'Skills';
      const groupNode = buildSkillPathTree(ctx, skillIndices, groupLabel);
      parent.children.push(groupNode);
    }
  }

  return added;
}

function createNode(
  ctx: DiscoveryContext,
  label: string,
  kind: MarkdownTreeNode['kind'],
  children: MarkdownTreeNode[]
): MarkdownTreeNode {
  ctx.nodeId += 1;
  return {
    id: `md-${ctx.nodeId}`,
    label: label.trim(),
    kind,
    children,
  };
}

function createSkillLeaf(ctx: DiscoveryContext, skillIndex: number, labelOverride?: string): MarkdownTreeNode {
  const label = labelOverride?.trim() || ctx.skills[skillIndex]?.displayName || ctx.skills[skillIndex]?.relPath || 'Skill';
  const node = createNode(ctx, label, 'skill', []);
  node.skillIndex = skillIndex;
  return node;
}

function buildSkillPathTree(ctx: DiscoveryContext, skillIndices: number[], label: string): MarkdownTreeNode {
  const root = createNode(ctx, label || 'Skills', 'list', []);
  const childMap = new WeakMap<MarkdownTreeNode, Map<string, MarkdownTreeNode>>();

  const ensureChild = (parent: MarkdownTreeNode, segment: string): MarkdownTreeNode => {
    let map = childMap.get(parent);
    if (!map) {
      map = new Map();
      childMap.set(parent, map);
    }
    const existing = map.get(segment);
    if (existing) return existing;
    const node = createNode(ctx, segment, 'list', []);
    parent.children.push(node);
    map.set(segment, node);
    return node;
  };

  for (const skillIndex of skillIndices) {
    const skill = ctx.skills[skillIndex];
    if (!skill) continue;
    let relPath = skill.relPath || '';
    if (relPath === '.' || relPath === './') {
      root.children.push(createSkillLeaf(ctx, skillIndex, skill.displayName));
      continue;
    }
    if (relPath.startsWith('./')) relPath = relPath.slice(2);
    relPath = relPath.replace(/^\/+/, '');
    if (!relPath) {
      root.children.push(createSkillLeaf(ctx, skillIndex, skill.displayName));
      continue;
    }
    const segments = relPath.split('/').filter(Boolean);
    if (segments.length === 0) {
      root.children.push(createSkillLeaf(ctx, skillIndex, skill.displayName));
      continue;
    }
    let parent = root;
    for (let i = 0; i < segments.length - 1; i += 1) {
      parent = ensureChild(parent, segments[i]!);
    }
    const leafLabel = skill.displayName || segments[segments.length - 1]!;
    parent.children.push(createSkillLeaf(ctx, skillIndex, leafLabel));
  }

  return root;
}

function collapseSingleChildNodes(nodes: MarkdownTreeNode[]): MarkdownTreeNode[] {
  const collapsed: MarkdownTreeNode[] = [];
  for (const node of nodes) {
    const next = collapseNode(node);
    if (next) collapsed.push(next);
  }
  return collapsed;
}

function collapseNode(node: MarkdownTreeNode): MarkdownTreeNode | null {
  node.children = node.children.map(collapseNode).filter(Boolean) as MarkdownTreeNode[];

  if (node.kind !== 'heading' && node.kind !== 'skill' && node.children.length === 1 && !node.skillIndex) {
    return node.children[0]!;
  }

  if (node.kind !== 'skill' && node.children.length === 0 && !node.skillIndex) {
    return null;
  }

  return node;
}

function normalizeLabel(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

function collectLinks(node: Content): Array<{ url: string; label: string }> {
  const links: Array<{ url: string; label: string }> = [];

  const visit = (n: Content) => {
    if (n.type === 'link') {
      const url = typeof n.url === 'string' ? n.url : '';
      if (url) {
        links.push({ url, label: toString(n) });
      }
      return;
    }
    if ('children' in n && Array.isArray(n.children)) {
      for (const child of n.children) {
        visit(child as Content);
      }
    }
  };

  visit(node);
  return links;
}

function isLikelyFilePath(value?: string): boolean {
  if (!value) return false;
  const trimmed = value.split('?')[0]!.split('#')[0]!;
  const base = trimmed.split('/').pop() || '';
  if (!base.includes('.')) return false;
  const lower = base.toLowerCase();
  return !lower.endsWith('.md') && !lower.endsWith('.markdown');
}

function updateProgress(ctx: DiscoveryContext, current?: string): void {
  if (!ctx.onProgress) return;
  ctx.onProgress({
    docsScanned: ctx.docsScanned,
    linksChecked: ctx.linksChecked,
    skillsFound: ctx.skillsFound,
    current,
    linkLimitReached: ctx.linkLimitReached,
  });
}

type RepoHint = { repo: RepoCacheEntry; pathHint?: string };

async function resolveSkillsFromSource(
  source: string,
  displayName: string,
  ctx: DiscoveryContext,
  repoHint?: RepoHint
): Promise<number[]> {
  const cached = ctx.skillCache.get(source);
  if (cached) return cached;

  const localIndices = repoHint ? resolveSkillsFromLocal(repoHint, source, displayName, ctx) : [];
  if (localIndices.length > 0) {
    ctx.skillCache.set(source, localIndices);
    return localIndices;
  }

  const quickIndex = await tryFetchSkillManifest(source, displayName, ctx);
  if (quickIndex.length > 0) {
    ctx.skillCache.set(source, quickIndex);
    return quickIndex;
  }

  let materializedDir: string;
  try {
    const materialized = await materializeSourceToTemp(source);
    ctx.skillCleanups.push(materialized.cleanup);
    materializedDir = materialized.dir;
  } catch {
    ctx.skillCache.set(source, []);
    return [];
  }

  const skillMd = path.join(materializedDir, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    const metadata = readSkillMetadata(materializedDir);
    const skillIndex = registerSkill(ctx, {
      relPath: '.',
      suggestedSource: source,
      materializedDir: materializedDir,
      displayName: metadata?.name || displayName || deriveDisplayName(source),
      description: metadata?.description,
    });
    const indices = [skillIndex];
    ctx.skillCache.set(source, indices);
    return indices;
  }

  const discovered = discoverSkillDirsWithHeuristics(materializedDir, { maxDepth: ctx.maxSkillDepth, maxSkills: ctx.maxSkills });
  if (discovered.length === 0) {
    ctx.skillCache.set(source, []);
    return [];
  }

  const indices: number[] = [];
  for (const skill of discovered) {
    const childSource = deriveChildSource(source, skill.relPath);
    const metadata = readSkillMetadata(skill.absDir);
    const skillIndex = registerSkill(ctx, {
      relPath: skill.relPath,
      suggestedSource: childSource,
      materializedDir: skill.absDir,
      displayName: metadata?.name || deriveDisplayName(childSource),
      description: metadata?.description,
    });
    indices.push(skillIndex);
  }

  ctx.skillCache.set(source, indices);
  return indices;
}

function resolveSkillsFromLocal(repoHint: RepoHint, source: string, displayName: string, ctx: DiscoveryContext): number[] {
  if (!repoHint.repo.dir) return [];
  const base = repoHint.pathHint ? path.join(repoHint.repo.dir, repoHint.pathHint) : repoHint.repo.dir;
  if (!fs.existsSync(base)) return [];

  const skillMd = path.join(base, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    const metadata = readSkillMetadata(base);
    return [
      registerSkill(ctx, {
        relPath: '.',
        suggestedSource: source,
        displayName: metadata?.name || displayName || deriveDisplayName(source),
        description: metadata?.description,
      })
    ];
  }

  const discovered = discoverSkillDirsWithHeuristics(base, { maxDepth: ctx.maxSkillDepth, maxSkills: ctx.maxSkills });
  if (discovered.length === 0) return [];

  const indices: number[] = [];
  for (const skill of discovered) {
    const childSource = deriveChildSource(source, skill.relPath);
    const metadata = readSkillMetadata(skill.absDir);
    const skillIndex = registerSkill(ctx, {
      relPath: skill.relPath,
      suggestedSource: childSource,
      displayName: metadata?.name || deriveDisplayName(childSource),
      description: metadata?.description,
    });
    indices.push(skillIndex);
  }
  return indices;
}

async function tryFetchSkillManifest(source: string, displayName: string, ctx: DiscoveryContext): Promise<number[]> {
  const parsed = parseGitHubSource(source);
  if (!parsed) return [];

  const ref = parsed.ref || 'HEAD';
  const pathPrefix = parsed.path ? `${parsed.path.replace(/\/+$/, '')}/` : '';
  const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${ref}/${pathPrefix}SKILL.md`;

  try {
    const res = await fetchWithTimeout(rawUrl, { method: 'GET' }, 5000);
    if (!res.ok) {
      if (res.status === 404) return [];
      return [];
    }
    const content = await res.text();
    const metadata = extractSkillMetadata(content);
    return [
      registerSkill(ctx, {
        relPath: '.',
        suggestedSource: source,
        displayName: metadata?.name || displayName || deriveDisplayName(source),
        description: metadata?.description,
      })
    ];
  } catch {
    return [];
  }
}

function registerSkill(ctx: DiscoveryContext, skill: DiscoveredSkillInstall): number {
  const key = skill.suggestedSource;
  const existing = ctx.skillIndexBySource.get(key);
  if (existing != null) {
    if (!ctx.skills[existing]!.displayName && skill.displayName) {
      ctx.skills[existing]!.displayName = skill.displayName;
    }
    return existing;
  }
  if (ctx.skills.length >= ctx.maxSkills) {
    ctx.linkLimitReached = true;
    updateProgress(ctx);
    return ctx.skills.length - 1;
  }
  ctx.skills.push(skill);
  const index = ctx.skills.length - 1;
  ctx.skillIndexBySource.set(key, index);
  ctx.skillsFound = ctx.skills.length;
  if (ctx.skillsFound >= ctx.maxSkills) {
    ctx.linkLimitReached = true;
    updateProgress(ctx);
  }
  return index;
}

function deriveDisplayName(source: string): string {
  const clean = source.replace(/[#?].*$/, '');
  return clean.split('/').filter(Boolean).pop() || source;
}

function resolveLink(
  doc: MarkdownDocRef,
  url: string
): { source: string; displayName: string; pathHint?: string; sameRepo?: boolean } | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (trimmed.startsWith('mailto:')) return null;

  const parsed = parseGitHubSource(trimmed);
  if (parsed) {
    const source = toRepoSource(parsed);
    const pathHint = parsed.path;
    const displayName = parsed.path ? parsed.path.split('/').pop() || source : source;
    const parsedRef = parsed.ref || doc.repo.ref || 'HEAD';
    const docRef = doc.repo.ref || 'HEAD';
    const sameRepo = parsed.owner === doc.repo.owner && parsed.repo === doc.repo.repo && parsedRef === docRef;
    return { source, displayName, pathHint, sameRepo };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return null;

  const relative = normalizeRepoRelative(trimmed);
  if (!relative) return null;

  const baseDir = path.posix.dirname(doc.docPath);
  const relativePath = relative.isAbsolute
    ? path.posix.normalize(relative.path)
    : path.posix.normalize(path.posix.join(baseDir, relative.path));
  const resolved = buildRepoSource({
    owner: doc.repo.owner,
    repo: doc.repo.repo,
    ref: doc.repo.ref,
    path: relativePath.replace(/^\/+/, ''),
  });
  const displayName = relativePath.split('/').filter(Boolean).pop() || relative.path;
  return { source: resolved, displayName, pathHint: relativePath, sameRepo: true };
}

function normalizeRepoRelative(link: string): { path: string; isAbsolute: boolean } | null {
  const cleaned = link.split('#')[0]!.split('?')[0]!.trim();
  if (!cleaned) return null;
  if (cleaned.startsWith('/')) return { path: cleaned.slice(1), isAbsolute: true };
  return { path: cleaned, isAbsolute: false };
}

function toPosix(input: string): string {
  return input.split(path.sep).join('/');
}

function looksLikeMarkdownPath(value?: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown') || README_CANDIDATES.some(name => lower.endsWith(name.toLowerCase()));
}

function parseGitHubSource(input: string): GitHubSource | null {
  if (input.includes('github.com') || input.includes('raw.githubusercontent.com')) {
    try {
      const url = new URL(input);
      if (url.hostname === 'raw.githubusercontent.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 4) return null;
        const [owner, repo, ref, ...rest] = parts;
        return { owner, repo: repo.replace(/\.git$/, ''), ref, path: rest.join('/'), isFile: true };
      }
      if (url.hostname !== 'github.com') return null;
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return null;
      const [owner, repo, type, ref, ...rest] = parts;
      if (!type) return { owner, repo: repo.replace(/\.git$/, '') };
      if (type === 'tree' || type === 'blob') {
        return { owner, repo: repo.replace(/\.git$/, ''), ref, path: rest.join('/'), isFile: type === 'blob' };
      }
      return { owner, repo: repo.replace(/\.git$/, ''), path: [type, ref, ...rest].filter(Boolean).join('/') };
    } catch {
      return null;
    }
  }

  if (/^[^/]+\/[^/]+/.test(input)) {
    const [base, ref] = input.split('#', 2);
    const parts = base.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo, ...rest] = parts;
    const pathPart = rest.length ? rest.join('/') : undefined;
    return { owner, repo, ref, path: pathPart, isFile: looksLikeMarkdownPath(pathPart) };
  }

  return null;
}

function toRepoSource(parsed: GitHubSource): string {
  return buildRepoSource(parsed);
}

function buildRepoSource(parsed: GitHubSource): string {
  const base = `${parsed.owner}/${parsed.repo}${parsed.path ? `/${parsed.path}` : ''}`;
  return parsed.ref ? `${base}#${parsed.ref}` : base;
}

async function resolveMarkdownDoc(source: string, ctx: DiscoveryContext): Promise<MarkdownDocRef | null> {
  const parsed = parseGitHubSource(source);
  if (!parsed) return null;

  const ref = parsed.ref || 'HEAD';
  const repoKey = `${parsed.owner}/${parsed.repo}#${ref}`;
  let repo = ctx.repoCache.get(repoKey);
  if (!repo) {
    repo = { owner: parsed.owner, repo: parsed.repo, ref };
    ctx.repoCache.set(repoKey, repo);
  }

  const targetPath = parsed.path ? parsed.path.replace(/^\/+/, '') : '';
  if (parsed.isFile || looksLikeMarkdownPath(targetPath)) {
    const content = await fetchMarkdownContent(repo, targetPath);
    if (!content) return null;
    return { repo, docPath: targetPath, content };
  }

  const dirPath = targetPath;
  for (const candidate of README_CANDIDATES) {
    const docPath = dirPath ? path.posix.join(dirPath, candidate) : candidate;
    const content = await fetchMarkdownContent(repo, docPath);
    if (content) return { repo, docPath, content };
  }

  // Fallback to local materialization if remote access fails
  const repoSpec = `${repo.owner}/${repo.repo}#${repo.ref}`;
  try {
    const materialized = await materializeSourceToTemp(repoSpec);
    const localRepo = { ...repo, dir: materialized.dir, cleanup: materialized.cleanup };
    ctx.repoCache.set(repoKey, localRepo);
    const localTarget = targetPath;
    if (parsed.isFile || looksLikeMarkdownPath(localTarget)) {
      const filePath = path.join(materialized.dir, localTarget);
      if (fs.existsSync(filePath)) return { repo: localRepo, docPath: localTarget, filePath };
      return null;
    }
    for (const candidate of README_CANDIDATES) {
      const filePath = path.join(materialized.dir, dirPath, candidate);
      if (fs.existsSync(filePath)) {
        return { repo: localRepo, docPath: path.posix.join(dirPath, candidate), filePath };
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function fetchMarkdownContent(repo: RepoCacheEntry, docPath: string): Promise<string | null> {
  const ref = repo.ref || 'HEAD';
  const rawUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${ref}/${docPath}`;
  try {
    const res = await fetchWithTimeout(rawUrl, { method: 'GET' }, 5000);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
