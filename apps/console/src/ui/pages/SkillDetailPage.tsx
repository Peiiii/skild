import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSkillDetail, routeToCanonical } from '@/lib/api';
import type { DistTagRow, VersionRow } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  async function copyInstall(): Promise<void> {
    await navigator.clipboard.writeText(`skild install ${canonicalName}`);
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
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <Link className="hover:text-foreground transition-colors" to="/skills">
            Skills
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <code className="text-foreground/80">{canonicalName}</code>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
        <p className="text-muted-foreground">{data.description || 'No description.'}</p>
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
          Copy command
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="font-semibold mb-3">Dist-tags</h3>
          {data.distTags.length ? (
            <ul className="space-y-2 text-sm">
              {data.distTags.map(t => (
                <li key={t.tag} className="flex justify-between">
                  <code className="text-muted-foreground">{t.tag}</code>
                  <code>{t.version}</code>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No tags.</div>
          )}
          {latest && <div className="mt-3 text-xs text-muted-foreground">latest → {latest}</div>}
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h3 className="font-semibold mb-3">Versions</h3>
          {data.versions.length ? (
            <ul className="space-y-2 text-sm">
              {data.versions.slice(0, 10).map(v => (
                <li key={v.version} className="flex justify-between">
                  <code>{v.version}</code>
                  <code className="text-xs text-muted-foreground">{v.integrity.slice(0, 12)}…</code>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No versions.</div>
          )}
        </div>
      </div>
    </div>
  );
}

