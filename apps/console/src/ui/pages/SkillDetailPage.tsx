import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSkillDetail, routeToCanonical } from '@/lib/api';
import type { DistTagRow, VersionRow } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Package, Hash, Layers, Check, Copy } from 'lucide-react';

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
  const [data, setData] = React.useState<{ name: string; description: string | null; distTags: DistTagRow[]; versions: VersionRow[] } | null>(
    null
  );

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
        setData({
          name: res.skill.name,
          description: res.skill.description,
          distTags: res.distTags,
          versions: res.versions
        });
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
          <Badge variant="indigo" className="h-6">Registry Skill</Badge>
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold mb-1">Install</h2>
          <p className="text-sm text-muted-foreground">Copy and run in your terminal.</p>
        </div>
        <div className="rounded-md bg-black/50 border border-border/30 p-4 font-mono text-sm text-foreground/90">
          {install}
        </div>
        <Button type="button" variant="secondary" onClick={copyInstall}>
          {copied ? '✓ Copied!' : 'Copy command'}
        </Button>
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
    </div>
  );
}

