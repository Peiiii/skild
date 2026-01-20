import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCatalogSkill } from '@/lib/api';
import type { CatalogSkillDetailResponse } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { PageHero } from '@/components/ui/page-hero';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';

export function CatalogDetailPage(): JSX.Element {
  const params = useParams();
  const id = params.id ?? '';
  const navigate = useNavigate();

  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Extract<CatalogSkillDetailResponse, { ok: true }> | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await getCatalogSkill(id);
        if (!active) return;
        if (!res.ok) {
          setError(res.error);
          setData(null);
          return;
        }
        setData(res);
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
  }, [id]);

  async function copyInstall(cmd: string): Promise<void> {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (busy) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 rounded-full bg-brand-forest/5 animate-pulse" />
        <div className="h-6 w-96 rounded-full bg-brand-forest/5 animate-pulse" />
        <div className="h-48 w-full rounded-[24px] bg-brand-forest/5 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load catalog skill</AlertTitle>
        <AlertDescription>{error || 'Unknown error'}</AlertDescription>
      </Alert>
    );
  }

  const { skill, repo, snapshot } = data;

  return (
    <div className="space-y-8">
      <PageHero
        title={skill.name}
        description={skill.description || 'No description provided.'}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-11 px-6 rounded-full font-bold uppercase tracking-widest text-xs"
              onClick={() => void copyInstall(skill.install)}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied' : 'Copy install'}
            </Button>
            {skill.sourceUrl && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 px-4 rounded-full text-xs font-bold uppercase tracking-widest"
                onClick={() => window.open(skill.sourceUrl || '', '_blank', 'noreferrer')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-4 rounded-full text-xs font-bold uppercase tracking-widest"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs font-mono">{skill.repo}{skill.path ? `/${skill.path}` : ''}</Badge>
        {skill.licenseSpdx && <Badge variant="secondary" className="text-xs">{skill.licenseSpdx}</Badge>}
        {skill.starsTotal != null && <Badge variant="secondary" className="text-xs">{skill.starsTotal} ★</Badge>}
        {skill.hasRisk && <Badge variant="destructive" className="text-xs">Risk flagged</Badge>}
        {skill.usageArtifact && <Badge variant="outline" className="text-xs">Usage artifact</Badge>}
      </div>

      {repo && (
        <div className="rounded-[24px] border border-brand-forest/10 bg-white/60 p-6 space-y-2">
          <div className="text-sm font-bold uppercase tracking-widest text-brand-forest/40">Repository</div>
          <div className="text-lg font-serif font-bold text-brand-forest">{repo.repo}</div>
          {repo.description && <p className="text-sm text-brand-forest/70">{repo.description}</p>}
          {repo.homepage && (
            <a href={repo.homepage} target="_blank" rel="noreferrer" className="text-sm text-brand-eco underline">
              {repo.homepage}
            </a>
          )}
        </div>
      )}

      <div className="rounded-[24px] border border-brand-forest/10 bg-white/70 p-6 space-y-4">
        <div className="text-sm font-bold uppercase tracking-widest text-brand-forest/40">Install</div>
        <div className="font-mono text-xs bg-brand-forest/5 border border-brand-forest/10 rounded-xl p-4 break-all">
          {skill.install}
        </div>
      </div>

      {snapshot?.skillMd && (
        <div className="rounded-[24px] border border-brand-forest/10 bg-white/70 p-6 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-brand-forest/40">SKILL.md</div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-brand-forest/80">{snapshot.skillMd}</pre>
        </div>
      )}

      {snapshot?.readmeMd && (
        <div className="rounded-[24px] border border-brand-forest/10 bg-white/70 p-6 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-brand-forest/40">README</div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-brand-forest/80">{snapshot.readmeMd}</pre>
        </div>
      )}

      {snapshot?.meta && (
        <div className="rounded-[24px] border border-brand-forest/10 bg-white/70 p-6 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-brand-forest/40">Snapshot Meta</div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-brand-forest/70">
            {JSON.stringify(snapshot.meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
