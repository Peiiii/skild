import path from 'path';
import fs from 'fs';
import type {
  InstallOptions,
  InstallRecord,
  InstalledDependency,
  ListOptions,
  Platform,
  InstallScope,
  LockEntry,
  UpdateOptions,
  SkillFrontmatter,
  SkillValidationResult,
  SourceType
} from './types.js';
import { classifySource, extractSkillName, resolveLocalPath, toDegitPath } from './source.js';
import { createTempDir, hashDirectoryContent, isDirEmpty, isDirectory, removeDir, replaceDirAtomic } from './fs.js';
import { ensureDir, getSkillInstallDir, getSkillsDir } from './paths.js';
import { SkildError } from './errors.js';
import { readInstallRecord, writeInstallRecord, upsertLockEntry, loadOrCreateGlobalConfig, removeLockEntry, loadRegistryAuth } from './storage.js';
import { parseSkillFrontmatter, readSkillMd, validateSkillDir } from './skill.js';
import { PLATFORMS } from './types.js';
import {
  downloadAndExtractTarball,
  parseRegistrySpecifier,
  resolveRegistryUrl,
  resolveRegistryVersion,
  canonicalNameToInstallDirName,
  type RegistryResolvedVersion
} from './registry.js';
import { materializeSourceToDir } from './materialize.js';

export interface InstallInput {
  source: string;
  nameOverride?: string;
  /**
   * Optional local directory containing the already-fetched source content.
   * When provided, Skild will copy from this directory but still record `source`
   * and `sourceType` based on the original `source` string (useful for multi-skill installs).
   */
  materializedDir?: string;
}

type InlineDependency = {
  sourceType: 'inline';
  source: string;
  name: string;
  inlinePath: string;
  inlineDir: string;
};

type ExternalDependency = {
  sourceType: SourceType;
  source: string;
  spec?: ReturnType<typeof parseRegistrySpecifier>;
};

type ParsedDependency = InlineDependency | ExternalDependency;

type InstallContext = {
  platform: Platform;
  scope: InstallScope;
  force: boolean;
  registryUrl?: string;
  active: Set<string>;
  inlineActive: Set<string>;
};

function normalizeDependencies(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw new SkildError('INVALID_DEPENDENCIES', 'Frontmatter "dependencies" must be an array of strings.');
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string') {
      throw new SkildError('INVALID_DEPENDENCIES', 'Frontmatter "dependencies" must be an array of strings.');
    }
    const trimmed = item.trim();
    if (!trimmed) {
      throw new SkildError('INVALID_DEPENDENCIES', 'Dependencies cannot contain empty values.');
    }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function isRelativeDependency(dep: string): boolean {
  return dep.startsWith('./') || dep.startsWith('../');
}

function resolveInlineDependency(raw: string, baseDir: string, rootDir: string): InlineDependency {
  const resolved = path.resolve(baseDir, raw);
  const relToRoot = path.relative(rootDir, resolved);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    throw new SkildError('INVALID_DEPENDENCY', `Inline dependency path escapes the skill root: ${raw}`);
  }
  if (!isDirectory(resolved)) {
    throw new SkildError('INVALID_DEPENDENCY', `Inline dependency is not a directory: ${raw}`);
  }
  const validation = validateSkillDir(resolved);
  if (!validation.ok) {
    throw new SkildError('INVALID_DEPENDENCY', `Inline dependency is not a valid skill: ${raw}`, { issues: validation.issues });
  }
  const normalizedInlinePath = relToRoot.split(path.sep).join('/');
  return {
    sourceType: 'inline',
    source: raw,
    name: path.basename(resolved) || raw,
    inlinePath: normalizedInlinePath,
    inlineDir: resolved
  };
}

function normalizeDependencyInput(raw: string): string {
  if (!raw.toLowerCase().startsWith('github:')) return raw;
  const trimmed = raw.slice('github:'.length).trim().replace(/^\/+/, '');
  if (!trimmed) {
    throw new SkildError('INVALID_DEPENDENCY', 'Invalid GitHub dependency: missing repo after "github:".');
  }
  return trimmed;
}

function parseDependency(raw: string, baseDir: string, rootDir: string): ParsedDependency {
  const cleaned = normalizeDependencyInput(raw).trim();
  if (!cleaned) {
    throw new SkildError('INVALID_DEPENDENCY', 'Dependencies cannot contain empty values.');
  }

  if (isRelativeDependency(cleaned)) {
    return resolveInlineDependency(cleaned, baseDir, rootDir);
  }

  if (cleaned.startsWith('@')) {
    return { sourceType: 'registry', source: cleaned, spec: parseRegistrySpecifier(cleaned) };
  }

  if (/^https?:\/\//i.test(cleaned) || cleaned.includes('github.com')) {
    return { sourceType: 'github-url', source: cleaned };
  }

  if (/^[^/]+\/[^/]+/.test(cleaned)) {
    return { sourceType: 'degit-shorthand', source: cleaned };
  }

  throw new SkildError('INVALID_DEPENDENCY', `Unsupported dependency source "${raw}".`);
}

function getFrontmatterFromDir(dir: string): SkillFrontmatter | null {
  const skillMd = readSkillMd(dir);
  if (!skillMd) return null;
  return parseSkillFrontmatter(skillMd);
}

function getDependencyKeyFromRecord(record: InstallRecord): string {
  if (record.sourceType === 'registry') {
    return `registry:${record.canonicalName || record.source}`;
  }
  if (record.sourceType === 'local') {
    const resolved = resolveLocalPath(record.source);
    return `local:${resolved || record.source}`;
  }
  return `${record.sourceType}:${record.source}`;
}

function addDependedBy(record: InstallRecord, dependerName: string): void {
  const current = new Set(record.dependedBy || []);
  current.add(dependerName);
  record.dependedBy = Array.from(current).sort();
  writeInstallRecord(record.installDir, record);
}

function removeDependedBy(record: InstallRecord, dependerName: string): void {
  if (!record.dependedBy) return;
  const next = record.dependedBy.filter(name => name !== dependerName);
  record.dependedBy = next.length ? next : undefined;
  writeInstallRecord(record.installDir, record);
}

function dedupeInstalledDependencies(entries: InstalledDependency[]): InstalledDependency[] {
  const seen = new Set<string>();
  const out: InstalledDependency[] = [];
  for (const entry of entries) {
    const key =
      entry.sourceType === 'inline'
        ? `inline:${entry.inlinePath || entry.name}`
        : `external:${entry.installDir || entry.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

function assertNonEmptyInstall(stagingDir: string, source: string): void {
  if (isDirEmpty(stagingDir)) {
    throw new SkildError(
      'EMPTY_INSTALL_DIR',
      `Installed directory is empty for source: ${source}\nSource likely does not point to a valid subdirectory.\nTry: https://github.com/<owner>/<repo>/tree/<branch>/skills/<skill-name>\nExample: https://github.com/anthropics/skills/tree/main/skills/pdf`,
      { source }
    );
  }
}

function resolvePlatformAndScope(options: InstallOptions | ListOptions | UpdateOptions): { platform: Platform; scope: InstallScope } {
  const config = loadOrCreateGlobalConfig();
  return {
    platform: (options.platform || config.defaultPlatform) as Platform,
    scope: (options.scope || config.defaultScope) as InstallScope
  };
}

async function installSkillBase(input: InstallInput, options: InstallOptions = {}): Promise<InstallRecord> {
  const { platform, scope } = resolvePlatformAndScope(options);
  const source = input.source;
  const sourceType = classifySource(source);

  const skillsDir = getSkillsDir(platform, scope);
  ensureDir(skillsDir);

  const skillName = input.nameOverride || extractSkillName(source);
  const installDir = getSkillInstallDir(platform, scope, skillName);

  if (fs.existsSync(installDir) && !options.force) {
    throw new SkildError('ALREADY_INSTALLED', `Skill "${skillName}" is already installed at ${installDir}. Use --force, or uninstall first.`, {
      skillName,
      installDir
    });
  }

  const tempRoot = createTempDir(skillsDir, skillName);
  const stagingDir = path.join(tempRoot, 'staging');

  try {
    await materializeSourceToDir({ source, targetDir: stagingDir, materializedDir: input.materializedDir });

    assertNonEmptyInstall(stagingDir, source);
    replaceDirAtomic(stagingDir, installDir);

    const contentHash = hashDirectoryContent(installDir);
    const validation = validateSkillDir(installDir);

    const record: InstallRecord = {
      schemaVersion: 1,
      name: skillName,
      platform,
      scope,
      source,
      sourceType,
      installedAt: new Date().toISOString(),
      installDir,
      contentHash,
      hasSkillMd: fs.existsSync(path.join(installDir, 'SKILL.md')),
      skill: {
        frontmatter: validation.frontmatter,
        validation
      }
    };

    writeInstallRecord(installDir, record);

    const lockEntry: LockEntry = {
      name: record.name,
      platform: record.platform,
      scope: record.scope,
      source: record.source,
      sourceType: record.sourceType,
      installedAt: record.installedAt,
      updatedAt: record.updatedAt,
      installDir: record.installDir,
      contentHash: record.contentHash
    };
    upsertLockEntry(scope, lockEntry);

    return record;
  } finally {
    removeDir(tempRoot);
  }
}

async function installRegistrySkillBase(
  input: { spec: string; registryUrl?: string; nameOverride?: string },
  options: InstallOptions = {},
  resolved?: RegistryResolvedVersion
): Promise<InstallRecord> {
  const { platform, scope } = resolvePlatformAndScope(options);
  const registryUrl = resolveRegistryUrl(input.registryUrl);
  const spec = parseRegistrySpecifier(input.spec);
  const canonicalName = spec.canonicalName;

  const skillsDir = getSkillsDir(platform, scope);
  ensureDir(skillsDir);

  const installName = input.nameOverride || canonicalNameToInstallDirName(canonicalName);
  const installDir = getSkillInstallDir(platform, scope, installName);

  if (fs.existsSync(installDir) && !options.force) {
    throw new SkildError('ALREADY_INSTALLED', `Skill "${canonicalName}" is already installed at ${installDir}. Use --force, or uninstall first.`, {
      skillName: canonicalName,
      installDir
    });
  }

  const tempRoot = createTempDir(skillsDir, installName);
  const stagingDir = path.join(tempRoot, 'staging');

  try {
    const resolvedVersion = resolved || (await resolveRegistryVersion(registryUrl, spec));
    await downloadAndExtractTarball(resolvedVersion, tempRoot, stagingDir);
    assertNonEmptyInstall(stagingDir, input.spec);

    replaceDirAtomic(stagingDir, installDir);

    const contentHash = hashDirectoryContent(installDir);
    const validation = validateSkillDir(installDir);

    const record: InstallRecord = {
      schemaVersion: 1,
      name: installName,
      canonicalName,
      registryUrl,
      platform,
      scope,
      source: input.spec,
      sourceType: 'registry',
      resolvedVersion: resolvedVersion.version,
      installedAt: new Date().toISOString(),
      installDir,
      contentHash,
      hasSkillMd: fs.existsSync(path.join(installDir, 'SKILL.md')),
      skill: { validation, frontmatter: validation.frontmatter }
    };

    writeInstallRecord(installDir, record);
    const lockEntry: LockEntry = {
      name: installName,
      platform,
      scope,
      source: input.spec,
      sourceType: 'registry',
      registryUrl,
      installedAt: record.installedAt,
      installDir: record.installDir,
      contentHash: record.contentHash
    };
    upsertLockEntry(scope, lockEntry);

    return record;
  } finally {
    removeDir(tempRoot);
  }
}

function createInstallContext(options: InstallOptions, registryUrl?: string): InstallContext {
  const { platform, scope } = resolvePlatformAndScope(options);
  return {
    platform,
    scope,
    force: Boolean(options.force),
    registryUrl: registryUrl ?? options.registryUrl,
    active: new Set<string>(),
    inlineActive: new Set<string>()
  };
}

function formatVersionConflict(input: {
  name: string;
  installedVersion?: string;
  requested: string;
  installedBy: string;
  requestedBy: string;
}): string {
  const lines = [
    'Version conflict detected',
    `  Installed: ${input.name}@${input.installedVersion || 'unknown'} (required by ${input.installedBy})`,
    `  Requested: ${input.name}@${input.requested} (required by ${input.requestedBy})`,
    '',
    'Please resolve manually.'
  ];
  return lines.join('\n');
}

async function ensureExternalDependencyInstalled(
  dep: ExternalDependency,
  ctx: InstallContext,
  dependerName: string
): Promise<InstallRecord> {
  if (dep.sourceType === 'registry') {
    const registryUrl = resolveRegistryUrl(ctx.registryUrl);
    const spec = dep.spec || parseRegistrySpecifier(dep.source);
    const resolved = await resolveRegistryVersion(registryUrl, spec);
    const installName = canonicalNameToInstallDirName(spec.canonicalName);
    const installDir = getSkillInstallDir(ctx.platform, ctx.scope, installName);

    if (fs.existsSync(installDir) && !ctx.force) {
      const existing = readInstallRecord(installDir);
      if (!existing) {
        throw new SkildError(
          'MISSING_METADATA',
          `Skill "${spec.canonicalName}" is missing install metadata (.skild/install.json). Use --force to reinstall.`,
          { installDir }
        );
      }
      const installedVersion = existing.resolvedVersion || existing.skill?.frontmatter?.version;
      if (installedVersion && installedVersion !== resolved.version) {
        const installedBy = existing.dependedBy?.length ? existing.dependedBy.join(', ') : 'unknown';
        throw new SkildError(
          'VERSION_CONFLICT',
          formatVersionConflict({
            name: spec.canonicalName,
            installedVersion,
            requested: spec.versionOrTag,
            installedBy,
            requestedBy: dependerName
          }),
          { installDir }
        );
      }
      addDependedBy(existing, dependerName);
      await processDependenciesForSkill(existing, ctx);
      return existing;
    }

    const record = await installRegistrySkillBase(
      { spec: dep.source, registryUrl },
      { platform: ctx.platform, scope: ctx.scope, force: ctx.force },
      resolved
    );
    addDependedBy(record, dependerName);
    await processDependenciesForSkill(record, ctx);
    return record;
  }

  if (dep.sourceType === 'local') {
    throw new SkildError('INVALID_DEPENDENCY', `Dependencies cannot reference local absolute paths: ${dep.source}`);
  }

  const installName = extractSkillName(dep.source);
  const installDir = getSkillInstallDir(ctx.platform, ctx.scope, installName);
  if (fs.existsSync(installDir) && !ctx.force) {
    const existing = readInstallRecord(installDir);
    if (!existing) {
      throw new SkildError(
        'MISSING_METADATA',
        `Skill "${installName}" is missing install metadata (.skild/install.json). Use --force to reinstall.`,
        { installDir }
      );
    }
    if (existing.source !== dep.source) {
      throw new SkildError(
        'DEPENDENCY_CONFLICT',
        `Dependency conflict detected for "${installName}". Installed from ${existing.source}, requested ${dep.source}.`,
        { installDir }
      );
    }
    addDependedBy(existing, dependerName);
    await processDependenciesForSkill(existing, ctx);
    return existing;
  }

  const record = await installSkillBase(
    { source: dep.source },
    { platform: ctx.platform, scope: ctx.scope, force: ctx.force }
  );
  addDependedBy(record, dependerName);
  await processDependenciesForSkill(record, ctx);
  return record;
}

async function processInlineDependencies(
  inlineDir: string,
  rootDir: string,
  ctx: InstallContext,
  dependerName: string
): Promise<InstalledDependency[]> {
  const key = `inline:${inlineDir}`;
  if (ctx.inlineActive.has(key)) {
    throw new SkildError('DEPENDENCY_CYCLE', `Inline dependency cycle detected at ${inlineDir}`);
  }
  ctx.inlineActive.add(key);

  try {
    const frontmatter = getFrontmatterFromDir(inlineDir);
    if (!frontmatter) return [];

    const dependencies = normalizeDependencies(frontmatter.dependencies);
    const installedDeps: InstalledDependency[] = [];

    for (const depRaw of dependencies) {
      const parsed = parseDependency(depRaw, inlineDir, rootDir);
      if (parsed.sourceType === 'inline') {
        installedDeps.push({
          name: parsed.name,
          source: depRaw,
          sourceType: 'inline',
          inlinePath: parsed.inlinePath
        });
        const nested = await processInlineDependencies(parsed.inlineDir, rootDir, ctx, dependerName);
        installedDeps.push(...nested);
      } else {
        const depRecord = await ensureExternalDependencyInstalled(parsed, ctx, dependerName);
        installedDeps.push({
          name: depRecord.name,
          source: depRaw,
          sourceType: depRecord.sourceType,
          canonicalName: depRecord.canonicalName,
          installDir: depRecord.installDir
        });
      }
    }

    return installedDeps;
  } finally {
    ctx.inlineActive.delete(key);
  }
}

async function processDependenciesForSkill(record: InstallRecord, ctx: InstallContext): Promise<void> {
  const key = getDependencyKeyFromRecord(record);
  if (ctx.active.has(key)) {
    throw new SkildError('DEPENDENCY_CYCLE', `Dependency cycle detected for ${record.name}`);
  }
  ctx.active.add(key);

  try {
    const frontmatter = record.skill?.frontmatter || getFrontmatterFromDir(record.installDir);
    if (!frontmatter) return;

    const dependencies = normalizeDependencies(frontmatter.dependencies);
    const skillset = frontmatter.skillset === true;
    const installedDeps: InstalledDependency[] = [];

    for (const depRaw of dependencies) {
      const parsed = parseDependency(depRaw, record.installDir, record.installDir);
      if (parsed.sourceType === 'inline') {
        installedDeps.push({
          name: parsed.name,
          source: depRaw,
          sourceType: 'inline',
          inlinePath: parsed.inlinePath
        });
        const nested = await processInlineDependencies(parsed.inlineDir, record.installDir, ctx, record.name);
        installedDeps.push(...nested);
      } else {
        const depRecord = await ensureExternalDependencyInstalled(parsed, ctx, record.name);
        installedDeps.push({
          name: depRecord.name,
          source: depRaw,
          sourceType: depRecord.sourceType,
          canonicalName: depRecord.canonicalName,
          installDir: depRecord.installDir
        });
      }
    }

    record.skillset = skillset ? true : undefined;
    record.dependencies = dependencies.length ? dependencies : undefined;
    record.installedDependencies = installedDeps.length ? dedupeInstalledDependencies(installedDeps) : undefined;
    writeInstallRecord(record.installDir, record);
  } finally {
    ctx.active.delete(key);
  }
}

export async function installSkill(input: InstallInput, options: InstallOptions = {}): Promise<InstallRecord> {
  const ctx = createInstallContext(options);
  const record = await installSkillBase(input, options);
  await processDependenciesForSkill(record, ctx);
  return record;
}

export async function installRegistrySkill(
  input: { spec: string; registryUrl?: string; nameOverride?: string },
  options: InstallOptions = {}
): Promise<InstallRecord> {
  const ctx = createInstallContext(options, input.registryUrl);
  const record = await installRegistrySkillBase(input, options);
  await processDependenciesForSkill(record, ctx);
  return record;
}

export interface ListedSkill {
  name: string;
  installDir: string;
  hasSkillMd: boolean;
  record?: InstallRecord | null;
}

export interface ListedSkillWithContext extends ListedSkill {
  platform: Platform;
  scope: InstallScope;
}

export function listSkills(options: ListOptions = {}): ListedSkill[] {
  const { platform, scope } = resolvePlatformAndScope(options);
  const skillsDir = getSkillsDir(platform, scope);
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'));
  return entries
    .map(e => {
      const dir = path.join(skillsDir, e.name);
      const hasSkillMd = fs.existsSync(path.join(dir, 'SKILL.md'));
      const record = readInstallRecord(dir);
      return { name: e.name, installDir: dir, hasSkillMd, record };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listAllSkills(options: { scope?: InstallScope } = {}): ListedSkillWithContext[] {
  const scope = (options.scope || loadOrCreateGlobalConfig().defaultScope) as InstallScope;

  return PLATFORMS.flatMap(platform =>
    listSkills({ platform, scope }).map(s => ({
      ...s,
      platform,
      scope
    }))
  );
}

export function getSkillInfo(name: string, options: ListOptions = {}): InstallRecord {
  const { platform, scope } = resolvePlatformAndScope(options);
  const installDir = getSkillInstallDir(platform, scope, name);
  if (!fs.existsSync(installDir)) {
    throw new SkildError('SKILL_NOT_FOUND', `Skill "${name}" not found in ${getSkillsDir(platform, scope)}`, { name, platform, scope });
  }

  const record = readInstallRecord(installDir);
  if (!record) {
    throw new SkildError('MISSING_METADATA', `Skill "${name}" is missing install metadata (.skild/install.json).`, { name, installDir });
  }
  return record;
}

export function validateSkill(nameOrPath: string, options: { platform?: Platform; scope?: InstallScope } = {}): SkillValidationResult {
  const localPath = resolveLocalPath(nameOrPath);
  const dir = localPath || getSkillInstallDir((options.platform || loadOrCreateGlobalConfig().defaultPlatform) as Platform, (options.scope || loadOrCreateGlobalConfig().defaultScope) as InstallScope, nameOrPath);
  return validateSkillDir(dir);
}

export function uninstallSkill(
  name: string,
  options: InstallOptions & { allowMissingMetadata?: boolean; withDeps?: boolean } = {}
): void {
  const visited = new Set<string>();
  uninstallSkillInternal(name, options, visited);
}

function uninstallSkillInternal(
  name: string,
  options: InstallOptions & { allowMissingMetadata?: boolean; withDeps?: boolean },
  visited: Set<string>
): void {
  const { platform, scope } = resolvePlatformAndScope(options);
  const key = `${platform}:${scope}:${name}`;
  if (visited.has(key)) return;
  visited.add(key);

  const installDir = getSkillInstallDir(platform, scope, name);
  if (!fs.existsSync(installDir)) {
    throw new SkildError('SKILL_NOT_FOUND', `Skill "${name}" not found in ${getSkillsDir(platform, scope)}`, { name, platform, scope });
  }

  const record = readInstallRecord(installDir);
  if (!record && !options.allowMissingMetadata) {
    throw new SkildError('MISSING_METADATA', `Skill "${name}" is missing install metadata. Use --force to uninstall anyway.`, { name, installDir });
  }

  const dependerName = record?.name || name;
  if (record?.installedDependencies?.length) {
    for (const dep of record.installedDependencies) {
      if (dep.sourceType === 'inline') continue;
      const depInstallDir =
        dep.installDir || getSkillInstallDir(platform, scope, dep.name);
      const depRecord = readInstallRecord(depInstallDir);
      if (!depRecord) continue;
      removeDependedBy(depRecord, dependerName);
      if (options.withDeps && (!depRecord.dependedBy || depRecord.dependedBy.length === 0)) {
        uninstallSkillInternal(depRecord.name, options, visited);
      }
    }
  }

  removeDir(installDir);
  removeLockEntry(scope, name);
}

export async function updateSkill(name?: string, options: UpdateOptions = {}): Promise<InstallRecord[]> {
  const { platform, scope } = resolvePlatformAndScope(options);

  const targets = name
    ? [{ name }]
    : listSkills({ platform, scope }).map(s => ({ name: s.name }));

  const results: InstallRecord[] = [];
  for (const target of targets) {
    const record = getSkillInfo(target.name, { platform, scope });
    const now = new Date().toISOString();

    const updated =
      record.sourceType === 'registry'
        ? await installRegistrySkill(
            { spec: record.source, nameOverride: record.name, registryUrl: record.registryUrl || loadRegistryAuth()?.registryUrl },
            { platform, scope, force: true }
          )
        : await installSkill({ source: record.source, nameOverride: record.name }, { platform, scope, force: true });

    updated.installedAt = record.installedAt;
    updated.dependedBy = record.dependedBy;
    updated.updatedAt = now;
    writeInstallRecord(updated.installDir, updated);
    results.push(updated);
  }
  return results;
}
