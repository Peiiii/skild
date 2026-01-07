import fs from 'fs';
import path from 'path';
import type { GlobalConfig, InstallRecord, Lockfile, LockEntry } from './types.js';
import {
  ensureDir,
  getGlobalConfigPath,
  getGlobalLockPath,
  getProjectLockPath,
  getSkillInstallRecordPath,
  getSkillMetadataDir
} from './paths.js';
import { PLATFORMS } from './types.js';

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJsonFile(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function loadOrCreateGlobalConfig(): GlobalConfig {
  const filePath = getGlobalConfigPath();
  const existing = readJsonFile<GlobalConfig>(filePath);
  if (existing) return existing;

  const created: GlobalConfig = {
    schemaVersion: 1,
    defaultPlatform: PLATFORMS[0],
    defaultScope: 'global'
  };
  writeJsonFile(filePath, created);
  return created;
}

export function loadLockfile(lockPath: string): Lockfile | null {
  return readJsonFile<Lockfile>(lockPath);
}

export function saveLockfile(lockPath: string, lockfile: Lockfile): void {
  writeJsonFile(lockPath, lockfile);
}

export function getLockPath(scope: 'global' | 'project'): string {
  return scope === 'project' ? getProjectLockPath() : getGlobalLockPath();
}

export function loadOrCreateLockfile(scope: 'global' | 'project'): Lockfile {
  const lockPath = getLockPath(scope);
  const existing = loadLockfile(lockPath);
  if (existing) return existing;
  const created: Lockfile = { schemaVersion: 1, updatedAt: new Date().toISOString(), entries: {} };
  saveLockfile(lockPath, created);
  return created;
}

export function upsertLockEntry(scope: 'global' | 'project', entry: LockEntry): void {
  const lockfile = loadOrCreateLockfile(scope);
  lockfile.entries[entry.name] = entry;
  lockfile.updatedAt = new Date().toISOString();
  saveLockfile(getLockPath(scope), lockfile);
}

export function removeLockEntry(scope: 'global' | 'project', name: string): void {
  const lockfile = loadOrCreateLockfile(scope);
  delete lockfile.entries[name];
  lockfile.updatedAt = new Date().toISOString();
  saveLockfile(getLockPath(scope), lockfile);
}

export function readInstallRecord(installDir: string): InstallRecord | null {
  const filePath = getSkillInstallRecordPath(installDir);
  return readJsonFile<InstallRecord>(filePath);
}

export function writeInstallRecord(installDir: string, record: InstallRecord): void {
  ensureDir(getSkillMetadataDir(installDir));
  const filePath = getSkillInstallRecordPath(installDir);
  writeJsonFile(filePath, record);
}

