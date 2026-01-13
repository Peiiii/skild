import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLinkedItem } from '@/lib/api';
import type { LinkedItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export function LinkedItemDetailPage(): JSX.Element {
  const { id } = useParams();
  const itemId = id ?? '';

  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [item, setItem] = React.useState<LinkedItem | null>(null);
  const [install, setInstall] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await getLinkedItem(itemId);
        if (!active) return;
        if (!res.ok) {
          setError(res.error);
          setItem(null);
          setInstall(null);
          return;
        }
        setItem(res.item);
        setInstall(res.install);
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
        else setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setBusy(false);
      }
    }
    if (itemId) void load();
    else {
      setBusy(false);
      setError('Missing id.');
    }
    return () => {
      active = false;
    };
  }, [itemId]);

  async function copyInstall(): Promise<void> {
    if (!install) return;
    await navigator.clipboard.writeText(install);
  }

  if (busy) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Failed to load item</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" to="/linked">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  if (!item) return <div className="text-sm text-muted-foreground">Not found.</div>;

  const upstreamUrl = item.source.url ?? buildGithubTreeUrl(item.source.repo, item.source.path, item.source.ref);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>Linked · GitHub · Index-only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">{item.description}</div>

        <div className="rounded-md border border-border/60 p-3 text-sm">
          <div>
            Upstream:{' '}
            <a className="underline" href={upstreamUrl} target="_blank" rel="noreferrer">
              {item.source.repo}
            </a>
          </div>
          <div className="mt-1 text-xs text-muted-foreground font-mono break-all">
            {item.source.repo}
            {item.source.path ? `/${item.source.path}` : ''}
            {item.source.ref ? `#${item.source.ref}` : ''}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Submitted by {item.submittedBy ? <span className="font-mono">@{item.submittedBy.handle}</span> : 'unknown'} · {formatDate(item.createdAt)}
          </div>
        </div>

        {install && (
          <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
            {install}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={copyInstall} disabled={!install}>
            Copy install command
          </Button>
          <Button asChild type="button" variant="outline">
            <a href={upstreamUrl} target="_blank" rel="noreferrer">
              Open GitHub
            </a>
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/linked">Back</Link>
          </Button>
        </div>

        {(item.tags.length > 0 || item.category || item.license) && (
          <div className="text-xs text-muted-foreground">
            {item.category ? <span className="mr-3">Category: {item.category}</span> : null}
            {item.license ? <span className="mr-3">License: {item.license}</span> : null}
            {item.tags.length > 0 ? <span>Tags: {item.tags.join(', ')}</span> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
