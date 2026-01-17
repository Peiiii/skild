import * as React from 'react';
import { Link } from 'react-router-dom';
import { listLinkedItems } from '@/lib/api';
import type { LinkedItemWithInstall } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { useAuth } from '@/features/auth/auth-store';
import { normalizeAlias, preferredInstallCommand, preferredDisplayName } from '@/lib/install';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/ui/page-hero';
import { SearchBar } from '@/components/ui/search-bar';
import { CodeBlock } from '@/components/ui/code-block';
import { SkillCard } from '@/components/ui/skill-card';
import { Plus, Github } from 'lucide-react';

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
    <div className="space-y-8">
      <PageHero
        title="Skills from GitHub"
        description="Browse and index skills directly from GitHub repositories."
        actions={
          <Button asChild variant="secondary" className="h-12 px-8 shadow-lg">
            <Link to="/linked/new" className="gap-2 font-bold uppercase tracking-widest text-xs">
              <Plus className="w-4 h-4" />
              Link Repository
            </Link>
          </Button>
        }
      />

      <SearchBar
        value={queryInput}
        onChange={setQueryInput}
        onSubmit={onSearch}
        placeholder="Search items submitted from GitHub..."
        className="mb-12"
      />

      {error && (
        <Alert variant="destructive" className="rounded-[24px] border-destructive/20 bg-destructive/5">
          <AlertTitle>Failed to load items</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {busy ? (
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
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
            {query ? `No results for "${query}".` : 'No skills yet. Be the first to contribute!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map(item => (
            <SkillCard
              key={item.id}
              id={item.id}
              type="linked"
              title={item.title}
              description={item.description}
              alias={item.alias}
              install={item.install}
              source={{
                repo: item.source.repo,
                path: item.source.path,
                url: item.source.url,
              }}
              publisher={item.submittedBy ? { handle: item.submittedBy.handle } : null}
              createdAt={item.createdAt}
              tags={item.tags}
              onCopyInstall={() => void copyInstall(item.id, item.install)}
              isCopied={copiedId === item.id}
              detailsHref={`/linked/${encodeURIComponent(item.id)}`}
            />
          ))}
        </div>
      )}

      {nextCursor && !busy && (
        <div className="flex justify-center pt-8">
          <Button type="button" variant="secondary" onClick={loadMore} disabled={loadingMore} className="h-12 px-12 rounded-full font-bold uppercase tracking-widest text-xs">
            {loadingMore ? 'Loading…' : 'Load more items'}
          </Button>
        </div>
      )}
    </div>
  );
}
