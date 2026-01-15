import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { canonicalToRoute, listDiscoverItems } from '@/lib/api';
import type { DiscoverItem } from '@/lib/api-types';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag } from '@/lib/skillset';
import { normalizeAlias, preferredDisplayName, preferredInstallCommand } from '@/lib/install';
import { cn } from '@/lib/utils';
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

export type DiscoverMode = 'skills' | 'skillsets';

export function DiscoverPage(props: { mode: DiscoverMode }): JSX.Element {
  const [params, setParams] = useSearchParams();
  const [queryInput, setQueryInput] = React.useState(params.get('q') || '');
  const [query, setQuery] = React.useState(params.get('q') || '');
  const [items, setItems] = React.useState<DiscoverItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
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
      const res = await listDiscoverItems(query, nextCursor, 20, currentSort, { skillset: skillsetOnly ? true : undefined });
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Skillsets Intro Card */}
      {skillsetOnly && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-2 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <h2 className="text-lg font-bold">What is a Skillset?</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A <strong className="text-foreground">Skillset</strong> is a curated bundle of related skills.
                Instead of installing skills one by one, you get a complete toolkit with a single command.
                Perfect for <span className="text-indigo-400">data analysts</span>, <span className="text-purple-400">developers</span>, or anyone who needs a ready-to-use workflow.
              </p>
              <a
                href="https://github.com/Peiiii/skild/blob/main/docs/skillsets.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Learn more →
              </a>
            </div>
            <div className="rounded-xl bg-black/40 border border-border/40 p-4 font-mono text-xs">
              <div className="text-muted-foreground mb-2"># Install a data analyst pack</div>
              <div className="text-indigo-300">skild install @scope/data-analyst-pack</div>
              <div className="mt-3 text-muted-foreground"># All bundled skills are installed</div>
              <div className="text-emerald-400">✓ csv, pandas, sql-helper...</div>
            </div>
          </div>
        </div>
      )}

      <form className="relative flex gap-2" onSubmit={onSubmit}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={queryInput}
            onChange={e => setQueryInput(e.currentTarget.value)}
            placeholder={skillsetOnly ? 'Search skillsets by name…' : 'Search skills by name, repository, or author…'}
            className="pl-9 bg-secondary/30 border-border/40 focus:bg-secondary/50 transition-colors"
          />
        </div>
        <Button type="submit" disabled={busy} className="px-6 font-semibold">
          {busy ? 'Searching…' : 'Search'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-border/40 bg-secondary/20">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="text-xs">{sortLabels[currentSort] || 'Sort'}</span>
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
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
                "group relative flex flex-col rounded-xl border border-border/40 bg-card p-5 transition-all duration-300",
                "hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1",
                !isLinked && isSkillsetFlag(item.skillset) && "after:absolute after:inset-0 after:border after:border-border/40 after:rounded-xl after:-translate-x-1 after:translate-y-1 after:-z-10 before:absolute before:inset-0 before:border before:border-border/20 before:rounded-xl before:-translate-x-2 before:translate-y-2 before:-z-20"
              )}
            >
              <div className="flex flex-col h-full gap-4">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      {href ? (
                        <Link
                          className="text-base font-bold hover:text-primary transition-colors truncate max-w-[200px]"
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
                      <Badge variant={isLinked ? 'emerald' : 'indigo'} className="text-[10px] h-4.5 px-1.5 shrink-0">
                        {isLinked ? 'Linked' : 'Registry'}
                      </Badge>
                      {alias ? (
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 shrink-0 font-mono">
                          alias:{alias}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 shrink-0 text-muted-foreground">
                          no alias
                        </Badge>
                      )}
                      {!isLinked && isSkillsetFlag(item.skillset) && <SkillsetBadge className="scale-90 origin-left" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    {isLinked && item.source ? (
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <Github className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.source.repo}{item.source.path ? ` / ${item.source.path}` : ''}</span>
                      </div>
                    ) : !isLinked ? (
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        <Package className="h-3 w-3 shrink-0" />
                        <code className="text-[10px] bg-muted/50 px-1 rounded truncate max-w-full">{item.sourceId}</code>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2 h-8">
                    {item.description || <span className="italic opacity-60">No description provided</span>}
                  </div>
                </div>

                <div className="space-y-4 pt-3 border-t border-border/20">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-0.5">
                      <span>Install Command</span>
                      {copiedId === id && <span className="text-emerald-500 animate-in fade-in slide-in-from-right-1">Copied!</span>}
                    </div>
                    <div className="relative group/install">
                      <div className="rounded-lg bg-black/40 border border-border/40 p-2.5 font-mono text-[10px] leading-tight break-all text-foreground/80 pr-9 min-h-[38px] flex items-center transition-colors group-hover/install:border-indigo-500/30">
                        {installCmd}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-white/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void copyInstall(item);
                        }}
                      >
                        {copiedId === id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 opacity-40 group-hover/install:opacity-100 transition-opacity" />}
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
                        className="text-[10px] font-bold text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Repo <ExternalLink className="h-2.5 w-2.5" />
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
