import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MailWarning, Key, Package, BookOpen, UserCircle } from 'lucide-react';

export function MePage(): JSX.Element {
  const auth = useAuth();
  const publisher = auth.publisher;

  if (!publisher) return <div className="text-sm text-muted-foreground">No session.</div>;

  return (
    <div className="grid gap-6">
      {!publisher.emailVerified && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
          <MailWarning className="h-4 w-4" />
          <AlertTitle>Email not verified</AlertTitle>
          <AlertDescription>
            Publishing may be restricted by server policy. Go to{' '}
            <Link className="font-bold underline underline-offset-4 hover:text-primary transition-colors" to="/verify-email/request">
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
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild className="gap-2">
            <Link to="/me/tokens">
              <Key className="w-4 h-4" />
              Manage tokens
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/me/skills">
              <Package className="w-4 h-4" />
              My skills
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/publish">
              <BookOpen className="w-4 h-4" />
              Publish guide
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

