import * as React from 'react';
import { listCatalogSkills } from '@/lib/api';
import type { CatalogSkill } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { PageHero } from '@/components/ui/page-hero';
import { SearchBar } from '@/components/ui/search-bar';
import { SkillCard } from '@/components/ui/skill-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

function mergeTags(item: CatalogSkill): string[] {
  const merged = new Set<string>();
  for (const tag of item.tags || []) merged.add(tag);
  for (const topic of item.topics || []) merged.add(topic);
  if (item.hasRisk) merged.add('risk');
  if (item.usageArtifact) merged.add('artifact');
  return Array.from(merged);
}

function formatCount(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}

export function CatalogPage(): JSX.Element {
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

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await listCatalogSkills(query, null, 20, {
          installable: installableOnly ? true : null,
          risk: riskOnly ? true : null
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
  }, [query, installableOnly, riskOnly]);

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listCatalogSkills(query, nextCursor, 20, {
        installable: installableOnly ? true : null,
        risk: riskOnly ? true : null
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

  return (
    <div className="space-y-8">
      <PageHero
        title="Auto Catalog"
        description="Mass-discovered skills from GitHub, continuously indexed and ready to install."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 h-10 rounded-full border border-brand-forest/10 bg-white/70 text-xs font-bold uppercase tracking-[0.2em] text-brand-forest/60 flex items-center">
              Total {busy ? '—' : formatCount(total)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={installableOnly ? 'secondary' : 'ghost'}
                className="h-10 px-5 rounded-full text-xs font-bold uppercase tracking-widest"
                onClick={() => setInstallableOnly(current => !current)}
              >
                {installableOnly ? 'Installable only' : 'All entries'}
              </Button>
              <Button
                type="button"
                variant={riskOnly ? 'secondary' : 'ghost'}
                className="h-10 px-5 rounded-full text-xs font-bold uppercase tracking-widest"
                onClick={() => setRiskOnly(current => !current)}
              >
                {riskOnly ? 'Risky only' : 'All risk levels'}
              </Button>
            </div>
          </div>
        }
      />

      <SearchBar
        value={queryInput}
        onChange={setQueryInput}
        onSubmit={onSearch}
        placeholder="Search catalog skills..."
        className="mb-12"
      />

      {error && (
        <Alert variant="destructive" className="rounded-[24px] border-destructive/20 bg-destructive/5">
          <AlertTitle>Failed to load catalog</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {busy ? (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="rounded-[24px] border border-brand-forest/5 p-6 animate-pulse bg-white">
              <div className="h-5 w-32 rounded-full bg-brand-forest/5" />
              <div className="mt-3 h-3 w-3/4 rounded-full bg-brand-forest/5" />
              <div className="mt-8 h-10 w-full rounded-[16px] bg-brand-forest/5" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center space-y-4 bg-white/50 backdrop-blur-sm rounded-[32px] border border-brand-forest/5">
          <div className="w-16 h-16 bg-brand-forest/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Github className="h-8 w-8 text-brand-forest/20" />
          </div>
          <p className="text-brand-forest/40 font-serif italic text-xl">
            {query ? `No results for "${query}".` : 'No catalog entries yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(item => (
            <SkillCard
              key={item.id}
              id={item.id}
              type="catalog"
              title={item.name}
              description={item.description}
              install={item.install}
              source={{
                repo: item.repo,
                path: item.path || null,
                url: item.sourceUrl,
              }}
              createdAt={item.discoveredAt}
              tags={mergeTags(item)}
              onCopyInstall={() => void copyInstall(item.id, item.install)}
              isCopied={copiedId === item.id}
              detailsHref={`/catalog/${encodeURIComponent(item.id)}`}
            />
          ))}
        </div>
      )}

      {nextCursor && !busy && (
        <div className="flex justify-center pt-8">
          <Button type="button" variant="secondary" onClick={loadMore} disabled={loadingMore} className="h-12 px-12 rounded-full font-bold uppercase tracking-widest text-xs">
            {loadingMore ? 'Loading…' : 'Load more skills'}
          </Button>
        </div>
      )}
    </div>
  );
}
