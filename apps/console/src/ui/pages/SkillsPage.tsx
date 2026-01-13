import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { canonicalToRoute, listDiscoverItems } from '@/lib/api';
import type { DiscoverItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Github,
  Package,
  User,
  Tag,
  Clock,
  Search,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';

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

      <form className="relative flex gap-2" onSubmit={onSubmit}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={queryInput}
            onChange={e => setQueryInput(e.currentTarget.value)}
            placeholder="Search skills by name, repository, or author…"
            className="pl-9 bg-secondary/30 border-border/40 focus:bg-secondary/50 transition-colors"
          />
        </div>
        <Button type="submit" disabled={busy} className="px-6 font-semibold">
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

          return (
            <div
              key={id}
              className="group relative rounded-xl border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  {/* Header: Title & Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {href ? (
                      <Link className="text-lg font-bold hover:text-primary transition-colors truncate" to={href}>
                        {item.title}
                      </Link>
                    ) : (
                      <div className="text-lg font-bold truncate">{item.title}</div>
                    )}
                    <Badge variant={isLinked ? 'emerald' : 'indigo'}>
                      {isLinked ? 'Linked' : 'Registry'}
                    </Badge>
                  </div>

                  {/* Source Info - High Visibility */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {isLinked && item.source && (
                      <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                        <Github className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">GitHub:</span>
                        <a
                          href={item.source.url || `https://github.com/${item.source.repo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-primary hover:underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.source.repo}
                          {item.source.path ? ` / ${item.source.path}` : ''}
                        </a>
                      </div>
                    )}
                    {!isLinked && (
                      <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Registry:</span>
                        <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">{item.sourceId}</code>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    {item.description ? item.description : <span className="italic opacity-60">No description provided</span>}
                  </div>

                  {/* Footer Stats & Tags */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 border-t border-border/20">
                    {item.publisherHandle && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{isLinked ? 'Submitted by' : 'Publisher'}:</span>
                        <span className="text-foreground/80">@{item.publisherHandle}</span>
                      </div>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="text-foreground/80">{item.tags.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatRelativeTime(item.discoverAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Side */}
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                      Install Command
                    </div>
                    <div className="relative group/install">
                      <div className="rounded-lg bg-black/40 border border-border/40 p-3 font-mono text-[11px] leading-tight break-all text-foreground/90 pr-10 min-h-[44px] flex items-center">
                        {item.install}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-white/10"
                        onClick={() => void copyInstall(item)}
                      >
                        {copiedId === id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {isLinked && item.source?.url && (
                    <Button asChild variant="outline" size="sm" className="w-full text-xs h-8 border-border/40 hover:bg-secondary/50">
                      <a href={item.source.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Repo Link
                      </a>
                    </Button>
                  )}
                </div>
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
