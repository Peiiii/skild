import React from 'react';
import { Link } from 'react-router-dom';
import { listLinkedItems } from '@/lib/api';
import type { LinkedItemWithInstall } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { useAuth } from '@/features/auth/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LinkedItemsPage(): JSX.Element {
  const auth = useAuth();
  const authed = auth.status === 'authed';

  const [queryInput, setQueryInput] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<LinkedItemWithInstall[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await listLinkedItems(query, null, 20);
        if (!active) return;
        if (!res.ok) {
          setError(res.error);
          setItems([]);
          setNextCursor(null);
          return;
        }
        setItems(res.items);
        setNextCursor(res.nextCursor);
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
  }, [query]);

  async function loadMore(): Promise<void> {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listLinkedItems(query, nextCursor, 20);
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>Discover curated GitHub Skills.</CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link to={authed ? '/linked/new' : `/login?next=${encodeURIComponent('/linked/new')}`}>
              {authed ? '+ Submit' : 'Login to submit'}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="flex flex-wrap items-center gap-3" onSubmit={onSearch}>
          <Input
            value={queryInput}
            onChange={e => setQueryInput(e.currentTarget.value)}
            placeholder="Search skills..."
            className="min-w-[220px] flex-1"
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load catalog</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {busy ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="rounded-md border border-border/60 p-4 animate-pulse">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="mt-3 h-3 w-3/4 rounded bg-muted" />
                <div className="mt-4 h-8 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {query ? `No results for "${query}".` : 'No skills yet. Be the first to contribute!'}
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map(item => (
              <div key={item.id} className="rounded-md border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/linked/${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">Linked</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {(() => {
                        const meta: string[] = [];
                        if (item.tags.length > 0) meta.push(`🏷️ ${item.tags.join(', ')}`);
                        if (item.submittedBy) meta.push(`👤 @${item.submittedBy.handle}`);
                        if (item.createdAt) meta.push(formatRelativeTime(item.createdAt));
                        return meta.join(' · ');
                      })()}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-xs font-mono break-all">
                  {item.install}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="button" variant="outline" onClick={() => copyInstall(item.id, item.install)}>
                    {copiedId === item.id ? '✓ Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {nextCursor && !busy && (
          <div className="flex justify-center">
            <Button type="button" variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
