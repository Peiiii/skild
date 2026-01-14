import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { canonicalToRoute, getSkillDetail, getSkillStats, routeToCanonical } from '@/lib/api';
import type { DistTagRow, VersionRow, EntityStats } from '@/lib/api-types';
import { useAuth } from '@/features/auth/auth-store';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag, parseJsonStringArray } from '@/lib/skillset';
import { normalizeAlias, preferredInstallCommand } from '@/lib/install';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Package, Hash, Layers, Check, Copy, Download, TrendingUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

function findLatest(distTags: DistTagRow[]): string | null {
  const row = distTags.find(t => t.tag === 'latest');
  return row?.version ?? null;
}

export function SkillDetailPage(): JSX.Element {
  const params = useParams();
  const scope = params.scope ?? '';
  const skill = params.skill ?? '';
  const auth = useAuth();

  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    name: string;
    description: string | null;
    distTags: DistTagRow[];
    versions: VersionRow[];
    skillset: boolean;
    dependencies: string[];
    alias: string | null;
    publisherId: string;
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
          dependencies: skillset ? parseJsonStringArray(res.skill.dependencies_json) : [],
          alias: typeof res.skill.alias === 'string' ? res.skill.alias : null,
          publisherId: res.skill.publisher_id
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
    const cmd = preferredInstallCommand({
      install: `skild install ${canonicalName}`,
      alias: normalizeAlias(data?.alias),
    });
    await navigator.clipboard.writeText(cmd);
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
  const alias = normalizeAlias(data.alias);
  const install = preferredInstallCommand({ install: `skild install ${canonicalName}`, alias });
  const canManage = auth.status === 'authed' && auth.publisher?.id === data.publisherId;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className={cn(
        "relative -mx-6 -mt-8 px-6 py-16 overflow-hidden border-b border-border/40",
        data.skillset ? "bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-transparent" : "bg-muted/10"
      )}>
        {/* Decorative elements for Skillsets */}
        {data.skillset && (
          <>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />
          </>
        )}

        <div className="relative z-10 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
            <Link className="hover:text-foreground transition-colors" to="/skills">
              Skills
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-foreground/60">{scope}</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                {alias ?? data.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 border-indigo-500/30 bg-indigo-500/5 text-indigo-400">Registry</Badge>
                {data.skillset && <SkillsetBadge className="h-6" />}
                  {alias ? (
                    <Badge variant="secondary" className="h-6 text-[10px] font-mono">alias:{alias}</Badge>
                  ) : (
                    <Badge variant="outline" className="h-6 text-[10px] text-muted-foreground">no alias</Badge>
                  )}
                {canManage && (
                  <Button asChild size="sm" variant="outline" className="h-6 px-2 text-xs border-border/40">
                    <Link to={`/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}/manage`}>Manage</Link>
                  </Button>
                )}
              </div>
            </div>
              {alias && (
                <div className="text-xs text-muted-foreground font-mono">{data.name}</div>
              )}
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-medium">
              {data.description || 'Elevate your agents with specialized capabilities.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12 max-w-5xl mx-auto">
        {/* Main Column */}
        <div className="md:col-span-8 space-y-10">
          {/* Install Command */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                <Download className="h-3.5 w-3.5" />
                Quick Installation
              </h2>
            </div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
              <div className="relative rounded-xl bg-black border border-white/5 p-5 font-mono text-sm leading-relaxed text-foreground pr-14 shadow-2xl overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/50" />
                <span className="text-indigo-400 select-none mr-3">$</span>
                {install}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
                onClick={copyInstall}
              >
                {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Skillset Dependencies (if applicable) */}
          {data.skillset && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-indigo-400" />
                <h2 className="text-xl font-bold tracking-tight">Included in this Skillset</h2>
              </div>

              {data.dependencies.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
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
                      <div key={dep} className="group/dep relative rounded-lg border border-border/40 bg-muted/5 p-3.5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all hover:shadow-lg hover:shadow-indigo-500/5 overflow-hidden">
                        <div className="flex flex-col gap-2.5 min-w-0">
                          <div className="flex items-center justify-between">
                            {isInline ? (
                              <Badge variant="secondary" className="h-4.5 text-[8px] uppercase tracking-wider bg-purple-500/10 text-purple-400 border-none px-1.5">Bundled</Badge>
                            ) : (
                              <Badge variant="secondary" className="h-4.5 text-[8px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-none px-1.5">Registry</Badge>
                            )}
                          </div>

                          <div className="min-w-0">
                            {href ? (
                              <Link
                                className="font-mono text-[11px] font-bold text-foreground/80 group-hover/dep:text-indigo-400 transition-colors flex items-center gap-1.5"
                                to={href as string}
                                title={trimmed}
                              >
                                <span className="truncate">{trimmed}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/dep:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <code className="font-mono text-[11px] text-foreground/70 truncate block" title={trimmed}>
                                {trimmed}
                              </code>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 p-8 text-center text-muted-foreground italic text-sm">
                  No explicit dependencies found in this set.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          {/* Stats */}
          <div className="rounded-xl border border-border/40 bg-card p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Insights
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-black">{stats?.total ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Installs</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">+{stats?.trend.slice(-1)[0]?.downloads ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">24h</div>
              </div>
            </div>

            {stats && stats.trend.length > 0 && (
              <div className="pt-4 border-t border-border/20">
                <div className="flex items-end gap-[2px] h-10 w-full group/graph">
                  {stats.trend.slice(-30).map((t, idx) => {
                    const max = Math.max(...stats.trend.slice(-30).map(d => d.downloads), 1);
                    const height = (t.downloads / max) * 100;
                    return (
                      <div
                        key={t.day}
                        className="flex-1 bg-indigo-500/20 rounded-t-[1px] group-hover/graph:bg-indigo-500/10 hover:!bg-indigo-400 transition-all duration-300"
                        style={{ height: `${Math.max(height, 8)}%` }}
                        title={`${t.day}: ${t.downloads}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-border/40 bg-card p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Latest Version</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-lg font-black text-indigo-400">{latest || '0.0.0'}</code>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Stable</span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/20">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Version History</span>
              </div>
              <ul className="space-y-3">
                {data.versions.slice(0, 5).map(v => (
                  <li key={v.version} className="flex justify-between items-center text-xs group/ver">
                    <span className="font-bold text-foreground/80 group-hover/ver:text-indigo-400 transition-colors">{v.version}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {formatRelativeTime(v.published_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
