import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '@/lib/api';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Status =
  | { kind: 'idle' }
  | { kind: 'verifying' }
  | { kind: 'success'; handle: string; email: string }
  | { kind: 'error'; message: string };

export function VerifyEmailPage(): JSX.Element {
  const [params] = useSearchParams();
  const initialToken = params.get('token') ?? '';
  const [token, setToken] = React.useState<string>(initialToken);
  const [status, setStatus] = React.useState<Status>({ kind: 'idle' });

  const didAutoVerify = React.useRef(false);

  async function runVerify(t: string): Promise<void> {
    const trimmed = t.trim();
    if (!trimmed) {
      setStatus({ kind: 'error', message: 'Missing token.' });
      return;
    }
    setStatus({ kind: 'verifying' });
    try {
      const res = await verifyEmail(trimmed);
      if (!res.ok) {
        setStatus({ kind: 'error', message: res.error });
        return;
      }
      if (!res.publisher || !res.publisher.emailVerified) {
        setStatus({ kind: 'error', message: 'Verification failed.' });
        return;
      }
      setStatus({ kind: 'success', handle: res.publisher.handle, email: res.publisher.email });
    } catch (err: unknown) {
      if (err instanceof HttpError) setStatus({ kind: 'error', message: err.bodyText || `HTTP ${err.status}` });
      else setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  React.useEffect(() => {
    if (didAutoVerify.current) return;
    if (!initialToken.trim()) return;
    didAutoVerify.current = true;
    void runVerify(initialToken);
  }, [initialToken]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    await runVerify(token);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify email</CardTitle>
        <CardDescription>May be required for publishing Skills (depending on server policy).</CardDescription>
      </CardHeader>
      <CardContent>
        {status.kind === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Verification failed</AlertTitle>
            <AlertDescription>
              <div>{status.message}</div>
              <div className="mt-2 text-xs">
                Need a new email? Go to <Link className="underline" to="/verify-email/request">Request verification</Link>.
              </div>
            </AlertDescription>
          </Alert>
        )}
        {status.kind === 'success' && (
          <Alert className="mb-4">
            <AlertTitle>Email verified</AlertTitle>
            <AlertDescription>
              Verified <span className="font-mono">{status.email}</span> for <span className="font-mono">@{status.handle}</span>. You can publish now.
            </AlertDescription>
          </Alert>
        )}

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="token">Verification token</Label>
            <Input
              id="token"
              value={token}
              onChange={e => setToken(e.currentTarget.value)}
              placeholder="Paste the token from the verification email"
              autoComplete="one-time-code"
              required
            />
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={status.kind === 'verifying'}>
              {status.kind === 'verifying' ? 'Verifying…' : 'Verify'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
