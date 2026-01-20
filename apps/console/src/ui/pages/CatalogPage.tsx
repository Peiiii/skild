import * as React from 'react';
import { Link } from 'react-router-dom';
import { listCatalogCategories } from '@/lib/api';
import type { CatalogCategory } from '@/lib/api-types';
import { PageHero } from '@/components/ui/page-hero';
import { SearchBar } from '@/components/ui/search-bar';
import { SkillCard } from '@/components/ui/skill-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useCatalogSkills } from './catalog/useCatalogSkills';
import { collectCatalogTags, formatCatalogCount, formatCategoryLabel } from './catalog/catalog-utils';

export function CatalogPage(): JSX.Element {
  const {
    queryInput,
    setQueryInput,
    busy,
    loadingMore,
    error,
    items,
    nextCursor,
    total,
    copiedId,
    installableOnly,
    riskOnly,
    setInstallableOnly,
    setRiskOnly,
    loadMore,
    copyInstall,
    onSearch,
    query,
  } = useCatalogSkills();

  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  const categoryLabelById = React.useMemo(() => new Map(categories.map(item => [item.id, item.label])), [categories]);
  const resolveCategoryLabel = React.useCallback(
    (id: string) => categoryLabelById.get(id) ?? formatCategoryLabel(id) ?? id,
    [categoryLabelById],
  );
  const visibleCategories = React.useMemo(() => categories.filter(item => (item.total ?? 0) > 0), [categories]);

  React.useEffect(() => {
    let active = true;
    async function loadCategories(): Promise<void> {
      setCategoryError(null);
      try {
        const res = await listCatalogCategories();
        if (!active) return;
        if (!res.ok) {
          setCategoryError(res.error);
          setCategories([]);
          return;
        }
        setCategories(res.items);
      } catch (err: unknown) {
        if (!active) return;
        setCategoryError(err instanceof Error ? err.message : String(err));
      }
    }
    void loadCategories();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <PageHero
        title="Auto Catalog"
        description="Mass-discovered skills from GitHub, continuously indexed and ready to install."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 h-10 rounded-full border border-brand-forest/10 bg-white/70 text-xs font-bold uppercase tracking-[0.2em] text-brand-forest/60 flex items-center">
              Total {busy ? '—' : formatCatalogCount(total)}
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

      {categoryError && (
        <Alert variant="destructive" className="rounded-[24px] border-destructive/20 bg-destructive/5">
          <AlertTitle>Failed to load categories</AlertTitle>
          <AlertDescription>{categoryError}</AlertDescription>
        </Alert>
      )}

      {visibleCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-brand-forest">Browse by category</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-brand-forest/40 font-bold">Categories</span>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCategories.map(category => (
              <Link
                key={category.id}
                to={`/catalog/category/${encodeURIComponent(category.id)}`}
                className="group rounded-[24px] border border-brand-forest/10 bg-white/60 p-5 flex flex-col gap-3 hover:border-brand-forest/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-forest/60">
                    {category.label}
                  </span>
                  <span className="text-[10px] font-mono text-brand-forest/40">
                    {formatCatalogCount(category.installableTotal)} skills
                  </span>
                </div>
                <p className="text-xs text-brand-forest/60 leading-relaxed">{category.description}</p>
                <div className="text-[10px] uppercase tracking-[0.25em] text-brand-eco font-bold">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
              category={item.category ? { id: item.category, label: resolveCategoryLabel(item.category) } : null}
              hasRisk={item.hasRisk}
              usageArtifact={item.usageArtifact}
              tags={collectCatalogTags(item)}
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
