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
  name: string;
  description: string | null;
  updated_at: string;
  versionsCount: number | string;
}

export type PublisherSkillsResponse = { ok: true; skills: MySkillItem[] } | ApiError;

export interface SkillListItem {
  name: string;
  description: string | null;
  targets_json: string | null;
  created_at: string;
  updated_at: string;
}

export type SkillsListResponse = { ok: true; skills: SkillListItem[] } | ApiError;

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
  name: string;
  description: string | null;
  targets_json: string | null;
  publisher_id: string;
  created_at: string;
  updated_at: string;
}

export type SkillDetailResponse =
  | { ok: true; skill: SkillDetail; distTags: DistTagRow[]; versions: VersionRow[] }
  | ApiError;
