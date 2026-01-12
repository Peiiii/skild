import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSkillDetail, routeToCanonical } from '@/lib/api';
import type { DistTagRow, VersionRow } from '@/lib/api-types';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (busy) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Failed to load skill</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link className="text-sm underline" to="/skills">
          Back to search
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
        <Link className="text-sm underline" to="/skills">
          Back to search
        </Link>
      </div>
    );
  }

  const latest = findLatest(data.distTags);
  const install = `skild install ${canonicalName}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          <Link className="underline" to="/skills">
            Skills
          </Link>
          <span className="mx-2">/</span>
          <span className="font-mono">{canonicalName}</span>
        </div>
        <div className="text-2xl font-semibold">{data.name}</div>
        <div className="text-sm text-muted-foreground">{data.description || 'No description.'}</div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Install</CardTitle>
          <CardDescription>Copy and run in your terminal.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="rounded-md bg-muted p-3 font-mono text-xs">{install}</div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="secondary" onClick={copyInstall}>
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Dist-tags</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0 text-sm">
            {data.distTags.length ? (
              <ul className="space-y-1">
                {data.distTags.map(t => (
                  <li key={t.tag} className="flex justify-between">
                    <span className="font-mono">{t.tag}</span>
                    <span className="font-mono">{t.version}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">No tags.</div>
            )}
            {latest && <div className="mt-2 text-xs text-muted-foreground">latest → {latest}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Versions</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0 text-sm">
            {data.versions.length ? (
              <ul className="space-y-1">
                {data.versions.slice(0, 10).map(v => (
                  <li key={v.version} className="flex justify-between">
                    <span className="font-mono">{v.version}</span>
                    <span className="font-mono text-xs text-muted-foreground">{v.integrity.slice(0, 12)}…</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">No versions.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
