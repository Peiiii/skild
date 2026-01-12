const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;
const SKILL_SEGMENT_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
const SKILL_NAME_RE = /^@[a-z0-9][a-z0-9-]{1,31}\/[a-z0-9][a-z0-9-]{1,63}$/;
const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function assertHandle(handle: string): void {
  if (!HANDLE_RE.test(handle)) {
    throw new Error("Invalid handle. Use lowercase letters, digits, and dashes (2-32 chars).");
  }
}

export function assertSkillSegment(name: string): void {
  if (!SKILL_SEGMENT_RE.test(name)) {
    throw new Error("Invalid skill segment. Use lowercase letters, digits, and dashes (2-64 chars).");
  }
}

export function assertSkillName(name: string): void {
  if (!SKILL_NAME_RE.test(name)) {
    throw new Error("Invalid skill name. Expected format: @publisher/skill (lowercase letters/digits/dashes).");
  }
}

export function assertSemver(version: string): void {
  if (!SEMVER_RE.test(version)) {
    throw new Error("Invalid version. Expected semver like 1.2.3");
  }
}

export function parseScopeFromSkillName(name: string): string {
  const match = name.match(/^@([^/]+)\//);
  if (!match) throw new Error("Invalid skill name.");
  return match[1];
}
