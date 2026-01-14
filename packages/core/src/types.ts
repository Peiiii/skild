export const PLATFORMS = ['claude', 'codex', 'copilot', 'antigravity'] as const;
export type Platform = (typeof PLATFORMS)[number];
export type InstallScope = 'global' | 'project';

export type SourceType = 'local' | 'github-url' | 'degit-shorthand' | 'registry';
export type DependencySourceType = SourceType | 'inline';

export interface InstallOptions {
  platform?: Platform;
  scope?: InstallScope;
  force?: boolean;
  /**
   * Registry base URL to use when resolving registry dependencies for non-registry installs (e.g. local skillsets).
   * If omitted, falls back to `SKILD_REGISTRY_URL` env var or the default registry.
   */
  registryUrl?: string;
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
  dependencies?: string[];
  skillset?: boolean;
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
  /**
   * Optional stable identifier for display and CLI input.
   * Example: "@publisher/skill" (directory name remains filesystem-safe).
   */
  canonicalName?: string;
  /**
   * For `sourceType === "registry"`, the base registry URL used when resolving this Skill.
   * Example: "https://registry.skild.sh"
   */
  registryUrl?: string;
  resolvedVersion?: string;
  platform: Platform;
  scope: InstallScope;
  source: string;
  sourceType: SourceType;
  installedAt: string;
  updatedAt?: string;
  installDir: string;
  contentHash: string;
  hasSkillMd: boolean;
  skillset?: boolean;
  dependencies?: string[];
  installedDependencies?: InstalledDependency[];
  dependedBy?: string[];
  skill?: {
    frontmatter?: SkillFrontmatter;
    validation?: SkillValidationResult;
  };
}

export interface InstalledDependency {
  name: string;
  source: string;
  sourceType: DependencySourceType;
  canonicalName?: string;
  installDir?: string;
  inlinePath?: string;
}

export interface LockEntry {
  name: string;
  platform: Platform;
  scope: InstallScope;
  source: string;
  sourceType: SourceType;
  registryUrl?: string;
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

export interface RegistryAuth {
  schemaVersion: 1;
  registryUrl: string;
  token: string;
  publisher?: {
    id?: string;
    handle?: string;
    email?: string;
  };
  updatedAt: string;
}

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
