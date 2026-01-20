export type ApiError = { ok: false; error: string };

export interface Publisher {
  id: string;
  handle: string;
  email: string;
  emailVerified: boolean;
  created_at?: string;
}

export type SignupResponse =
  | {
    ok: true;
    publisher: Publisher;
    verification: { requiredForPublish: boolean; sent: boolean; mode: string; consoleUrl: string };
  }
  | ApiError;

export type LoginResponse =
  | { ok: true; token: string; publisher: Publisher }
  | ApiError;

export type SessionLoginResponse = { ok: true; publisher: Publisher } | ApiError;

export type VerifyEmailResponse =
  | { ok: true; publisher: Publisher | null }
  | ApiError;

export type RequestVerifyEmailResponse =
  | { ok: true; alreadyVerified?: boolean; sent?: boolean; mode?: string; consoleUrl?: string }
  | ApiError;

export type MeResponse = { ok: true; publisher: Publisher | null } | ApiError;

export interface TokenMeta {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export type TokensListResponse = { ok: true; tokens: TokenMeta[] } | ApiError;
export type TokenCreateResponse = { ok: true; token: string; tokenMeta: TokenMeta } | ApiError;
export type TokenRevokeResponse = { ok: true; revoked: boolean } | ApiError;

export interface MySkillItem {
  id: string;
  name: string;
  description: string | null;
  alias?: string | null;
  skillset?: boolean;
  updated_at: string;
  versionsCount: number | string;
  downloadsTotal?: number;
  downloads7d?: number;
  downloads30d?: number;
}

export type PublisherSkillsResponse = { ok: true; skills: MySkillItem[] } | ApiError;

export type PublisherLinkedItemsResponse =
  | { ok: true; items: LinkedItemWithInstall[] }
  | ApiError;

export interface LinkedItem {
  id: string;
  alias?: string | null;
  source: { provider: 'github'; repo: string; path: string | null; ref: string | null; url: string | null };
  title: string;
  description: string;
  license: string | null;
  category: string | null;
  tags: string[];
  submittedBy: { id: string; handle: string } | null;
  createdAt: string;
  updatedAt: string;
  downloadsTotal?: number;
  downloads7d?: number;
  downloads30d?: number;
}

export type LinkedItemWithInstall = LinkedItem & { install: string };

export type LinkedItemsListResponse = { ok: true; items: LinkedItemWithInstall[]; nextCursor: string | null } | ApiError;
export type LinkedItemDetailResponse = { ok: true; item: LinkedItem; install: string } | ApiError;
export type LinkedItemCreateResponse = { ok: true; item: LinkedItem; install: string } | ApiError;
export type LinkedItemParseResponse =
  | { ok: true; source: LinkedItem['source']; defaults: { title: string; description: string }; install: string }
  | ApiError;

export interface SkillListItem {
  id: string;
  name: string;
  description: string | null;
  targets_json: string | null;
  skillset?: boolean;
  alias?: string | null;
  created_at: string;
  updated_at: string;
}

export type SkillsListResponse =
  | { ok: true; skills: SkillListItem[]; deprecated?: boolean; replacement?: string }
  | ApiError;

export interface DiscoverItem {
  type: 'registry' | 'linked';
  sourceId: string;
  alias?: string | null;
  title: string;
  description: string;
  tags: string[];
  install: string;
  publisherHandle: string | null;
  skillset?: boolean;
  source: { repo: string | null; path: string | null; ref: string | null; url: string | null } | null;
  discoverAt: string;
  createdAt: string;
  updatedAt: string;
  downloadsTotal: number;
  downloads7d: number;
  downloads30d: number;
}

export type DiscoverListResponse = { ok: true; items: DiscoverItem[]; nextCursor: string | null; total: number } | ApiError;

export interface CatalogSkill {
  id: string;
  repo: string;
  path: string;
  name: string;
  description: string;
  category: string | null;
  tags: string[];
  topics: string[];
  sourceRef: string | null;
  sourceUrl: string | null;
  install: string;
  discoveredAt: string;
  lastSeen: string;
  starsTotal: number | null;
  licenseSpdx: string | null;
  hasRisk: boolean;
  usageArtifact: boolean;
  installable: boolean;
}

export interface CatalogRepo {
  repo: string;
  sourceType: string;
  sourceUrl: string | null;
  defaultBranch: string | null;
  description: string | null;
  homepage: string | null;
  topics: string[];
  licenseSpdx: string | null;
  starsTotal: number | null;
  forksTotal: number | null;
  updatedAt: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  lastSeen: string | null;
  lastScannedAt: string | null;
  scanStatus: string | null;
  scanError: string | null;
  isSkillRepo: boolean;
  hasRisk: boolean;
  riskEvidence: string | null;
}

export type CatalogSkillsListResponse =
  | { ok: true; items: CatalogSkill[]; nextCursor: string | null; total: number }
  | ApiError;

export type CatalogSkillDetailResponse =
  | {
    ok: true;
    skill: CatalogSkill;
    repo: CatalogRepo | null;
    snapshotKey: string | null;
    riskEvidence: string[];
    snapshot: { skillMd: string | null; readmeMd: string | null; meta: Record<string, unknown> | null } | null;
  }
  | ApiError;

export type CatalogRepoDetailResponse =
  | { ok: true; repo: CatalogRepo; skills: CatalogSkill[] }
  | ApiError;

export interface CatalogCategory {
  id: string;
  label: string;
  description: string;
  total: number;
  installableTotal: number;
  riskTotal: number;
}

export type CatalogCategoriesResponse =
  | { ok: true; items: CatalogCategory[] }
  | ApiError;

export interface DistTagRow {
  tag: string;
  version: string;
  updated_at: string;
}

export interface VersionRow {
  version: string;
  integrity: string;
  artifact_key: string;
  published_at: string;
}

export interface SkillDetail {
  id: string;
  name: string;
  description: string | null;
  targets_json: string | null;
  skillset?: boolean;
  dependencies_json?: string | null;
  alias?: string | null;
  publisher_id: string;
  created_at: string;
  updated_at: string;
}

export type SkillDetailResponse =
  | { ok: true; skill: SkillDetail; distTags: DistTagRow[]; versions: VersionRow[] }
  | ApiError;

export interface EntityStats {
  total: number;
  window: string;
  trend: { day: string; downloads: number }[];
}

export type EntityStatsResponse = ({ ok: true } & EntityStats) | ApiError;

export interface LeaderboardItem {
  type: 'registry' | 'linked';
  sourceId: string;
  title: string;
  install: string;
  downloads: number;
}

export type LeaderboardResponse =
  | { ok: true; period: string; items: LeaderboardItem[] }
  | ApiError;
