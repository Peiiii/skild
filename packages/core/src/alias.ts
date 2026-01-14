import { SkildError } from './errors.js';

export function normalizeAlias(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  return v ? v : null;
}

export function isValidAlias(input: string): boolean {
  const alias = input.trim();
  if (!alias) return false;
  if (alias.length < 3 || alias.length > 64) return false;
  if (alias.includes('--')) return false;
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(alias);
}

export function assertValidAlias(input: string): void {
  const alias = input.trim();
  if (!alias) throw new SkildError('INVALID_SOURCE', 'Missing alias.');
  if (alias.length < 3 || alias.length > 64) {
    throw new SkildError('INVALID_SOURCE', 'Alias length must be between 3 and 64.');
  }
  if (alias.includes('--')) {
    throw new SkildError('INVALID_SOURCE', 'Invalid alias format: consecutive hyphens are not allowed.');
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(alias)) {
    throw new SkildError('INVALID_SOURCE', 'Invalid alias format. Use lowercase letters, numbers, and hyphens.');
  }
}

