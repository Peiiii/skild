import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { canonicalToRoute, getSkillDetail, getSkillStats, routeToCanonical } from '@/lib/api';
import type { DistTagRow, VersionRow, EntityStats } from '@/lib/api-types';
import { useAuth } from '@/features/auth/auth-store';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag, parseJsonStringArray } from '@/lib/skillset';
import { normalizeAlias, preferredInstallCommand, parseDependencyDisplay } from '@/lib/install';
import { HttpError } from '@/lib/http';
import { formatRelativeTime } from '@/lib/time';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/PageLoading';
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
  const navigate = useNavigate();
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
  const handleBack = React.useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/skills');
  }, [navigate]);

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

  if (busy) return <PageLoading />;

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Failed to load skill</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleBack}
        >
          ← Back
        </button>
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
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleBack}
        >
          ← Back
        </button>
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
        "relative -mx-6 -mt-8 px-6 py-20 overflow-hidden border-b border-brand-forest/5 bg-white",
        data.skillset ? "bg-gradient-to-br from-brand-forest/[0.03] via-transparent to-transparent" : "bg-white"
      )}>
        {/* Decorative elements for Skillsets */}
        {data.skillset && (
          <>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-eco/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-forest/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />
          </>
        )}

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-brand-forest/40">
            <Link className="hover:text-brand-forest transition-colors" to="/skills">
              Skills
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-brand-forest/60 italic lowercase font-serif">{scope}</span>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-brand-forest">
                {alias ?? data.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="forest" className="h-6 px-3 text-[10px] font-bold tracking-widest uppercase">Registry</Badge>
                {data.skillset && <SkillsetBadge className="h-6" />}
                {alias ? (
                  <Badge variant="secondary" className="h-6 px-2 text-[10px] font-mono">alias:{alias}</Badge>
                ) : (
                  <Badge variant="outline" className="h-6 px-2 text-[10px] text-brand-forest/40">no alias</Badge>
                )}
                {canManage && (
                  <Button asChild size="sm" variant="outline" className="h-7 px-3 text-xs border-brand-forest/10 hover:bg-brand-forest/5 hover:text-brand-forest">
                    <Link to={`/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}/manage`}>Manage</Link>
                  </Button>
                )}
              </div>
            </div>
            {alias && (
              <div className="text-xs text-brand-forest/30 font-mono tracking-widest uppercase">{data.name}</div>
            )}
            <p className="text-xl text-brand-forest/60 max-w-2xl leading-relaxed font-medium italic">
              {data.description || 'Elevate your agents with specialized capabilities.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12 max-w-5xl mx-auto">
        {/* Main Column */}
        <div className="md:col-span-8 space-y-10">
          {/* Install Command */}
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-forest/40 flex items-center gap-2">
                <Download className="h-3 w-3" />
                Quick Installation
              </h2>
            </div>
            <div className="group relative">
              <div className="relative rounded-[24px] bg-brand-forest border border-brand-forest/5 p-8 font-mono text-sm leading-relaxed text-white pr-20 shadow-2xl shadow-brand-forest/20 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-eco" />
                <span className="text-brand-eco select-none mr-3 opacity-60">$</span>
                {install}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/40 hover:text-white"
                onClick={copyInstall}
              >
                {copied ? <Check className="h-5 w-5 text-brand-eco" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Skillset Dependencies (if applicable) */}
          {data.skillset && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-brand-forest" />
                <h2 className="text-2xl font-serif font-bold tracking-tight text-brand-forest">Included in this Skillset</h2>
              </div>

              {data.dependencies.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.dependencies.map((dep) => {
                    const trimmed = dep.trim();
                    const isInline = trimmed.startsWith('./') || trimmed.startsWith('../');

                    const { name, context } = parseDependencyDisplay(trimmed);
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
                      <div key={dep} className="group/dep relative rounded-[20px] border border-brand-forest/5 bg-white p-5 hover:border-brand-forest/20 hover:shadow-xl hover:shadow-brand-forest/[0.04] transition-all flex flex-col justify-between min-h-[100px]">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isInline ? (
                                <Badge variant="forest" className="h-4.5 text-[8px] uppercase tracking-widest bg-brand-forest/5 text-brand-forest border-none px-2 font-bold">Bundled</Badge>
                              ) : (
                                <Badge variant="eco" className="h-4.5 text-[8px] uppercase tracking-widest bg-brand-eco/10 text-brand-eco border-none px-2 font-bold">Registry</Badge>
                              )}
                              {context && context !== 'Bundled' && (
                                <span className="text-[9px] text-brand-forest/40 font-mono truncate max-w-[100px] uppercase tracking-wider" title={context}>{context}</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void navigator.clipboard.writeText(trimmed);
                              }}
                              className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-white/10 text-muted-foreground hover:text-indigo-400 opacity-0 group-hover/dep:opacity-100 transition-opacity"
                              title="Copy full path"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="min-w-0">
                            {href ? (
                              <Link
                                className="font-serif text-base font-bold text-brand-forest group-hover/dep:text-brand-eco transition-colors flex items-center gap-1.5"
                                to={href as string}
                              >
                                <span className="truncate">{name}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/dep:opacity-100 transition-opacity" />
                              </Link>
                            ) : (
                              <code className="font-mono text-xs text-brand-forest/70 truncate block">
                                {name}
                              </code>
                            )}
                          </div>
                        </div>

                        {/* Full Path Reveal */}
                        <div className="mt-3 pt-3 border-t border-brand-forest/5">
                          <p className="font-mono text-[9px] text-brand-forest/30 truncate group-hover/dep:text-brand-forest/50 group-hover/dep:break-all group-hover/dep:whitespace-normal transition-colors">
                            {trimmed}
                          </p>
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
          <div className="rounded-[24px] border border-brand-forest/5 bg-white p-8 space-y-6 shadow-xl shadow-brand-forest/[0.02]">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-forest/30 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Insights
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-serif font-bold text-brand-forest leading-none">{stats?.total ?? 0}</div>
                <div className="text-[9px] text-brand-forest/40 uppercase font-bold tracking-widest mt-2">Installs</div>
              </div>
              <div>
                <div className="text-3xl font-serif font-bold text-brand-eco leading-none">+{stats?.trend.slice(-1)[0]?.downloads ?? 0}</div>
                <div className="text-[9px] text-brand-forest/40 uppercase font-bold tracking-widest mt-2">24h</div>
              </div>
            </div>

            {stats && stats.trend.length > 0 && (
              <div className="pt-6 border-t border-brand-forest/5">
                <div className="flex items-end gap-[3px] h-12 w-full group/graph">
                  {stats.trend.slice(-30).map((t, idx) => {
                    const max = Math.max(...stats.trend.slice(-30).map(d => d.downloads), 1);
                    const height = (t.downloads / max) * 100;
                    return (
                      <div
                        key={t.day}
                        className="flex-1 bg-brand-forest/10 rounded-t-[2px] group-hover/graph:bg-brand-forest/5 hover:!bg-brand-eco transition-all duration-300"
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
          <div className="rounded-[24px] border border-brand-forest/5 bg-white p-8 space-y-8 shadow-xl shadow-brand-forest/[0.02]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="h-3 w-3 text-brand-forest/30" />
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-brand-forest/30">Latest Version</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-2xl font-serif font-bold text-brand-forest leading-none">{latest || '0.0.0'}</code>
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-eco bg-brand-eco/10 px-2 py-0.5 rounded-full">Stable</span>
              </div>
            </div>

            <div className="space-y-5 pt-8 border-t border-brand-forest/5">
              <div className="flex items-center gap-2">
                <Layers className="h-3 w-3 text-brand-forest/30" />
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-brand-forest/30">Version History</span>
              </div>
              <ul className="space-y-4">
                {data.versions.slice(0, 5).map(v => (
                  <li key={v.version} className="flex justify-between items-center text-xs group/ver">
                    <span className="font-bold text-brand-forest group-hover/ver:text-brand-eco transition-colors">{v.version}</span>
                    <span className="text-[9px] font-mono text-brand-forest/30 uppercase tracking-tighter">
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
