import React from 'react';
import { login } from '@/lib/api';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function TokenNewPage(): JSX.Element {
  const [handleOrEmail, setHandleOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tokenName, setTokenName] = React.useState('default');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [publisherHandle, setPublisherHandle] = React.useState<string | null>(null);
  const [emailVerified, setEmailVerified] = React.useState<boolean | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setToken(null);
    setPublisherHandle(null);
    setEmailVerified(null);
    setBusy(true);
    try {
      const res = await login(handleOrEmail.trim(), password, tokenName.trim() || undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setToken(res.token);
      setPublisherHandle(res.publisher.handle);
      setEmailVerified(res.publisher.emailVerified);
      setPassword('');
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyToken(): Promise<void> {
    if (!token) return;
    await navigator.clipboard.writeText(token);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create token</CardTitle>
        <CardDescription>Creates a publish token (shown once). Use it in the CLI: <span className="font-mono">skild login</span>.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Token creation failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {token && (
          <Alert className="mb-4">
            <AlertTitle>Token created</AlertTitle>
            <AlertDescription>
              Logged in as <span className="font-mono">{publisherHandle ?? 'unknown'}</span>. Copy your token now (it will not be shown again):
              <div className="mt-2 rounded-md bg-muted p-3 font-mono text-xs break-all">{token}</div>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={copyToken}>
                  Copy token
                </Button>
                <Button type="button" variant="outline" onClick={() => setToken(null)}>
                  Hide
                </Button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {/* Temporarily hidden as email verification is not yet supported
                {emailVerified === false && (
                  <div className="mb-2">
                    Email not verified. Publishing may be restricted by server policy. Go to <a className="underline" href="/verify-email/request">Verify Email</a>.
                  </div>
                )}
                */}
                CLI:
                <div className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">
                  skild login --registry https://registry.skild.sh --handle-or-email {publisherHandle ?? '<handle>'} --password *** (or paste token when supported)
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="hoe">Handle or Email</Label>
            <Input id="hoe" value={handleOrEmail} onChange={e => setHandleOrEmail(e.currentTarget.value)} autoComplete="username" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={e => setPassword(e.currentTarget.value)} autoComplete="current-password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tokenName">Token name</Label>
            <Input id="tokenName" value={tokenName} onChange={e => setTokenName(e.currentTarget.value)} />
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create token'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
