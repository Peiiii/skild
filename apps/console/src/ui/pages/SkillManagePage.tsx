import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteSkill, getSkillDetail, routeToCanonical, updateSkillAlias } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, Settings } from 'lucide-react';

function normalizeAlias(input: string): string {
  return input.trim().toLowerCase();
}

function validateAlias(input: string): string | null {
  const a = normalizeAlias(input);
  if (!a) return null;
  if (a.length < 3 || a.length > 64) return 'Alias length must be between 3 and 64.';
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(a)) return 'Use lowercase letters, numbers, and hyphens only.';
  if (a.includes('--')) return 'Consecutive hyphens are not allowed.';
  return null;
}

export function SkillManagePage(): JSX.Element {
  const params = useParams();
  const scope = params.scope ?? '';
  const skill = params.skill ?? '';
  const navigate = useNavigate();

  const auth = useAuth();
  const publisher = auth.publisher;
  const [publisherId, setPublisherId] = React.useState<string | null>(null);
  const canManage = Boolean(publisher && publisherId && publisher.id === publisherId);

  const canonicalName = routeToCanonical(scope, skill);

  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [aliasInput, setAliasInput] = React.useState('');
  const [savedAlias, setSavedAlias] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      setBusy(true);
      setError(null);
      try {
        const res = await getSkillDetail(scope, skill);
        if (!active) return;
        if (!res.ok) {
          setError(res.error);
          setBusy(false);
          return;
        }
        setPublisherId(res.skill.publisher_id);
        const alias = typeof res.skill.alias === 'string' ? res.skill.alias : null;
        setSavedAlias(alias);
        setAliasInput(alias ?? '');
        setBusy(false);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setBusy(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [scope, skill]);

  const validationError = validateAlias(aliasInput);
  const normalized = normalizeAlias(aliasInput);
  const effectiveAlias = normalized ? normalized : null;

  async function onSave(): Promise<void> {
    if (!canManage) return;
    if (validationError) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateSkillAlias(scope, skill, effectiveAlias);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAlias(res.alias);
      setAliasInput(res.alias ?? '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function copyInstall(): Promise<void> {
    await navigator.clipboard.writeText(`skild install ${canonicalName}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function copyAliasInstall(): Promise<void> {
    if (!savedAlias) return;
    await navigator.clipboard.writeText(`skild install ${savedAlias}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function onDelete(): Promise<void> {
    if (!canManage) return;
    if (deleteConfirm.trim() !== canonicalName) {
      setError('Type the full canonical name to confirm deletion.');
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await deleteSkill(scope, skill);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      navigate('/skills');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Not allowed</AlertTitle>
          <AlertDescription>You can only manage skills you published.</AlertDescription>
        </Alert>
        <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" to={`/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}`}>
          ← Back to skill
        </Link>
      </div>
    );
  }

  if (busy) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Manage Skill
        </CardTitle>
        <CardDescription>
          Configure metadata for <span className="font-mono">{canonicalName}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="alias">Short name (alias)</Label>
          <Input
            id="alias"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.currentTarget.value)}
            placeholder="short-name"
            className="font-mono"
          />
          <div className="text-xs text-muted-foreground">
            {validationError ? <span className="text-destructive">{validationError}</span> : 'Lowercase letters, numbers, hyphens. 3–64 chars.'}
          </div>
          <div className="text-xs text-muted-foreground">
            Current:{' '}
            <span className="font-mono">
              {savedAlias ? savedAlias : '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void onSave()} disabled={saving || Boolean(validationError)}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAliasInput('')}
            disabled={saving || (!aliasInput && !savedAlias)}
          >
            Clear
          </Button>
          <Button type="button" variant="outline" disabled={!savedAlias} onClick={() => void copyAliasInstall()}>
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy alias install
          </Button>
          <Button type="button" variant="outline" onClick={() => void copyInstall()}>
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy canonical install
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to={`/skills/${encodeURIComponent(scope)}/${encodeURIComponent(skill)}`}>Back</Link>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Alias is stored in the registry as separate metadata (not in <span className="font-mono">SKILL.md</span>).
        </div>

        <div className="border-t border-border/30 pt-6 space-y-3">
          <div className="text-sm font-semibold text-destructive">Danger zone</div>
          <div className="text-xs text-muted-foreground">
            Deleting a skill removes it from the registry (including versions and dist-tags). Installed copies are not affected.
          </div>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm">Type {canonicalName} to confirm</Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.currentTarget.value)}
              placeholder={canonicalName}
              className="font-mono"
            />
          </div>
          <Button type="button" variant="destructive" disabled={deleting || deleteConfirm.trim() !== canonicalName} onClick={() => void onDelete()}>
            {deleting ? 'Deleting…' : 'Delete skill'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
