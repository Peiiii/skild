import { getRegistryUrl } from './env';
import { fetchJson } from './http';
import type {
  LoginResponse,
  SignupResponse,
  SkillDetailResponse,
  SkillsListResponse,
  DiscoverListResponse,
  VerifyEmailResponse,
  RequestVerifyEmailResponse,
  SessionLoginResponse,
  MeResponse,
  TokensListResponse,
  TokenCreateResponse,
  TokenRevokeResponse,
  PublisherSkillsResponse,
  PublisherLinkedItemsResponse,
  LinkedItemsListResponse,
  LinkedItemDetailResponse,
  LinkedItemCreateResponse,
  LinkedItemParseResponse,
  EntityStatsResponse,
  LeaderboardResponse
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
      credentials: 'include',
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
      credentials: 'include',
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
    { method: 'POST', credentials: 'include' },
    10_000
  );
}

export async function me(): Promise<MeResponse> {
  const base = getRegistryUrl();
  return fetchJson<MeResponse>(`${base}/auth/me`, { credentials: 'include' }, 10_000);
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
  return fetchJson<TokensListResponse>(`${base}/tokens`, { credentials: 'include' }, 10_000);
}

export async function createToken(name?: string): Promise<TokenCreateResponse> {
  const base = getRegistryUrl();
  return fetchJson<TokenCreateResponse>(
    `${base}/tokens`,
    {
      method: 'POST',
      credentials: 'include',
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
    { method: 'DELETE', credentials: 'include' },
    10_000
  );
}

export async function listMySkills(): Promise<PublisherSkillsResponse> {
  const base = getRegistryUrl();
  return fetchJson<PublisherSkillsResponse>(`${base}/publisher/skills`, { credentials: 'include' }, 10_000);
}

export async function listMyLinkedItems(): Promise<PublisherLinkedItemsResponse> {
  const base = getRegistryUrl();
  return fetchJson<PublisherLinkedItemsResponse>(`${base}/publisher/linked-items`, { credentials: 'include' }, 10_000);
}

export async function updateSkillAlias(
  scopeParam: string,
  skillParam: string,
  alias: string | null
): Promise<{ ok: true; name: string; alias: string | null } | { ok: false; error: string }> {
  const base = getRegistryUrl();
  const decodedScopeParam = decodeURIComponent(scopeParam);
  const decodedSkillParam = decodeURIComponent(skillParam);
  const scope = decodedScopeParam.startsWith('@') ? decodedScopeParam.slice(1) : decodedScopeParam;
  const url = `${base}/publisher/skills/${encodeURIComponent(scope)}/${encodeURIComponent(decodedSkillParam)}/alias`;
  return fetchJson<{ ok: true; name: string; alias: string | null } | { ok: false; error: string }>(
    url,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alias })
    },
    10_000
  );
}

export async function deleteSkill(
  scopeParam: string,
  skillParam: string
): Promise<{ ok: true; deleted: boolean; name: string } | { ok: false; error: string }> {
  const base = getRegistryUrl();
  const decodedScopeParam = decodeURIComponent(scopeParam);
  const decodedSkillParam = decodeURIComponent(skillParam);
  const scope = decodedScopeParam.startsWith('@') ? decodedScopeParam.slice(1) : decodedScopeParam;
  const url = `${base}/publisher/skills/${encodeURIComponent(scope)}/${encodeURIComponent(decodedSkillParam)}`;
  return fetchJson<{ ok: true; deleted: boolean; name: string } | { ok: false; error: string }>(
    url,
    { method: 'DELETE', credentials: 'include' },
    10_000
  );
}

export async function deleteLinkedItem(
  id: string
): Promise<{ ok: true; deleted: boolean; id: string } | { ok: false; error: string }> {
  const base = getRegistryUrl();
  const url = `${base}/publisher/linked-items/${encodeURIComponent(id)}`;
  return fetchJson<{ ok: true; deleted: boolean; id: string } | { ok: false; error: string }>(
    url,
    { method: 'DELETE', credentials: 'include' },
    10_000
  );
}

export async function updateLinkedItemAlias(
  id: string,
  alias: string | null
): Promise<{ ok: true; id: string; alias: string | null } | { ok: false; error: string }> {
  const base = getRegistryUrl();
  const url = `${base}/publisher/linked-items/${encodeURIComponent(id)}/alias`;
  return fetchJson<{ ok: true; id: string; alias: string | null } | { ok: false; error: string }>(
    url,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alias })
    },
    10_000
  );
}

export async function listLinkedItems(query: string, cursor?: string | null, limit = 20): Promise<LinkedItemsListResponse> {
  const url = newApiUrl('/linked-items');
  if (query.trim()) url.searchParams.set('q', query.trim());
  if (cursor) url.searchParams.set('cursor', cursor);
  url.searchParams.set('limit', String(limit));
  return fetchJson<LinkedItemsListResponse>(url.toString(), {}, 10_000);
}

export async function getLinkedItem(id: string): Promise<LinkedItemDetailResponse> {
  const url = newApiUrl(`/linked-items/${encodeURIComponent(id)}`);
  return fetchJson<LinkedItemDetailResponse>(url.toString(), {}, 10_000);
}

export async function parseLinkedItemUrl(url: string): Promise<LinkedItemParseResponse> {
  const apiUrl = newApiUrl('/linked-items/parse');
  return fetchJson<LinkedItemParseResponse>(
    apiUrl.toString(),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url })
    },
    10_000
  );
}

export async function createLinkedItem(input: {
  source: { provider: 'github'; repo?: string | null; path?: string | null; ref?: string | null; url?: string | null };
  title?: string | null;
  description?: string | null;
  license?: string | null;
  category?: string | null;
  tags?: string[];
}): Promise<LinkedItemCreateResponse> {
  const url = newApiUrl('/linked-items');
  return fetchJson<LinkedItemCreateResponse>(
    url.toString(),
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    },
    10_000
  );
}

export async function listSkills(query: string): Promise<SkillsListResponse> {
  const url = newApiUrl('/skills');
  if (query.trim()) url.searchParams.set('q', query.trim());
  url.searchParams.set('limit', '50');
  return fetchJson<SkillsListResponse>(url.toString(), {}, 10_000);
}

export async function listDiscoverItems(
  query: string,
  cursor?: string | null,
  limit = 20,
  sort = 'updated',
  options?: { skillset?: boolean }
): Promise<DiscoverListResponse> {
  const url = newApiUrl('/discover');
  if (query.trim()) url.searchParams.set('q', query.trim());
  if (cursor) url.searchParams.set('cursor', encodeURIComponent(cursor));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('sort', sort);
  if (options?.skillset !== undefined) url.searchParams.set('skillset', options.skillset ? '1' : '0');
  return fetchJson<DiscoverListResponse>(url.toString(), {}, 10_000);
}

export async function getSkillStats(scope: string, skill: string, window = '30d'): Promise<EntityStatsResponse> {
  const s = scope.startsWith('@') ? scope.slice(1) : scope;
  const url = newApiUrl(`/stats/registry/${encodeURIComponent(s)}/${encodeURIComponent(skill)}`);
  url.searchParams.set('window', window);
  return fetchJson<EntityStatsResponse>(url.toString(), {}, 10_000);
}

export async function getLinkedItemStats(id: string, window = '30d'): Promise<EntityStatsResponse> {
  const url = newApiUrl(`/stats/linked-items/${encodeURIComponent(id)}`);
  url.searchParams.set('window', window);
  return fetchJson<EntityStatsResponse>(url.toString(), {}, 10_000);
}

export async function getLeaderboard(
  type: 'all' | 'registry' | 'linked' = 'all',
  period: '7d' | '30d' | '90d' = '7d',
  limitSize = 20
): Promise<LeaderboardResponse> {
  const url = newApiUrl('/leaderboard');
  url.searchParams.set('type', type);
  url.searchParams.set('period', period);
  url.searchParams.set('limit', String(limitSize));
  return fetchJson<LeaderboardResponse>(url.toString(), {}, 10_000);
}

export async function getSkillDetail(scopeParam: string, skillParam: string): Promise<SkillDetailResponse> {
  const base = getRegistryUrl();
  const decodedScopeParam = decodeURIComponent(scopeParam);
  const decodedSkillParam = decodeURIComponent(skillParam);
  const scope = decodedScopeParam.startsWith('@') ? decodedScopeParam.slice(1) : decodedScopeParam;
  const url = `${base}/skills/${encodeURIComponent(scope)}/${encodeURIComponent(decodedSkillParam)}`;
  return fetchJson<SkillDetailResponse>(url, {}, 10_000);
}
