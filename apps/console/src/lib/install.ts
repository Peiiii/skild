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

export function parseDependencyDisplay(dep: string): { name: string; context: string | null } {
  const trimmed = dep.trim();

  // 1. GitHub URL
  if (trimmed.startsWith('https://github.com/')) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/\/$/, '');
      const parts = path.split('/').filter(Boolean);
      // [owner, repo, tree, branch, ...path]
      const name = parts[parts.length - 1] || trimmed;
      const context = parts.slice(0, 2).join('/');
      return { name, context };
    } catch {
      // fallback
    }
  }

  // 2. Relative paths
  if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
    const parts = trimmed.split('/').filter(Boolean);
    const name = parts[parts.length - 1] || trimmed;
    return { name, context: 'Bundled' };
  }

  // 3. Registry scoped names (@scope/name@version)
  if (trimmed.startsWith('@')) {
    const parts = trimmed.split('/');
    if (parts.length >= 2) {
      const namePart = parts[1];
      const [nameNoVersion] = namePart.split('@');
      return { name: `${parts[0]}/${nameNoVersion}`, context: null };
    }
  }

  // 4. Owner/Repo/Path shorthand
  if (trimmed.includes('/') && !trimmed.startsWith('https://')) {
    const parts = trimmed.split('/');
    const name = parts[parts.length - 1] || trimmed;
    const context = parts.slice(0, 2).join('/');
    return { name, context };
  }

  return { name: trimmed, context: null };
}
