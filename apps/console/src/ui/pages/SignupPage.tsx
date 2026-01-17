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
  const [success, setSuccess] = React.useState<{
    handle: string;
    email: string;
    requiredForPublish: boolean;
    verificationSent: boolean;
    verificationMode: string;
  } | null>(null);

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
      setSuccess({
        handle: res.publisher.handle,
        email: res.publisher.email,
        requiredForPublish: res.verification.requiredForPublish,
        verificationSent: res.verification.sent,
        verificationMode: res.verification.mode
      });
      setPassword('');
    } catch (err: unknown) {
      if (err instanceof HttpError) setError(err.bodyText || `HTTP ${err.status}`);
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-center items-center h-full max-w-lg mx-auto py-12">
      <Card className="w-full rounded-[32px] border-brand-forest/5 shadow-2xl shadow-brand-forest/[0.04] p-8">
        <CardHeader className="pb-8">
          <CardTitle className="text-4xl font-serif">Create publisher</CardTitle>
          <CardDescription className="text-brand-forest/60 font-medium">
            Register a handle to own the scope: <span className="text-brand-forest font-bold font-mono">@handle/*</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Signup failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 border-brand-eco/20 bg-brand-eco/[0.03]">
              <AlertTitle className="text-brand-eco font-bold">Signup successful</AlertTitle>
              <AlertDescription className="text-brand-forest/80">
                You now own <span className="font-mono font-bold text-brand-forest">@{success.handle}/*</span>.
                <div className="mt-2 text-sm">
                  {success.requiredForPublish ? 'Email verification is required for publishing.' : 'Email verification is recommended.'}{' '}
                  {success.verificationMode === 'log' ? (
                    <span className="italic">Dev mode: email sending is disabled. Check the registry dev logs for the verification link.</span>
                  ) : success.verificationSent ? (
                    <span>We sent you a verification email.</span>
                  ) : (
                    <span className="text-destructive">We could not send the verification email.</span>
                  )}{' '}
                  You can resend it in <a className="text-brand-forest font-bold underline" href="/verify-email/request">Verify Email</a>.
                </div>
                <div className="mt-3 text-sm">
                  Next: go to <a className="text-brand-forest font-bold underline" href="/me">Dashboard</a>.
                </div>
              </AlertDescription>
            </Alert>
          )}
          <form className="grid gap-6" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/40">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                autoComplete="email"
                required
                className="h-11 rounded-full border-brand-forest/10 focus:ring-brand-forest/5"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="handle" className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/40">Handle</Label>
              <Input
                id="handle"
                value={handle}
                onChange={e => setHandle(e.currentTarget.value)}
                autoComplete="username"
                placeholder="acme"
                required
                className="h-11 rounded-full border-brand-forest/10 focus:ring-brand-forest/5"
              />
              <div className="text-[10px] text-brand-forest/30 font-medium">Lowercase letters/digits/dashes. Example: <span className="font-mono">acme</span></div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-brand-forest/40">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                autoComplete="new-password"
                required
                className="h-11 rounded-full border-brand-forest/10 focus:ring-brand-forest/5"
              />
            </div>
            <div className="flex items-center justify-end pt-4">
              <Button type="submit" disabled={busy} className="px-8 shadow-lg shadow-brand-forest/10">
                {busy ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
