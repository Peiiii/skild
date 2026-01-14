import React from 'react';
import { Link } from 'react-router-dom';
import { canonicalToRoute, listMySkills } from '@/lib/api';
import type { MySkillItem } from '@/lib/api-types';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag } from '@/lib/skillset';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function asNumber(value: number | string): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function MySkillsPage(): JSX.Element {
  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [skills, setSkills] = React.useState<MySkillItem[]>([]);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      const res = await listMySkills();
      if (!active) return;
      if (!res.ok) {
        setError(res.error);
        setSkills([]);
        setBusy(false);
        return;
      }
      setSkills(res.skills);
      setBusy(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (busy) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load skills</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My skills</CardTitle>
        <CardDescription>Skills published under your publisher account.</CardDescription>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <div className="text-sm text-muted-foreground">No skills published yet.</div>
        ) : (
          <div className="grid gap-2">
            {skills.map(s => {
              const route = canonicalToRoute(s.name);
              const href = route ? `/skills/${encodeURIComponent(route.scope)}/${encodeURIComponent(route.skill)}` : '/skills';
              return (
                <Link
                  key={s.name}
                  to={href}
                  className="rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-mono text-sm break-all">{s.name}</div>
                        {isSkillsetFlag(s.skillset) && <SkillsetBadge />}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description || 'No description.'}</div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {asNumber(s.versionsCount)} version{asNumber(s.versionsCount) === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Updated: {new Date(s.updated_at).toLocaleString()}</div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
