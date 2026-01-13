import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLinkedItem } from '@/lib/api';
import type { LinkedItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [copied, setCopied] = React.useState(false);

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
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
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
    <div className="space-y-4">
      <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" to="/linked">
        ← Back to Catalog
      </Link>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{item.title}</CardTitle>
            <span className="text-xs text-muted-foreground">Linked</span>
          </div>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Install</div>
            {install && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 font-mono text-xs break-all">
                {install}
              </div>
            )}
            <Button type="button" variant="secondary" onClick={copyInstall} disabled={!install}>
              {copied ? '✓ Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <a href={upstreamUrl} target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</div>
            <div>Repo: <span className="font-mono">{item.source.repo}</span></div>
            <div>Path: <span className="font-mono">{item.source.path || '(root)'}</span></div>
            <div>Ref: <span className="font-mono">{item.source.ref || '(default)'}</span></div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metadata</div>
            <div>🏷️ Tags: {item.tags.length > 0 ? item.tags.join(', ') : 'none'}</div>
            <div>📂 Category: {item.category || 'none'}</div>
            <div>📜 License: {item.license || 'unknown'}</div>
          </div>

          <div className="text-xs text-muted-foreground">
            Submitted by {item.submittedBy ? <span className="font-mono">@{item.submittedBy.handle}</span> : 'unknown'} · {formatRelativeTime(item.createdAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
