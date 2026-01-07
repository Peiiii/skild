export const PLATFORMS = ['claude', 'codex', 'copilot'] as const;
export type Platform = (typeof PLATFORMS)[number];
export type InstallScope = 'global' | 'project';

export type SourceType = 'local' | 'github-url' | 'degit-shorthand';

export interface InstallOptions {
  platform?: Platform;
  scope?: InstallScope;
  force?: boolean;
}

export interface ListOptions {
  platform?: Platform;
  scope?: InstallScope;
}

export interface UpdateOptions {
  platform?: Platform;
  scope?: InstallScope;
  force?: boolean;
}

export interface ValidateOptions {
  json?: boolean;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  version?: string;
  [key: string]: unknown;
}

export interface SkillValidationIssue {
  level: 'error' | 'warning';
  message: string;
  path?: string;
}

export interface SkillValidationResult {
  ok: boolean;
  issues: SkillValidationIssue[];
  frontmatter?: SkillFrontmatter;
}

export interface InstallRecord {
  schemaVersion: 1;
  name: string;
  platform: Platform;
  scope: InstallScope;
  source: string;
  sourceType: SourceType;
  installedAt: string;
  updatedAt?: string;
  installDir: string;
  contentHash: string;
  hasSkillMd: boolean;
  skill?: {
    frontmatter?: SkillFrontmatter;
    validation?: SkillValidationResult;
  };
}

export interface LockEntry {
  name: string;
  platform: Platform;
  scope: InstallScope;
  source: string;
  sourceType: SourceType;
  installedAt: string;
  updatedAt?: string;
  installDir: string;
  contentHash: string;
}

export interface Lockfile {
  schemaVersion: 1;
  updatedAt: string;
  entries: Record<string, LockEntry>;
}

export interface GlobalConfig {
  schemaVersion: 1;
  defaultPlatform: Platform;
  defaultScope: InstallScope;
}

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

