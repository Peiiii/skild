import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getLinkedItem, getLinkedItemStats } from '@/lib/api';
import type { LinkedItem, EntityStats } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { useAuth } from '@/features/auth/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Github, Tag, Folder, Shield, User, Clock, Check, Copy, Download, TrendingUp } from 'lucide-react';

function buildGithubTreeUrl(repo: string, path: string | null, ref: string | null): string {
  const url = new URL(`https://github.com/${repo}/tree/${ref ?? 'main'}`);
  if (path) url.pathname = `${url.pathname.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  return url.toString();
}

export function LinkedItemDetailPage(): JSX.Element {
  const { id } = useParams();
  const itemId = id ?? '';
  const auth = useAuth();

  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [item, setItem] = React.useState<LinkedItem | null>(null);
  const [install, setInstall] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<EntityStats | null>(null);
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

        // Load stats
        try {
          const statsRes = await getLinkedItemStats(itemId);
          if (statsRes.ok && active) {
            setStats(statsRes);
          }
        } catch (err) {
          console.error('Failed to load stats', err);
        }
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
  const canManage = auth.status === 'authed' && auth.publisher?.id && item.submittedBy?.id === auth.publisher.id;

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
            <div className="flex items-center gap-2">
              <Badge variant="emerald" className="h-6">Linked Item</Badge>
              {canManage && (
                <Button asChild size="sm" variant="outline" className="h-6 px-2 text-xs">
                  <Link to={`/linked/${encodeURIComponent(item.id)}/manage`}>Manage</Link>
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="text-base text-foreground/80 leading-relaxed">
            {item.description || 'No description provided.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <span className="bg-muted px-2 py-0.5 rounded border border-border/40">Install Command</span>
                </div>
                {install && (
                  <div className="relative group">
                    <div className="rounded-lg border border-border/60 bg-black/40 p-4 font-mono text-sm break-all leading-relaxed min-h-[56px] flex items-center pr-12">
                      {install}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-white/10"
                      onClick={copyInstall}
                      disabled={!install}
                    >
                      {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild type="button" variant="outline" className="h-10 px-6">
                  <a href={upstreamUrl} target="_blank" rel="noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Source on GitHub
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4 self-start">
              <h2 className="font-bold flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Usage Insights</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 leading-none text-muted-foreground/60">Total Installs</div>
                  <div className="text-3xl font-black flex items-baseline gap-1">
                    {stats?.total ?? 0}
                    <span className="text-[10px] font-medium text-muted-foreground">all-time</span>
                  </div>
                </div>
                {stats && stats.trend.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 leading-none text-muted-foreground/60">Trend (Last 30d)</div>
                    <div className="flex items-end gap-[2px] h-12">
                      {stats.trend.slice(-20).map((t, idx) => {
                        const max = Math.max(...stats.trend.map(d => d.downloads), 1);
                        const height = (t.downloads / max) * 100;
                        return (
                          <div
                            key={t.day}
                            title={`${t.day}: ${t.downloads} downloads`}
                            className="flex-1 bg-emerald-500/40 rounded-t-[1px] hover:bg-emerald-400 transition-colors"
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
