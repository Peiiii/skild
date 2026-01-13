import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SettingsPage(): JSX.Element {
  const auth = useAuth();
  const publisher = auth.publisher;
  if (!publisher) return <div className="text-sm text-muted-foreground">No session.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Publisher settings.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm">
          <div>
            Handle: <span className="font-mono">@{publisher.handle}</span>
          </div>
          <div>Email: {publisher.email}</div>
          <div>
            Email verification: {publisher.emailVerified ? 'verified' : 'not verified'}{' '}
            {!publisher.emailVerified && (
              <Link className="underline" to="/verify-email/request">
                (verify)
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void auth.refresh()}>
            Refresh
          </Button>
          <Button type="button" variant="outline" onClick={() => void auth.logout()}>
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

