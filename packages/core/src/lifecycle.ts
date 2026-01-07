import path from 'path';
import fs from 'fs';
import degit from 'degit';
import type { InstallOptions, InstallRecord, ListOptions, Platform, InstallScope, LockEntry, UpdateOptions, SkillValidationResult } from './types.js';
import { classifySource, extractSkillName, resolveLocalPath, toDegitPath } from './source.js';
import { createTempDir, copyDir, hashDirectoryContent, isDirEmpty, isDirectory, removeDir, replaceDirAtomic } from './fs.js';
import { ensureDir, getSkillInstallDir, getSkillsDir } from './paths.js';
import { SkildError } from './errors.js';
import { readInstallRecord, writeInstallRecord, upsertLockEntry, loadOrCreateGlobalConfig, removeLockEntry } from './storage.js';
import { validateSkillDir } from './skill.js';

export interface InstallInput {
  source: string;
  nameOverride?: string;
}

async function cloneRemote(degitSrc: string, targetPath: string): Promise<void> {
  const emitter = degit(degitSrc, { force: true, verbose: false });
  await emitter.clone(targetPath);
}

function ensureInstallableLocalDir(sourcePath: string): void {
  if (!isDirectory(sourcePath)) {
    throw new SkildError('NOT_A_DIRECTORY', `Source path is not a directory: ${sourcePath}`, { sourcePath });
  }
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

export async function installSkill(input: InstallInput, options: InstallOptions = {}): Promise<InstallRecord> {
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
    const localPath = resolveLocalPath(source);
    if (localPath) {
      ensureInstallableLocalDir(localPath);
      copyDir(localPath, stagingDir);
    } else {
      const degitPath = toDegitPath(source);
      await cloneRemote(degitPath, stagingDir);
    }

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

export interface ListedSkill {
  name: string;
  installDir: string;
  hasSkillMd: boolean;
  record?: InstallRecord | null;
}

export function listSkills(options: ListOptions = {}): ListedSkill[] {
  const { platform, scope } = resolvePlatformAndScope(options);
  const skillsDir = getSkillsDir(platform, scope);
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory());
  return entries
    .map(e => {
      const dir = path.join(skillsDir, e.name);
      const hasSkillMd = fs.existsSync(path.join(dir, 'SKILL.md'));
      const record = readInstallRecord(dir);
      return { name: e.name, installDir: dir, hasSkillMd, record };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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

export function uninstallSkill(name: string, options: InstallOptions & { allowMissingMetadata?: boolean } = {}): void {
  const { platform, scope } = resolvePlatformAndScope(options);
  const installDir = getSkillInstallDir(platform, scope, name);
  if (!fs.existsSync(installDir)) {
    throw new SkildError('SKILL_NOT_FOUND', `Skill "${name}" not found in ${getSkillsDir(platform, scope)}`, { name, platform, scope });
  }

  const record = readInstallRecord(installDir);
  if (!record && !options.allowMissingMetadata) {
    throw new SkildError('MISSING_METADATA', `Skill "${name}" is missing install metadata. Use --force to uninstall anyway.`, { name, installDir });
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
    const updated = await installSkill({ source: record.source, nameOverride: record.name }, { platform, scope, force: true });
    updated.updatedAt = new Date().toISOString();
    writeInstallRecord(updated.installDir, updated);
    results.push(updated);
  }
  return results;
}

