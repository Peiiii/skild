import React from 'react';
import { signup } from '@/lib/api';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SignupPage(): JSX.Element {
  const [email, setEmail] = React.useState('');
  const [handle, setHandle] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<{ handle: string; email: string; verificationSent: boolean } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await signup(email.trim(), handle.trim().toLowerCase(), password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess({ handle: res.publisher.handle, email: res.publisher.email, verificationSent: res.verification.sent });
      setPassword('');
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create publisher</CardTitle>
        <CardDescription>Register a handle to own the scope: <span className="font-mono">@handle/*</span></CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Signup failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertTitle>Signup successful</AlertTitle>
            <AlertDescription>
              You now own <span className="font-mono">@{success.handle}/*</span>.
              <div className="mt-2 text-sm">
                Email verification is required for publishing. {success.verificationSent ? 'We sent you a verification email.' : 'We could not send the verification email.'}{' '}
                You can resend it in <a className="underline" href="/verify-email/request">Verify Email</a>.
              </div>
              <div className="mt-2 text-sm">
                Next: create a token in <a className="underline" href="/token/new">Token</a>.
              </div>
            </AlertDescription>
          </Alert>
        )}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={e => setEmail(e.currentTarget.value)} autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={handle}
              onChange={e => setHandle(e.currentTarget.value)}
              autoComplete="username"
              placeholder="acme"
              required
            />
            <div className="text-xs text-muted-foreground">Lowercase letters/digits/dashes. Example: <span className="font-mono">acme</span></div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.currentTarget.value)} autoComplete="new-password" required />
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
