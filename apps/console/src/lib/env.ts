export function getRegistryUrl(): string {
  const raw = import.meta.env.VITE_REGISTRY_URL as string | undefined;
  const hostname = globalThis.location?.hostname;

  if (import.meta.env.DEV && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    const v = raw?.trim();
    if (!v) return '/api';
    if (v.startsWith('http://localhost') || v.startsWith('http://127.0.0.1')) return '/api';
  }

  if (raw && raw.trim()) return raw.trim().replace(/\/+$/, '');

  if (import.meta.env.DEV && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return `http://${hostname}:18787`;
  }

  return 'https://registry.skild.sh';
}
