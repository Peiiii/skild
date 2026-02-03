import React from 'react';
import { PageHero } from '@/components/ui/page-hero';
import { PageLoading } from '@/components/PageLoading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchJson, HttpError } from '@/lib/http';
import { Check, Copy, Download, ExternalLink, Sparkles, Star, TrendingUp } from 'lucide-react';

const DATA_URL = '/data/skills-core-domains.json';

type CoreSkill = {
  source: string;
  skillId: string;
  name: string;
  installsAllTime?: number | null;
  installsTrending?: number | null;
  skillUrl: string;
  repoUrl: string;
  repoStars?: number | null;
  tags?: string[];
  summary?: string;
  summarySource?: string;
};

type CoreDomain = {
  id: string;
  name: string;
  focus: string;
  skills: CoreSkill[];
};

type CoreDomainsPayload = {
  generatedAt: string;
  source: string;
  domains: CoreDomain[];
};

const numberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function formatNumber(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return numberFormatter.format(value);
}

export function CoreDomainsPage(): JSX.Element {
  const [payload, setPayload] = React.useState<CoreDomainsPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchJson<CoreDomainsPayload>(DATA_URL, {}, 15_000)
      .then(data => {
        if (!active) return;
        setPayload(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
        else setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading && !payload) return <PageLoading />;

  const domains = payload?.domains ?? [];
  async function copyInstall(skill: CoreSkill): Promise<void> {
    const command = `skild install ${skill.source}/${skill.skillId}`;
    await navigator.clipboard.writeText(command);
    const key = `${skill.source}/${skill.skillId}`;
    setCopiedId(key);
    window.setTimeout(() => {
      setCopiedId(current => (current === key ? null : current));
    }, 1500);
  }

  return (
    <div className="space-y-10">
      <PageHero
        title="Core Domains"
        description="Curated, high-impact skills across the most important areas. Each list is hand-picked and annotated for fast decision-making."
        actions={(
          <Button
            asChild
            variant="outline"
            className="rounded-full border-brand-forest/15 text-brand-forest/70 hover:text-brand-forest hover:bg-brand-forest/5"
          >
            <a href="https://skills.sh/trending" target="_blank" rel="noreferrer">
              Explore skills.sh
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load core domains</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!payload && !loading && !error && (
        <Alert>
          <AlertTitle>No data available yet</AlertTitle>
          <AlertDescription>
            The core domains feed is still being prepared. Please try again shortly.
          </AlertDescription>
        </Alert>
      )}

      {payload && (
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24 self-start">
            <Card className="p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-forest/30">On this page</div>
              <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-brand-forest/70">
                {domains.map(domain => (
                  <a
                    key={domain.id}
                    href={`#domain-${domain.id}`}
                    className="hover:text-brand-eco transition-colors"
                  >
                    {domain.name}
                  </a>
                ))}
              </div>
            </Card>
          </aside>

          <div className="space-y-12">
            {domains.map(domain => (
              <section key={domain.id} id={`domain-${domain.id}`} className="space-y-6 scroll-mt-24">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-brand-eco" />
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-forest">{domain.name}</h2>
                    </div>
                    <p className="text-sm md:text-base text-brand-forest/65 max-w-3xl">
                      {domain.focus}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {domain.skills.map(skill => {
                    const key = `${skill.source}/${skill.skillId}`;
                    const installCommand = `skild install ${skill.source}/${skill.skillId}`;
                    const copied = copiedId === key;
                    return (
                      <Card key={key} className="p-6 flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <a
                              href={skill.skillUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-lg font-serif font-bold text-brand-forest hover:text-brand-eco transition-colors"
                            >
                              {skill.name}
                            </a>
                            <div className="mt-1 text-xs font-mono text-brand-forest/45">{skill.source}</div>
                          </div>
                          <a
                            href={skill.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-brand-forest/60 hover:text-brand-eco transition-colors inline-flex items-center gap-1"
                          >
                            Repo
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        <div className="text-sm text-brand-forest/70 leading-relaxed line-clamp-3">
                          {skill.summary || 'No summary available yet.'}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-brand-forest/30">
                            <span>Install command</span>
                            {copied && <span className="text-brand-eco">Copied</span>}
                          </div>
                          <div className="relative">
                            <div className="rounded-xl bg-brand-forest/[0.03] border border-brand-forest/10 p-2.5 font-mono text-[10px] leading-tight break-all text-brand-forest/80 pr-10">
                              {installCommand}
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-brand-forest/10 text-brand-forest/60"
                              onClick={() => void copyInstall(skill)}
                            >
                              {copied ? <Check className="h-3.5 w-3.5 text-brand-eco" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(skill.tags || []).slice(0, 6).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] font-semibold text-brand-forest/50 border-brand-forest/10 lowercase">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-brand-forest/55 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <Download className="h-3.5 w-3.5 opacity-60" />
                            {formatNumber(skill.installsAllTime)} installs
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 opacity-60" />
                            {formatNumber(skill.installsTrending)} trending
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 opacity-60" />
                            {formatNumber(skill.repoStars)} stars
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
