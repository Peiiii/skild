export type ApiError = { ok: false; error: string };

export type SignupResponse =
  | {
      ok: true;
      publisher: { id: string; handle: string; email: string; emailVerified: boolean };
      verification: { requiredForPublish: boolean; sent: boolean; mode: string; consoleUrl: string };
    }
  | ApiError;

export type LoginResponse =
  | { ok: true; token: string; publisher: { id: string; handle: string; email: string; emailVerified: boolean } }
  | ApiError;

export type VerifyEmailResponse =
  | { ok: true; publisher: { id: string; handle: string; email: string; emailVerified: boolean } | null }
  | ApiError;

export type RequestVerifyEmailResponse =
  | { ok: true; alreadyVerified?: boolean; sent?: boolean; mode?: string; consoleUrl?: string }
  | ApiError;

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
