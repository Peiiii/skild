import { getRegistryUrl } from './env';
import { fetchJson } from './http';
import type { LoginResponse, SignupResponse, SkillDetailResponse, SkillsListResponse } from './api-types';

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

export async function listSkills(query: string): Promise<SkillsListResponse> {
  const base = getRegistryUrl();
  const url = new URL(`${base}/skills`);
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
