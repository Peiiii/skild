import React from 'react';
import { Link } from 'react-router-dom';
import { listLinkedItems } from '@/lib/api';
import type { LinkedItemWithInstall } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { useAuth } from '@/features/auth/auth-store';
import { normalizeAlias, preferredInstallCommand, preferredDisplayName } from '@/lib/install';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Github,
  Tag,
  User,
  Clock,
  Check,
  Copy,
} from 'lucide-react';

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
            <CardTitle>Skills from GitHub</CardTitle>
            <CardDescription>Browse and index skills directly from GitHub repositories.</CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link to={authed ? '/linked/new' : `/login?next=${encodeURIComponent('/linked/new')}`}>
              {authed ? '+ Submit' : 'Login to submit'}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="relative flex gap-2" onSubmit={onSearch}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={queryInput}
              onChange={e => setQueryInput(e.currentTarget.value)}
              placeholder="Search items submitted from GitHub..."
              className="pl-9 bg-secondary/30 border-border/40"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load items</AlertTitle>
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
            {items.map(item => {
              const alias = normalizeAlias(item.alias);
              const title = preferredDisplayName({ title: item.title, alias });
              const installCmd = preferredInstallCommand({ install: item.install, alias });
              return (
              <div key={item.id} className="group relative rounded-xl border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:bg-muted/5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/linked/${item.id}`} className="text-lg font-bold hover:text-primary transition-colors">
                        {title}
                      </Link>
                      <Badge variant="emerald">Linked</Badge>
                      {alias ? (
                        <Badge variant="secondary" className="h-5 text-[10px] font-mono">alias:{alias}</Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">no alias</Badge>
                      )}
                    </div>

                    {/* Repository Source */}
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                      <Github className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`https://github.com/${item.source.repo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        {item.source.repo}{item.source.path ? ` / ${item.source.path}` : ''}
                      </a>
                    </div>

                    <div className="text-sm text-muted-foreground leading-relaxed mt-1">
                      {item.description || <span className="italic opacity-60">No description provided</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] text-muted-foreground">
                      {item.submittedBy && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Submitted by:</span>
                          <span className="text-foreground/80 font-medium">@{item.submittedBy.handle}</span>
                        </div>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span className="text-foreground/80">{item.tags.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[180px]">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Install</div>
                      <div className="relative">
                        <div className="rounded-lg bg-black/40 border border-border/40 p-3 font-mono text-[11px] break-all pr-9 min-h-[40px] flex items-center">
                          {installCmd}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => void copyInstall(item.id, installCmd)}
                        >
                          {copiedId === item.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
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
