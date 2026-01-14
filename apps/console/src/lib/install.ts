export function normalizeAlias(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  return v;
}

export function preferredInstallCommand(input: { install: string; alias?: string | null | undefined }): string {
  const alias = normalizeAlias(input.alias);
  if (alias) return `skild install ${alias}`;
  return input.install;
}

export function preferredDisplayName(input: { title: string; alias?: string | null | undefined }): string {
  const alias = normalizeAlias(input.alias);
  if (alias) return alias;
  return input.title;
}

