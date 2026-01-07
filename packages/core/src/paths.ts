import os from 'os';
import path from 'path';
import fs from 'fs';
import type { InstallScope, Platform } from './types.js';

export function getHomeDir(): string {
  return os.homedir();
}

export function getProjectDir(): string {
  return process.cwd();
}

export function getSkildGlobalDir(): string {
  return path.join(getHomeDir(), '.skild');
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getSkillsDir(platform: Platform, scope: InstallScope): string {
  const base = scope === 'project' ? getProjectDir() : getHomeDir();
  switch (platform) {
    case 'claude':
      return path.join(base, '.claude', 'skills');
    case 'codex':
      return path.join(base, '.codex', 'skills');
    case 'copilot':
      return path.join(base, '.github', 'skills');
  }
}

export function getProjectSkildDir(): string {
  return path.join(getProjectDir(), '.skild');
}

export function getProjectLockPath(): string {
  return path.join(getProjectSkildDir(), 'lock.json');
}

export function getGlobalConfigPath(): string {
  return path.join(getSkildGlobalDir(), 'config.json');
}

export function getGlobalLockPath(): string {
  return path.join(getSkildGlobalDir(), 'lock.json');
}

export function getSkillInstallDir(platform: Platform, scope: InstallScope, skillName: string): string {
  return path.join(getSkillsDir(platform, scope), skillName);
}

export function getSkillMetadataDir(skillInstallDir: string): string {
  return path.join(skillInstallDir, '.skild');
}

export function getSkillInstallRecordPath(skillInstallDir: string): string {
  return path.join(getSkillMetadataDir(skillInstallDir), 'install.json');
}

