import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { canonicalToRoute, getSkillDetail, getSkillStats, routeToCanonical } from '@/lib/api';
import type { DistTagRow, VersionRow, EntityStats } from '@/lib/api-types';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag, parseJsonStringArray } from '@/lib/skillset';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Package, Hash, Layers, Check, Copy, Download, TrendingUp } from 'lucide-react';

function findLatest(distTags: DistTagRow[]): string | null {
  const row = distTags.find(t => t.tag === 'latest');
  return row?.version ?? null;
}

export function SkillDetailPage(): JSX.Element {
  const params = useParams();
  const scope = params.scope ?? '';
  const skill = params.skill ?? '';

  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    name: string;
    description: string | null;
    distTags: DistTagRow[];
    versions: VersionRow[];
    skillset: boolean;
    dependencies: string[];
  } | null>(null);
  const [stats, setStats] = React.useState<EntityStats | null>(null);

  const canonicalName = routeToCanonical(scope, skill);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await getSkillDetail(scope, skill);
        if (!res.ok) {
          if (!active) return;
          setError(res.error);
          setData(null);
          return;
        }
        if (!active) return;
        const skillset = isSkillsetFlag(res.skill.skillset);
        setData({
          name: res.skill.name,
          description: res.skill.description,
          distTags: res.distTags,
          versions: res.versions,
          skillset,
          dependencies: skillset ? parseJsonStringArray(res.skill.dependencies_json) : []
        });

        // Load stats
        try {
          const statsRes = await getSkillStats(scope, skill);
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
    void load();
    return () => {
      active = false;
    };
  }, [scope, skill]);

  const [copied, setCopied] = React.useState(false);

  async function copyInstall(): Promise<void> {
    await navigator.clipboard.writeText(`skild install ${canonicalName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (busy) return <div className="text-muted-foreground py-8">Loading…</div>;

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Failed to load skill</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" to="/skills">
          ← Back to search
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Skill not found</AlertTitle>
          <AlertDescription>Unable to load this skill.</AlertDescription>
        </Alert>
        <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" to="/skills">
          ← Back to search
        </Link>
      </div>
    );
  }

  const latest = findLatest(data.distTags);
  const install = `skild install ${canonicalName}`;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link className="hover:text-foreground transition-colors" to="/skills">
            Skills
          </Link>
          <span className="opacity-50">/</span>
          <code className="text-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/40">{canonicalName}</code>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">{data.name}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">{data.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" className="h-6">Registry Skill</Badge>
            {data.skillset && <SkillsetBadge className="h-6" />}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Install Section */}
        <div className="md:col-span-2 rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-400" />
              <span>Install Skill</span>
            </h2>
            <code className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded">Terminal CLI</code>
          </div>
          <div className="relative group">
            <div className="rounded-lg bg-black/40 border border-border/40 p-4 font-mono text-sm leading-relaxed break-all text-foreground/90 pr-12 min-h-[56px] flex items-center">
              {install}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-white/10"
              onClick={copyInstall}
            >
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground italic">Requires <code>skild</code> CLI installed on your machine.</p>

          {data.skillset && (
            <div className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This Skillset includes</div>
              {data.dependencies.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {data.dependencies.map((dep) => {
                    const trimmed = dep.trim();
                    const isInline = trimmed.startsWith('./') || trimmed.startsWith('../');

                    const registryName = (() => {
                      if (!trimmed.startsWith('@') || !trimmed.includes('/')) return null;
                      const lastAt = trimmed.lastIndexOf('@');
                      if (lastAt <= 0) return trimmed;
                      const maybeName = trimmed.slice(0, lastAt);
                      if (!maybeName.includes('/')) return trimmed;
                      return maybeName;
                    })();

                    const route = registryName ? canonicalToRoute(registryName) : null;
                    const href = route ? `/skills/${encodeURIComponent(route.scope)}/${encodeURIComponent(route.skill)}` : null;

                    return (
                      <li key={dep} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          {href ? (
                            <Link className="font-mono break-all hover:text-primary transition-colors" to={href}>
                              {trimmed}
                            </Link>
                          ) : (
                            <code className="font-mono break-all text-foreground/80">{trimmed}</code>
                          )}
                        </div>
                        {isInline && <Badge variant="secondary" className="h-5">Bundled</Badge>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground italic">No dependencies declared.</div>
              )}
              <div className="text-[11px] text-muted-foreground">
                Installing the Skillset installs its dependencies automatically.
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Usage Insights</span>
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Installs</div>
              <div className="text-3xl font-black flex items-baseline gap-1">
                {stats?.total ?? 0}
                <span className="text-xs font-medium text-muted-foreground">all-time</span>
              </div>
            </div>
            {stats && stats.trend.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Trend (Last 30 days)</div>
                <div className="flex items-end gap-[2px] h-12">
                  {stats.trend.slice(-15).map((t, idx) => {
                    const max = Math.max(...stats.trend.map(d => d.downloads), 1);
                    const height = (t.downloads / max) * 100;
                    return (
                      <div
                        key={t.day}
                        title={`${t.day}: ${t.downloads} downloads`}
                        className="flex-1 bg-indigo-500/40 rounded-t-[1px] hover:bg-indigo-400 transition-colors"
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Dist-tags</h3>
          </div>
          {data.distTags.length ? (
            <div className="space-y-3">
              <ul className="space-y-2 text-sm">
                {data.distTags.map(t => (
                  <li key={t.tag} className="flex justify-between items-center py-1.5 border-b border-border/10 last:border-0">
                    <code className="text-indigo-400 font-bold">{t.tag}</code>
                    <Badge variant="secondary" className="font-mono h-5">{t.version}</Badge>
                  </li>
                ))}
              </ul>
              {latest && (
                <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                  <span>latest points to</span>
                  <span className="font-mono text-foreground/80">{latest}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">No tags associated.</div>
          )}
        </div>

        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Version History</h3>
          </div>
          {data.versions.length ? (
            <ul className="space-y-2 text-sm">
              {data.versions.slice(0, 10).map(v => (
                <li key={v.version} className="flex justify-between items-center py-1.5 border-b border-border/10 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded">
                  <code className="font-bold text-foreground/90">{v.version}</code>
                  <code className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                    {v.integrity.slice(0, 16)}…
                  </code>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground italic">No versions available.</div>
          )}
        </div>
      </div>
    </div >
  );
}
