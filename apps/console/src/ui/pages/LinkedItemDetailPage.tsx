import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLinkedItem } from '@/lib/api';
import type { LinkedItem } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Github, Tag, Folder, Shield, User, Clock, Check, Copy } from 'lucide-react';

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
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">{item.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Github className="h-4 w-4" />
                <a
                  href={upstreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors font-medium border-b border-border/40 hover:border-primary/40"
                >
                  {item.source.repo}{item.source.path ? ` / ${item.source.path}` : ''}
                </a>
              </div>
            </div>
            <Badge variant="emerald" className="h-6">Linked Item</Badge>
          </div>
          <CardDescription className="text-base text-foreground/80 leading-relaxed">
            {item.description || 'No description provided.'}
          </CardDescription>
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Source Details</div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Repository</span>
                    <span className="font-mono text-foreground/90">{item.source.repo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Path</span>
                    <span className="font-mono text-foreground/90">{item.source.path || '(root)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-foreground/90 text-xs bg-muted px-1.5 py-0.5 rounded border border-border/40 leading-none">
                      {item.source.ref || 'main'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild type="button" variant="outline" className="flex-1">
                  <a href={upstreamUrl} target="_blank" rel="noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">Metadata</div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1 leading-none">Tags</div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.length > 0 ? (
                          item.tags.map(t => <Badge key={t} variant="secondary" className="px-1.5 py-0 normal-case tracking-normal h-5">{t}</Badge>)
                        ) : (
                          <span className="text-muted-foreground italic">none</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Folder className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1 leading-none">Category</div>
                      <span className="text-foreground/90 capitalize">{item.category || 'none'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1 leading-none">License</div>
                      <span className="text-foreground/90 font-medium">{item.license || 'unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Submitted by</span>
              <span className="text-foreground/90 font-medium">@{item.submittedBy?.handle || 'unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(item.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
