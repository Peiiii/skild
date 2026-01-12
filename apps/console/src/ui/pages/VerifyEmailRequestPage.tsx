import React from 'react';
import { requestVerifyEmail } from '@/lib/api';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Result =
  | { kind: 'none' }
  | { kind: 'sent' }
  | { kind: 'alreadyVerified' }
  | { kind: 'error'; message: string };

export function VerifyEmailRequestPage(): JSX.Element {
  const [handleOrEmail, setHandleOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Result>({ kind: 'none' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setResult({ kind: 'none' });
    setBusy(true);
    try {
      const res = await requestVerifyEmail(handleOrEmail.trim(), password);
      if (!res.ok) {
        setResult({ kind: 'error', message: res.error });
        return;
      }
      if (res.alreadyVerified) {
        setResult({ kind: 'alreadyVerified' });
        return;
      }
      if (res.sent) {
        setResult({ kind: 'sent' });
        setPassword('');
        return;
      }
      setResult({ kind: 'error', message: 'Failed to send verification email.' });
    } catch (err: unknown) {
      if (err instanceof HttpError) setResult({ kind: 'error', message: err.bodyText || `HTTP ${err.status}` });
      else setResult({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request verification email</CardTitle>
        <CardDescription>Resend the email verification link.</CardDescription>
      </CardHeader>
      <CardContent>
        {result.kind === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
        {result.kind === 'sent' && (
          <Alert className="mb-4">
            <AlertTitle>Email sent</AlertTitle>
            <AlertDescription>Check your inbox for the verification link, then open it to finish verification.</AlertDescription>
          </Alert>
        )}
        {result.kind === 'alreadyVerified' && (
          <Alert className="mb-4">
            <AlertTitle>Already verified</AlertTitle>
            <AlertDescription>Your email is already verified.</AlertDescription>
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
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send verification email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

