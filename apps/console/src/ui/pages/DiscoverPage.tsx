import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { canonicalToRoute, listDiscoverItems } from '@/lib/api';
import type { DiscoverItem } from '@/lib/api-types';
import { preferredInstallCommand } from '@/lib/install';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/PageLoading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Download,
  Calendar,
  TrendingUp,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHero } from '@/components/ui/page-hero';
import { formatCategoryLabel } from './catalog/catalog-utils';
import { SearchBar } from '@/components/ui/search-bar';
import { SkillCard } from '@/components/ui/skill-card';

export function DiscoverPage(): JSX.Element {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [queryInput, setQueryInput] = React.useState(params.get('q') || '');
  const [query, setQuery] = React.useState(params.get('q') || '');
  const [items, setItems] = React.useState<DiscoverItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [currentSort, setCurrentSort] = React.useState(params.get('sort') || 'downloads_7d');

  const typeFilter = (params.get('type') || '').trim().toLowerCase();
  const categoryFilter = (params.get('category') || '').trim();
  const skillsetOnly = typeFilter === 'skillset';

  async function runSearch(q: string, sort = currentSort): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await listDiscoverItems(q, null, 20, sort, {
        skillset: skillsetOnly ? true : undefined,
        category: categoryFilter || null,
      });
      if (!res.ok) {
        setError(res.error);
        setItems([]);
        setNextCursor(null);
        return;
      }
      const newTotal = typeof res.total === 'number' ? res.total : null;
      const newCursor = res.nextCursor && res.items.length > 0 ? res.nextCursor : null;
      setItems(res.items);
      setNextCursor(newTotal !== null && res.items.length >= newTotal ? null : newCursor);
      setTotal(newTotal);
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
      const res = await listDiscoverItems(query, nextCursor, 20, currentSort, {
        skillset: skillsetOnly ? true : undefined,
        category: categoryFilter || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const newTotal = typeof res.total === 'number' ? res.total : null;
      setItems(prev => {
        const merged = [...prev, ...res.items];
        if (res.items.length === 0 || (res.nextCursor && res.nextCursor === nextCursor)) {
          setNextCursor(null);
          return merged;
        }
        if (newTotal !== null && merged.length >= newTotal) {
          setNextCursor(null);
          return merged;
        }
        setNextCursor(res.nextCursor || null);
        return merged;
      });
      setTotal(newTotal);
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  async function copyInstall(item: DiscoverItem): Promise<void> {
    await navigator.clipboard.writeText(preferredInstallCommand({ install: item.install, alias: item.alias }));
    const id = `${item.type}:${item.sourceId}`;
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId(current => (current === id ? null : current));
    }, 1500);
  }

  const queryParam = params.get('q') || '';

  React.useEffect(() => {
    const q = queryParam;
    setQueryInput(q);
    setQuery(q);
    void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter, queryParam]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const q = queryInput.trim();
    setQuery(q);
    setParams(p => {
      const newParams = new URLSearchParams(p);
      if (q) newParams.set('q', q);
      else newParams.delete('q');
      return newParams;
    });
    void runSearch(q);
  }

  function onSortChange(s: string): void {
    setCurrentSort(s);
    setParams(p => {
      const newParams = new URLSearchParams(p);
      newParams.set('sort', s);
      return newParams;
    });
    void runSearch(query, s);
  }

  function setTypeFilter(next: 'all' | 'skillset'): void {
    setParams(p => {
      const newParams = new URLSearchParams(p);
      if (next === 'skillset') newParams.set('type', 'skillset');
      else newParams.delete('type');
      return newParams;
    });
  }

  function clearCategory(): void {
    setParams(p => {
      const newParams = new URLSearchParams(p);
      newParams.delete('category');
      return newParams;
    });
  }

  const sortLabels: Record<string, string> = {
    downloads_7d: 'Trending (7d)',
    updated: 'Recently Updated',
    new: 'Newest Arrived',
    downloads_30d: 'Popular (30d)',
  };

  const title = 'Discover';
  const subtitle = skillsetOnly
    ? 'Skillsets are curated packs that can install multiple skills in one command.'
    : 'Search and explore skills from the registry, curated GitHub sources, and the auto-index.';

  return (
    <div className="space-y-8">
      <PageHero
        title={title}
        description={subtitle}
      />

      {/* Skillsets Intro Card */}
      {skillsetOnly && (
        <div className="relative overflow-hidden rounded-[32px] border border-brand-forest/10 bg-white p-8 shadow-xl shadow-brand-forest/[0.02]">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-eco/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎁</span>
                <h2 className="text-xl font-serif font-bold text-brand-forest">What is a Skillset?</h2>
              </div>
              <p className="text-sm text-brand-forest/60 leading-relaxed font-medium">
                A <strong className="text-brand-forest">Skillset</strong> is a curated bundle of related skills.
                Instead of installing skills one by one, you get a complete toolkit with a single command.
                Perfect for <span className="text-brand-forest italic">data analysts</span>, <span className="text-brand-eco italic">developers</span>, or anyone who needs a ready-to-use workflow.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://github.com/Peiiii/skild/blob/main/docs/skillsets.md"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-forest hover:text-brand-eco transition-colors"
                >
                  Learn more →
                </a>
                <Button
                  variant="ghost"
                  className="h-9 px-4 text-xs font-bold bg-brand-forest/5 hover:bg-brand-forest/10 text-brand-forest rounded-full border border-brand-forest/10 gap-1.5 transition-all"
                  onClick={() => navigate('/linked/new?from=skillset')}
                >
                  <span>✨</span>
                  Submit your own skillset
                </Button>
              </div>
            </div>
            <div className="rounded-2xl bg-brand-forest text-white p-6 font-mono text-xs shadow-2xl shadow-brand-forest/20">
              <div className="text-white/40 mb-2"># Install a data analyst pack</div>
              <div className="text-brand-eco font-bold">skild install @scope/data-analyst-pack</div>
              <div className="mt-4 text-white/40"># All bundled skills are installed</div>
              <div className="text-brand-eco">✓ csv, pandas, sql-helper...</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <SearchBar
            value={queryInput}
            onChange={setQueryInput}
            onSubmit={onSubmit}
            placeholder={skillsetOnly ? 'Search skillsets by name…' : 'Search skills by name, repository, or author…'}
            className="flex-1 min-w-[260px]"
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={skillsetOnly ? 'ghost' : 'secondary'}
              className="h-9 px-4 rounded-full text-xs font-bold uppercase tracking-widest"
              onClick={() => setTypeFilter('all')}
            >
              All
            </Button>
            <Button
              type="button"
              variant={skillsetOnly ? 'secondary' : 'ghost'}
              className="h-9 px-4 rounded-full text-xs font-bold uppercase tracking-widest"
              onClick={() => setTypeFilter('skillset')}
            >
              Skillsets
            </Button>
          </div>

          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-brand-forest/10 bg-brand-forest/5 hover:bg-brand-forest/10 rounded-full h-14 px-8 shadow-sm transition-all hover:shadow-lg">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{sortLabels[currentSort] || 'Sort'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white shadow-2xl shadow-brand-forest/20 border-brand-forest/10">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSortChange('downloads_7d')} className="gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Trending (7d)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('updated')} className="gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Recently Updated</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('new')} className="gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Newest Arrived</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('downloads_30d')} className="gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Popular (30d)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {categoryFilter && (
          <div className="flex items-center gap-2 text-xs text-brand-forest/60">
            <span>Category:</span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em]">
              {formatCategoryLabel(categoryFilter) || categoryFilter}
            </Badge>
            <Button type="button" variant="ghost" className="h-7 px-2 text-xs" onClick={clearCategory}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!busy && !error && (
        <div className="text-[10px] uppercase tracking-widest font-bold text-brand-forest/30 px-2">
          {total != null && total >= 0
            ? `${total} result${total === 1 ? '' : 's'} discovered`
            : `${items.length} result${items.length === 1 ? '' : 's'} found`}
        </div>
      )}

      {busy && items.length === 0 && (
        <PageLoading />
      )}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map(item => {
          const id = `${item.type}:${item.sourceId}`;
          return (
            <SkillCard
              key={id}
              id={item.sourceId}
              type={item.type}
              title={item.title}
              description={item.description}
              alias={item.alias}
              install={item.install}
              skillset={item.skillset}
              source={item.source}
              publisher={{ handle: item.publisherHandle || 'unknown' }}
              createdAt={item.discoverAt}
              downloads={{
                total: item.downloadsTotal,
                sevenDays: item.downloads7d,
                thirtyDays: item.downloads30d,
              }}
              tags={item.tags}
              category={item.category ? { id: item.category, label: formatCategoryLabel(item.category) } : null}
              hasRisk={item.hasRisk}
              usageArtifact={item.usageArtifact}
              currentSort={currentSort}
              onCopyInstall={() => void copyInstall(item)}
              isCopied={copiedId === id}
              href={(() => {
                const isLinked_ = item.type === 'linked';
                if (item.type === 'catalog') return `/catalog/${encodeURIComponent(item.sourceId)}`;
                if (isLinked_) return `/linked/${encodeURIComponent(item.sourceId)}`;
                const route = canonicalToRoute(item.sourceId);
                return route ? `/skills/${route.scope}/${encodeURIComponent(route.skill)}` : undefined;
              })()}
            />
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
