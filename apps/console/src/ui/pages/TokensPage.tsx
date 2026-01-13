import React from 'react';
import { createToken, listTokens, revokeToken } from '@/lib/api';
import type { TokenMeta } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function TokensPage(): JSX.Element {
  const [tokens, setTokens] = React.useState<TokenMeta[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tokenName, setTokenName] = React.useState('default');
  const [newToken, setNewToken] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    setError(null);
    const res = await listTokens();
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTokens(res.tokens);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setNewToken(null);
    setBusy(true);
    try {
      const res = await createToken(tokenName.trim() || undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNewToken(res.token);
      setTokenName('default');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: string): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const res = await revokeToken(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyToken(): Promise<void> {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
  }

  return (
    <div className="grid gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Token operation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {newToken && (
        <Alert>
          <AlertTitle>Token created (shown once)</AlertTitle>
          <AlertDescription>
            Copy your token now (it will not be shown again):
            <div className="mt-2 rounded-md bg-muted p-3 font-mono text-xs break-all">{newToken}</div>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="secondary" onClick={copyToken}>
                Copy token
              </Button>
              <Button type="button" variant="outline" onClick={() => setNewToken(null)}>
                Hide
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create token</CardTitle>
          <CardDescription>Publish tokens are for the CLI/CI. They can be revoked anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onCreate}>
            <div className="grid gap-2">
              <Label htmlFor="tokenName">Token name</Label>
              <Input id="tokenName" value={tokenName} onChange={e => setTokenName(e.currentTarget.value)} placeholder="default" />
            </div>
            <div className="flex items-center justify-end">
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create token'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tokens</CardTitle>
          <CardDescription>Secrets are never shown again. Revoke if you suspect compromise.</CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tokens yet.</div>
          ) : (
            <div className="grid gap-2">
              {tokens.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      <span className="font-mono">{t.name}</span>
                      {t.revoked_at ? <span className="ml-2 text-xs text-muted-foreground">(revoked)</span> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(t.created_at)} · Last used: {formatDate(t.last_used_at)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground font-mono break-all">id: {t.id}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" variant="destructive" disabled={busy || Boolean(t.revoked_at)} onClick={() => onRevoke(t.id)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

