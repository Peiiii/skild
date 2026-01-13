import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { canonicalToRoute, listDiscoverItems } from '@/lib/api';
import type { DiscoverItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SkillsPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const [queryInput, setQueryInput] = React.useState(params.get('q') || '');
  const [query, setQuery] = React.useState(params.get('q') || '');
  const [items, setItems] = React.useState<DiscoverItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  async function runSearch(q: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await listDiscoverItems(q, null, 20);
      if (!res.ok) {
        setError(res.error);
        setItems([]);
        setNextCursor(null);
        return;
      }
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
      setItems([]);
      setNextCursor(null);
    } finally {
      setBusy(false);
    }
  }

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listDiscoverItems(query, nextCursor, 20);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems(prev => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  async function copyInstall(item: DiscoverItem): Promise<void> {
    await navigator.clipboard.writeText(item.install);
    const id = `${item.type}:${item.sourceId}`;
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId(current => (current === id ? null : current));
    }, 1500);
  }

  React.useEffect(() => {
    void runSearch(params.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const q = queryInput.trim();
    setQuery(q);
    setParams(q ? { q } : {});
    void runSearch(q);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Discover Skills</h1>
        <p className="text-muted-foreground">Search the registry and linked catalog, then copy install commands.</p>
      </div>

      <form className="flex gap-3" onSubmit={onSubmit}>
        <Input
          value={queryInput}
          onChange={e => setQueryInput(e.currentTarget.value)}
          placeholder="Search skills…"
          className="bg-secondary/50"
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {items.map(item => {
          const id = `${item.type}:${item.sourceId}`;
          const isLinked = item.type === 'linked';
          const route = !isLinked ? canonicalToRoute(item.sourceId) : null;
          const href = isLinked ? `/linked/${item.sourceId}` : route ? `/skills/${route.scope}/${encodeURIComponent(route.skill)}` : undefined;
          const meta: string[] = [];
          if (item.tags.length > 0) meta.push(`🏷️ ${item.tags.join(', ')}`);
          if (item.publisherHandle) meta.push(`👤 @${item.publisherHandle}`);
          if (item.discoverAt) meta.push(formatRelativeTime(item.discoverAt));

          return (
            <div
              key={id}
              className="group rounded-lg border border-border/50 bg-card p-5 transition-all hover:border-border hover:bg-card/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {href ? (
                      <Link className="font-semibold hover:text-primary transition-colors" to={href}>
                        {item.title}
                      </Link>
                    ) : (
                      <div className="font-semibold">{item.title}</div>
                    )}
                    <span className="text-xs text-muted-foreground">{isLinked ? 'Linked' : 'Registry'}</span>
                  </div>
                  <div className="mt-1.5 text-sm text-muted-foreground">
                    {item.description ? item.description : <span className="italic">No description</span>}
                  </div>
                  {meta.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">{meta.join(' · ')}</div>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-xs font-mono break-all">
                {item.install}
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="button" variant="outline" onClick={() => void copyInstall(item)}>
                  {copiedId === id ? '✓ Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          );
        })}
        {!busy && !error && items.length === 0 && (
          <div className="text-sm text-muted-foreground py-8 text-center">No results.</div>
        )}
      </div>

      {nextCursor && !busy && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
