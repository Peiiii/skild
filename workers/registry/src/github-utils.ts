export function normalizeRepo(input: string): string {
  const raw = input.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  const match = raw.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) throw new Error("Invalid repo. Expected owner/repo.");
  return `${match[1]}/${match[2]}`;
}

export function normalizePath(path: string | null | undefined): string | null {
  const value = (path ?? "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!value) return null;
  if (value.includes("..")) throw new Error("Invalid path.");
  return value;
}

export function normalizeRef(ref: string | null | undefined): string | null {
  const value = (ref ?? "").trim();
  if (!value) return null;
  if (value.length > 200) throw new Error("Invalid ref.");
  return value;
}

const DEFAULT_BRANCH_REFS = new Set(["main", "master"]);

function normalizeInstallRef(ref: string | null): string | null {
  if (!ref) return null;
  const lower = ref.toLowerCase();
  if (DEFAULT_BRANCH_REFS.has(lower)) return null;
  return ref;
}

export function buildGithubUrl(input: { repo: string; path: string | null; ref: string | null }): string {
  const ref = input.ref ?? "main";
  const path = input.path ? `/${input.path}` : "";
  return `https://github.com/${input.repo}/tree/${encodeURIComponent(ref)}${path}`;
}

export function buildDegitSpec(input: { repo: string; path: string | null; ref: string | null }): string {
  const path = input.path ? `/${input.path}` : "";
  const refValue = normalizeInstallRef(input.ref);
  const ref = refValue ? `#${refValue}` : "";
  return `${input.repo}${path}${ref}`;
}

export function formatInstallSpec(input: { repo: string; path: string | null; ref: string | null }): string {
  const spec = buildDegitSpec(input);
  if (/#/.test(spec) || /\s/.test(spec)) return `"${spec}"`;
  return spec;
}

export function normalizeGithubSource(input: {
  repo: string;
  path?: string | null;
  ref?: string | null;
}): { repo: string; path: string | null; ref: string | null; url: string } {
  const repo = normalizeRepo(input.repo);
  const path = normalizePath(input.path ?? null);
  const ref = normalizeRef(input.ref ?? null);
  return { repo, path, ref, url: buildGithubUrl({ repo, path, ref }) };
}
