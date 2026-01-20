import type { CatalogSkill } from '@/lib/api-types';

export function collectCatalogTags(item: CatalogSkill): string[] {
  const merged = new Set<string>();
  for (const tag of item.tags || []) merged.add(tag);
  for (const topic of item.topics || []) merged.add(topic);
  return Array.from(merged);
}

export function formatCategoryLabel(input: string | null | undefined): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  return raw
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatCatalogCount(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}
