import fs from 'fs';
import path from 'path';
import type {
  GlobalConfig,
  InstallRecord,
  InstalledDependency,
  Lockfile,
  LockEntry,
  RegistryAuth
} from './types.js';
import {
  ensureDir,
  getGlobalConfigPath,
  getGlobalLockPath,
  getGlobalRegistryAuthPath,
  getProjectLockPath,
  getSkillInstallDir,
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

function writeJsonFilePrivate(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Best-effort on non-POSIX environments.
  }
}

type PersistedInstalledDependency = Omit<InstalledDependency, 'installDir'> & { installDir?: string };

type PersistedInstallRecord = Omit<InstallRecord, 'installDir' | 'installedDependencies'> & {
  installDir?: string;
  installedDependencies?: PersistedInstalledDependency[];
};

function toPersistedInstallRecord(record: InstallRecord): PersistedInstallRecord {
  const { installDir: _installDir, installedDependencies, ...rest } = record;
  const sanitizedDeps = installedDependencies?.map(dep => {
    const { installDir: _depInstallDir, ...depRest } = dep;
    return depRest;
  });
  if (!sanitizedDeps) return rest;
  return { ...rest, installedDependencies: sanitizedDeps };
}

function hydrateInstallRecord(installDir: string, record: PersistedInstallRecord): InstallRecord {
  const hydrated: InstallRecord = { ...record, installDir } as InstallRecord;
  if (hydrated.installedDependencies?.length) {
    hydrated.installedDependencies = hydrated.installedDependencies.map(dep => {
      if (dep.sourceType === 'inline') return dep;
      return { ...dep, installDir: getSkillInstallDir(hydrated.platform, hydrated.scope, dep.name) };
    });
  }
  return hydrated;
}

function toPersistedLockEntry(entry: LockEntry): LockEntry {
  const { installDir: _installDir, ...rest } = entry;
  return rest;
}

function sanitizeLockfile(lockfile: Lockfile): Lockfile {
  const entries = Object.fromEntries(
    Object.entries(lockfile.entries).map(([name, entry]) => [name, toPersistedLockEntry(entry)])
  );
  return { ...lockfile, entries };
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

export function loadRegistryAuth(): RegistryAuth | null {
  return readJsonFile<RegistryAuth>(getGlobalRegistryAuthPath());
}

export function saveRegistryAuth(auth: RegistryAuth): void {
  writeJsonFilePrivate(getGlobalRegistryAuthPath(), auth);
}

export function clearRegistryAuth(): void {
  const filePath = getGlobalRegistryAuthPath();
  if (fs.existsSync(filePath)) fs.rmSync(filePath);
}

export function loadLockfile(lockPath: string): Lockfile | null {
  return readJsonFile<Lockfile>(lockPath);
}

export function saveLockfile(lockPath: string, lockfile: Lockfile): void {
  writeJsonFile(lockPath, sanitizeLockfile(lockfile));
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
  lockfile.entries[entry.name] = toPersistedLockEntry(entry);
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
  const record = readJsonFile<PersistedInstallRecord>(filePath);
  if (!record) return null;
  return hydrateInstallRecord(installDir, record);
}

export function writeInstallRecord(installDir: string, record: InstallRecord): void {
  ensureDir(getSkillMetadataDir(installDir));
  const filePath = getSkillInstallRecordPath(installDir);
  writeJsonFile(filePath, toPersistedInstallRecord(record));
}
