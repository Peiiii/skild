import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function MePage(): JSX.Element {
  const auth = useAuth();
  const publisher = auth.publisher;

  if (!publisher) return <div className="text-sm text-muted-foreground">No session.</div>;

  return (
    <div className="grid gap-6">
      {!publisher.emailVerified && (
        <Alert>
          <AlertTitle>Email not verified</AlertTitle>
          <AlertDescription>
            Publishing may be restricted by server policy. Go to{' '}
            <Link className="underline" to="/verify-email/request">
              Verify Email
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Signed in as <span className="font-mono">@{publisher.handle}</span> ({publisher.email})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/me/tokens">Manage tokens</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/me/skills">My skills</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/publish">Publish guide</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

