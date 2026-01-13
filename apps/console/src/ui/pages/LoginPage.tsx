import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';
import { getRegistryUrl } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LoginPage(): JSX.Element {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/me';
  const registryUrl = getRegistryUrl();

  const [handleOrEmail, setHandleOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await auth.login(handleOrEmail.trim(), password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPassword('');
      navigate(next, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  if (auth.status === 'authed') return <div className="text-sm text-muted-foreground">Already logged in.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Sign in to your publisher account to manage tokens and see your dashboard. No tokens are stored in the browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-xs text-muted-foreground">
          Registry: <span className="font-mono">{registryUrl}</span>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="hoe">Handle or Email</Label>
            <Input
              id="hoe"
              value={handleOrEmail}
              onChange={e => setHandleOrEmail(e.currentTarget.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              New here? <Link className="underline" to="/signup">Create an account</Link>.
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
