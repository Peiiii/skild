export function getRegistryUrl(): string {
  const raw = (import.meta.env.VITE_REGISTRY_URL as string | undefined) ?? 'https://registry.skild.sh';
  return raw.trim().replace(/\/+$/, '');
}

