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
    <div className="flex justify-center items-center h-full max-w-md mx-auto py-20">
      <Card className="w-full rounded-[32px] border-brand-forest/5 shadow-2xl shadow-brand-forest/[0.04] p-6">
        <CardHeader className="pb-8">
          <CardTitle className="text-4xl font-serif">Login</CardTitle>
          <CardDescription className="text-brand-forest/60 font-medium">
            Sign in to your publisher account to manage tokens and see your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-forest/30">
            Registry: <span className="font-mono lowercase tracking-normal">{registryUrl}</span>
          </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Login failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="hoe" className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/40">Handle or Email</Label>
            <Input
              id="hoe"
              value={handleOrEmail}
              onChange={e => setHandleOrEmail(e.currentTarget.value)}
              autoComplete="username"
              required
              className="h-11 rounded-full border-brand-forest/10 focus:ring-brand-forest/5"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw" className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/40">Password</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              autoComplete="current-password"
              required
              className="h-11 rounded-full border-brand-forest/10 focus:ring-brand-forest/5"
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="text-xs text-brand-forest/40 font-medium">
              New here? <Link className="text-brand-forest font-bold hover:text-brand-eco underline underline-offset-4" to="/signup">Create account</Link>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </CardContent>
      </Card>
    </div>
  );
}
