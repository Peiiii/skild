import React from 'react';
import { Link } from 'react-router-dom';
import { listLinkedItems } from '@/lib/api';
import type { LinkedItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function buildGithubTreeUrl(repo: string, path: string | null, ref: string | null): string {
  const url = new URL(`https://github.com/${repo}/tree/${ref ?? 'main'}`);
  if (path) url.pathname = `${url.pathname.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  return url.toString();
}

export function LinkedItemsPage(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<LinkedItem[]>([]);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await listLinkedItems(q);
        if (!active) return;
        if (!res.ok) {
          setError(res.error);
          setItems([]);
          return;
        }
        setItems(res.items);
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
  }, [q]);

  async function copyInstall(url: string | null, repo: string, path: string | null, ref: string | null): Promise<void> {
    const effective = url ?? buildGithubTreeUrl(repo, path, ref);
    await navigator.clipboard.writeText(`skild install ${effective}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog</CardTitle>
        <CardDescription>Community submitted GitHub skills (index-only). Install uses the GitHub source directly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Input value={q} onChange={e => setQ(e.currentTarget.value)} placeholder="Search by title, repo, description…" />
          <Button asChild variant="secondary">
            <Link to="/linked/new">Submit</Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load catalog</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {busy ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No items yet.</div>
        ) : (
          <div className="grid gap-2">
            {items.map(item => (
              <div key={item.id} className="rounded-md border border-border/60 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link to={`/linked/${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">Linked · GitHub</span>
                      {item.category ? <span className="text-xs text-muted-foreground">· {item.category}</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
                    <div className="mt-2 text-xs text-muted-foreground font-mono break-all">
                      {item.source.repo}
                      {item.source.path ? `/${item.source.path}` : ''}
                      {item.source.ref ? `#${item.source.ref}` : ''}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Submitted by {item.submittedBy ? <span className="font-mono">@{item.submittedBy.handle}</span> : 'unknown'} · {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyInstall(item.source.url, item.source.repo, item.source.path, item.source.ref)}
                    >
                      Copy install
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
