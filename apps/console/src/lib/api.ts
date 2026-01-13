import { getRegistryUrl } from './env';
import { fetchJson } from './http';
import type {
  LoginResponse,
  SignupResponse,
  SkillDetailResponse,
  SkillsListResponse,
  VerifyEmailResponse,
  RequestVerifyEmailResponse,
  SessionLoginResponse,
  MeResponse,
  TokensListResponse,
  TokenCreateResponse,
  TokenRevokeResponse,
  PublisherSkillsResponse
} from './api-types';

function newApiUrl(pathname: string): URL {
  const base = getRegistryUrl();
  if (base.startsWith('http://') || base.startsWith('https://')) return new URL(`${base}${pathname}`);
  return new URL(`${base}${pathname}`, globalThis.location?.origin ?? 'http://localhost');
}

export function canonicalToRoute(name: string): { scope: string; skill: string } | null {
  const match = name.match(/^@([^/]+)\/(.+)$/);
  if (!match) return null;
  return { scope: `@${match[1]}`, skill: match[2] };
}

export function routeToCanonical(scopeParam: string, skillParam: string): string {
  const decodedScopeParam = decodeURIComponent(scopeParam);
  const decodedSkillParam = decodeURIComponent(skillParam);
  const scope = decodedScopeParam.startsWith('@') ? decodedScopeParam.slice(1) : decodedScopeParam;
  return `@${scope}/${decodedSkillParam}`;
}

export async function signup(email: string, handle: string, password: string): Promise<SignupResponse> {
  const base = getRegistryUrl();
  return fetchJson<SignupResponse>(
    `${base}/auth/signup`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, handle, password })
    },
    10_000
  );
}

export async function login(handleOrEmail: string, password: string, tokenName?: string): Promise<LoginResponse> {
  const base = getRegistryUrl();
  return fetchJson<LoginResponse>(
    `${base}/auth/login`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handleOrEmail, password, tokenName })
    },
    10_000
  );
}

export async function sessionLogin(handleOrEmail: string, password: string): Promise<SessionLoginResponse> {
  const base = getRegistryUrl();
  return fetchJson<SessionLoginResponse>(
    `${base}/auth/session/login`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handleOrEmail, password })
    },
    10_000
  );
}

export async function sessionLogout(): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = getRegistryUrl();
  return fetchJson<{ ok: true } | { ok: false; error: string }>(
    `${base}/auth/session/logout`,
    { method: 'POST' },
    10_000
  );
}

export async function me(): Promise<MeResponse> {
  const base = getRegistryUrl();
  return fetchJson<MeResponse>(`${base}/auth/me`, {}, 10_000);
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const base = getRegistryUrl();
  return fetchJson<VerifyEmailResponse>(
    `${base}/auth/verify-email`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    },
    10_000
  );
}

export async function requestVerifyEmail(handleOrEmail: string, password: string): Promise<RequestVerifyEmailResponse> {
  const base = getRegistryUrl();
  return fetchJson<RequestVerifyEmailResponse>(
    `${base}/auth/verify-email/request`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handleOrEmail, password })
    },
    10_000
  );
}

export async function listTokens(): Promise<TokensListResponse> {
  const base = getRegistryUrl();
  return fetchJson<TokensListResponse>(`${base}/tokens`, {}, 10_000);
}

export async function createToken(name?: string): Promise<TokenCreateResponse> {
  const base = getRegistryUrl();
  return fetchJson<TokenCreateResponse>(
    `${base}/tokens`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    },
    10_000
  );
}

export async function revokeToken(tokenId: string): Promise<TokenRevokeResponse> {
  const base = getRegistryUrl();
  return fetchJson<TokenRevokeResponse>(
    `${base}/tokens/${encodeURIComponent(tokenId)}`,
    { method: 'DELETE' },
    10_000
  );
}

export async function listMySkills(): Promise<PublisherSkillsResponse> {
  const base = getRegistryUrl();
  return fetchJson<PublisherSkillsResponse>(`${base}/publisher/skills`, {}, 10_000);
}

export async function listSkills(query: string): Promise<SkillsListResponse> {
  const url = newApiUrl('/skills');
  if (query.trim()) url.searchParams.set('q', query.trim());
  url.searchParams.set('limit', '50');
  return fetchJson<SkillsListResponse>(url.toString(), {}, 10_000);
}

export async function getSkillDetail(scopeParam: string, skillParam: string): Promise<SkillDetailResponse> {
  const base = getRegistryUrl();
  const decodedScopeParam = decodeURIComponent(scopeParam);
  const decodedSkillParam = decodeURIComponent(skillParam);
  const scope = decodedScopeParam.startsWith('@') ? decodedScopeParam.slice(1) : decodedScopeParam;
  const url = `${base}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(decodedSkillParam)}`;
  return fetchJson<SkillDetailResponse>(url, {}, 10_000);
}
