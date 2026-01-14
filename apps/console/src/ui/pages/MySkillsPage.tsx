import React from 'react';
import { Link } from 'react-router-dom';
import { canonicalToRoute, listMyLinkedItems, listMySkills } from '@/lib/api';
import type { LinkedItemWithInstall, MySkillItem } from '@/lib/api-types';
import { SkillsetBadge } from '@/components/skillset-badge';
import { isSkillsetFlag } from '@/lib/skillset';
import { normalizeAlias, preferredDisplayName } from '@/lib/install';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function asNumber(value: number | string): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function MySkillsPage(): JSX.Element {
  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [skills, setSkills] = React.useState<MySkillItem[]>([]);
  const [linked, setLinked] = React.useState<LinkedItemWithInstall[]>([]);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      const [skillsRes, linkedRes] = await Promise.all([listMySkills(), listMyLinkedItems()]);
      if (!active) return;

      if (!skillsRes.ok) {
        setError(skillsRes.error);
        setSkills([]);
      } else {
        setSkills(skillsRes.skills);
      }

      if (!linkedRes.ok) {
        setError(prev => prev || linkedRes.error);
        setLinked([]);
      } else {
        setLinked(linkedRes.items);
      }

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
    <div className="space-y-6">
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
                const manageHref = route ? `/skills/${encodeURIComponent(route.scope)}/${encodeURIComponent(route.skill)}/manage` : null;
                const alias = normalizeAlias(s.alias);
                const displayName = preferredDisplayName({ title: s.name, alias });
                return (
                  <div
                    key={s.name}
                    className="rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={href} className="font-mono text-sm break-all hover:underline">
                            {displayName}
                          </Link>
                          {isSkillsetFlag(s.skillset) && <SkillsetBadge />}
                          <Badge variant="outline" className="h-5 text-[10px]">Registry</Badge>
                          {alias ? (
                            <Badge variant="secondary" className="h-5 text-[10px] font-mono">alias:{alias}</Badge>
                          ) : (
                            <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">no alias</Badge>
                          )}
                        </div>
                        {alias && <div className="mt-1 text-[11px] text-muted-foreground font-mono break-all">{s.name}</div>}
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description || 'No description.'}</div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground text-right">
                        <div>
                          {asNumber(s.versionsCount)} version{asNumber(s.versionsCount) === 1 ? '' : 's'}
                        </div>
                        <div className="mt-2">Updated: {new Date(s.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                    {manageHref && (
                      <div className="mt-2">
                        <Link to={manageHref} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                          Manage
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My GitHub submissions</CardTitle>
          <CardDescription>Skills you submitted from GitHub.</CardDescription>
        </CardHeader>
        <CardContent>
          {linked.length === 0 ? (
            <div className="text-sm text-muted-foreground">No linked items submitted yet.</div>
          ) : (
            <div className="grid gap-2">
              {linked.map(item => {
                const alias = normalizeAlias(item.alias);
                const displayName = preferredDisplayName({ title: item.title, alias });
                return (
                  <div key={item.id} className="rounded-md border border-border/60 p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/linked/${encodeURIComponent(item.id)}`} className="font-medium hover:underline">
                            {displayName}
                          </Link>
                          <Badge variant="emerald" className="h-5 text-[10px]">Linked</Badge>
                          {alias ? (
                            <Badge variant="secondary" className="h-5 text-[10px] font-mono">alias:{alias}</Badge>
                          ) : (
                            <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">no alias</Badge>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">{item.source.repo}{item.source.path ? ` / ${item.source.path}` : ''}</span>
                        </div>
                        {alias && <div className="mt-1 text-[11px] text-muted-foreground font-mono break-all">{item.title}</div>}
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description || 'No description.'}</div>
                      </div>
                      <div className="shrink-0">
                        <Link to={`/linked/${encodeURIComponent(item.id)}/manage`} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                          Manage
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Updated: {new Date(item.updatedAt).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
