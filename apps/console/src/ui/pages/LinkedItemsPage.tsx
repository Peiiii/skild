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
import { Github, Tag, User, Clock, Package } from 'lucide-react';

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
            <Link to={authed ? '/linked/new' : `/login?next=${encodeURIComponent('/linked/new')}`}>
              {authed ? '+ Submit Skill' : 'Login to submit'}
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
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="rounded-[32px] border border-brand-forest/5 p-8 animate-pulse bg-white">
              <div className="h-6 w-48 rounded-full bg-brand-forest/5" />
              <div className="mt-4 h-4 w-3/4 rounded-full bg-brand-forest/5" />
              <div className="mt-6 h-12 w-full rounded-[16px] bg-brand-forest/5" />
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
          {items.map(item => {
            const alias = normalizeAlias(item.alias);
            const title = preferredDisplayName({ title: item.title, alias });
            const installCmd = preferredInstallCommand({ install: item.install, alias });
            return (
              <Card key={item.id} className="group p-8 hover:border-brand-forest/20 transition-all hover:shadow-2xl hover:shadow-brand-forest/5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link to={`/linked/${encodeURIComponent(item.id)}`} className="text-2xl font-serif font-bold text-brand-forest hover:text-brand-eco transition-colors">
                        {title}
                      </Link>
                      <Badge variant="eco">Linked</Badge>
                      {alias ? (
                        <Badge variant="forest" className="font-mono lowercase tracking-normal bg-brand-forest/5 border-none text-[10px]">{alias}</Badge>
                      ) : (
                        <Badge variant="outline" className="opacity-30 border-brand-forest/20 text-[10px]">no alias</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-brand-forest/60">
                      <div className="w-6 h-6 rounded-full bg-brand-forest/5 flex items-center justify-center">
                        <Github className="h-3.5 w-3.5 text-brand-forest" />
                      </div>
                      <a
                        href={`https://github.com/${item.source.repo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand-forest transition-colors flex items-center gap-1"
                      >
                        {item.source.repo}{item.source.path ? <><span className="opacity-30">/</span>{item.source.path}</> : ''}
                      </a>
                    </div>

                    <p className="text-base text-brand-forest/70 leading-relaxed italic">
                      {item.description || "No description provided"}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                      {item.submittedBy && (
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-forest/40">
                          <User className="h-3 w-3" />
                          <span>By <span className="text-brand-forest">@{item.submittedBy.handle}</span></span>
                        </div>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-forest/40">
                          <Tag className="h-3 w-3" />
                          <div className="flex gap-1.5 font-mono text-[9px] lowercase tracking-normal">
                             {item.tags.map(tag => (
                               <span key={tag} className="bg-brand-forest/5 px-2 py-0.5 rounded-full">{tag}</span>
                             ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-forest/40">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-80 flex-shrink-0">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-forest/30 ml-1">
                         <Package className="w-3 h-3" />
                         Install
                       </div>
                       <CodeBlock copyValue={installCmd} className="shadow-none" innerClassName="p-4 bg-brand-forest/5 border-none text-brand-forest rounded-[20px]">
                         {installCmd}
                       </CodeBlock>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
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
