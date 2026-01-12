import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listSkills, canonicalToRoute } from '@/lib/api';
import type { SkillListItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SkillsPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = React.useState(params.get('q') || '');
  const [items, setItems] = React.useState<SkillListItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function runSearch(q: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await listSkills(q);
      if (!res.ok) {
        setError(res.error);
        setItems([]);
        return;
      }
      setItems(res.skills);
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void runSearch(params.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const q = query.trim();
    setParams(q ? { q } : {});
    void runSearch(q);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Discover Skills</h1>
        <p className="text-muted-foreground">Search the registry and copy install commands.</p>
      </div>

      <form className="flex gap-3" onSubmit={onSubmit}>
        <Input
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
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

      <div className="grid gap-3">
        {items.map(item => {
          const route = canonicalToRoute(item.name);
          const href = route ? `/skills/${route.scope}/${encodeURIComponent(route.skill)}` : undefined;
          return (
            <div
              key={item.name}
              className="group rounded-lg border border-border/50 bg-card p-5 transition-all hover:border-border hover:bg-card/80"
            >
              <div className="font-semibold">
                {href ? (
                  <Link className="hover:text-primary transition-colors" to={href}>
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                {item.description || <span className="italic">No description</span>}
              </div>
            </div>
          );
        })}
        {!busy && !error && items.length === 0 && (
          <div className="text-sm text-muted-foreground py-8 text-center">No results.</div>
        )}
      </div>
    </div>
  );
}

