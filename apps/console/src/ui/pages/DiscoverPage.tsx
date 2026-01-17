import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { canonicalToRoute, listDiscoverItems } from '@/lib/api';
import type { DiscoverItem } from '@/lib/api-types';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag } from '@/lib/skillset';
import { normalizeAlias, preferredDisplayName, preferredInstallCommand } from '@/lib/install';
import { cn } from '@/lib/utils';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/PageLoading';
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
  ExternalLink,
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
import { SearchBar } from '@/components/ui/search-bar';
import { CodeBlock } from '@/components/ui/code-block';

export type DiscoverMode = 'skills' | 'skillsets';

export function DiscoverPage(props: { mode: DiscoverMode }): JSX.Element {
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

  const skillsetOnly = props.mode === 'skillsets';

  async function runSearch(q: string, sort = currentSort): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await listDiscoverItems(q, null, 20, sort, { skillset: skillsetOnly ? true : undefined });
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
      const res = await listDiscoverItems(query, nextCursor, 20, currentSort, { skillset: skillsetOnly ? true : undefined });
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

  React.useEffect(() => {
    void runSearch(params.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const sortLabels: Record<string, string> = {
    downloads_7d: 'Trending (7d)',
    updated: 'Recently Updated',
    new: 'Newest Arrived',
    downloads_30d: 'Popular (30d)',
  };

  const title = skillsetOnly ? 'Discover Skillsets' : 'Discover Skills';
  const subtitle = skillsetOnly
    ? 'Skillsets are curated packs that can install multiple skills in one command.'
    : 'Search and explore skills from both the official registry and the GitHub community.';

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

      <div className="flex flex-col md:flex-row items-center gap-4">
        <SearchBar
          value={queryInput}
          onChange={setQueryInput}
          onSubmit={onSubmit}
          placeholder={skillsetOnly ? 'Search skillsets by name…' : 'Search skills by name, repository, or author…'}
        />

        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-brand-forest/10 bg-brand-forest/5 hover:bg-brand-forest/10 rounded-full h-14 px-8 shadow-sm transition-all hover:shadow-lg">
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{sortLabels[currentSort] || 'Sort'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {items.map(item => {
          const id = `${item.type}:${item.sourceId}`;
          const isLinked = item.type === 'linked';
          const route = !isLinked ? canonicalToRoute(item.sourceId) : null;
          const href = isLinked ? `/linked/${encodeURIComponent(item.sourceId)}` : route ? `/skills/${route.scope}/${encodeURIComponent(route.skill)}` : undefined;
          const alias = normalizeAlias(item.alias);
          const displayTitle = preferredDisplayName({ title: item.title, alias });
          const installCmd = preferredInstallCommand({ install: item.install, alias });

          return (
            <div
              key={id}
              className={cn(
                "group relative flex flex-col rounded-[24px] border border-brand-forest/5 bg-white p-6 transition-all duration-300",
                "hover:border-brand-forest/20 hover:shadow-2xl hover:shadow-brand-forest/[0.04] hover:-translate-y-1",
                !isLinked && isSkillsetFlag(item.skillset) && "after:absolute after:inset-0 after:border after:border-brand-forest/10 after:rounded-[24px] after:-translate-x-1.5 after:translate-y-1.5 after:-z-10 before:absolute before:inset-0 before:border before:border-brand-forest/5 before:rounded-[24px] before:-translate-x-3 before:translate-y-3 before:-z-20"
              )}
            >
              <div className="flex flex-col h-full gap-4">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      {href ? (
                        <Link
                          className="text-base font-serif font-bold text-brand-forest hover:text-brand-eco transition-colors truncate max-w-[200px]"
                          to={href}
                          title={alias ? `${displayTitle} (${item.title})` : item.title}
                        >
                          {displayTitle}
                        </Link>
                      ) : (
                        <div className="text-base font-bold truncate max-w-[200px]" title={alias ? `${displayTitle} (${item.title})` : item.title}>
                          {displayTitle}
                        </div>
                      )}
                      <Badge variant={isLinked ? 'eco' : 'forest'} className="text-[10px] h-4.5 px-2 shrink-0">
                        {isLinked ? 'Linked' : 'Registry'}
                      </Badge>
                      {alias ? (
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-2 shrink-0 font-mono lower">
                          alias:{alias}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-4.5 px-2 shrink-0 border-brand-forest/10 text-brand-forest/30">
                          no alias
                        </Badge>
                      )}
                      {!isLinked && isSkillsetFlag(item.skillset) && <SkillsetBadge className="scale-90 origin-left" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-brand-forest/60 font-medium">
                    {isLinked && item.source ? (
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <Github className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.source.repo}{item.source.path ? ` / ${item.source.path}` : ''}</span>
                      </div>
                    ) : !isLinked ? (
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <Package className="h-3 w-3 shrink-0" />
                        <code className="text-[10px] bg-brand-forest/5 text-brand-forest/80 px-1.5 py-0.5 rounded truncate max-w-full font-mono">{item.sourceId}</code>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-xs text-brand-forest/50 leading-relaxed line-clamp-2 h-8 font-medium">
                    {item.description || <span className="italic opacity-40">No description provided</span>}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-brand-forest/5">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.15em] text-brand-forest/30 px-0.5">
                      <span>Install Command</span>
                      {copiedId === id && <span className="text-brand-eco animate-in fade-in slide-in-from-right-1">Copied!</span>}
                    </div>
                    <div className="relative group/install">
                      <div className="rounded-xl bg-brand-forest/[0.03] border border-brand-forest/5 p-3 font-mono text-[10px] leading-tight break-all text-brand-forest/80 pr-10 min-h-[42px] flex items-center transition-colors group-hover/install:border-brand-forest/10">
                        {installCmd}
                      </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-brand-forest/5 text-brand-forest/40"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void copyInstall(item);
                          }}
                        >
                          {copiedId === id ? <Check className="h-3.5 w-3.5 text-brand-eco" /> : <Copy className="h-3.5 w-3.5 opacity-40 group-hover/install:opacity-100 transition-opacity" />}
                        </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(item.discoverAt)}</span>
                      </div>
                      {(item.downloadsTotal > 0 || currentSort.startsWith('downloads')) && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500/80">
                          <Download className="h-3 w-3" />
                          <span>
                            {currentSort === 'downloads_7d' ? item.downloads7d :
                              currentSort === 'downloads_30d' ? item.downloads30d :
                                item.downloadsTotal}
                          </span>
                        </div>
                      )}
                    </div>
                    {isLinked && item.source?.url && (
                      <a
                        href={item.source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-brand-forest/40 hover:text-brand-eco transition-colors flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Source <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
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
