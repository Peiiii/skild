import * as React from 'react';
import { listCatalogSkills } from '@/lib/api';
import type { CatalogSkill } from '@/lib/api-types';
import { HttpError } from '@/lib/http';

export function useCatalogSkills(options?: { category?: string | null }) {
  const [queryInput, setQueryInput] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<CatalogSkill[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [installableOnly, setInstallableOnly] = React.useState(true);
  const [riskOnly, setRiskOnly] = React.useState(false);
  const [total, setTotal] = React.useState<number | null>(null);
  const category = options?.category ?? null;

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await listCatalogSkills(query, null, 20, {
          installable: installableOnly ? true : null,
          risk: riskOnly ? true : null,
          category: category || null,
        });
        if (!active) return;
        if (!res.ok) {
          setError(res.error);
          setItems([]);
          setNextCursor(null);
          setTotal(null);
          return;
        }
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setTotal(res.total);
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
        else setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [query, installableOnly, riskOnly, category]);

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listCatalogSkills(query, nextCursor, 20, {
        installable: installableOnly ? true : null,
        risk: riskOnly ? true : null,
        category: category || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems(prev => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
      setTotal(res.total);
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  async function copyInstall(itemId: string, install: string): Promise<void> {
    await navigator.clipboard.writeText(install);
    setCopiedId(itemId);
    window.setTimeout(() => {
      setCopiedId(current => (current === itemId ? null : current));
    }, 1500);
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setQuery(queryInput.trim());
  }

  return {
    queryInput,
    setQueryInput,
    query,
    setQuery,
    busy,
    loadingMore,
    error,
    items,
    nextCursor,
    total,
    copiedId,
    installableOnly,
    riskOnly,
    setInstallableOnly,
    setRiskOnly,
    loadMore,
    copyInstall,
    onSearch,
  };
}
