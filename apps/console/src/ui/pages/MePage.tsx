import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MailWarning, Key, Package, BookOpen, UserCircle } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';

export function MePage(): JSX.Element {
  const auth = useAuth();
  const publisher = auth.publisher;

  if (!publisher) return <div className="text-sm text-muted-foreground">No session.</div>;

  return (
    <div className="space-y-8">
      {/* Temporarily hidden as email verification is not yet supported
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
      */}

      <PageHero
        title="Dashboard"
        description={`Welcome back, @${publisher.handle}`}
      />

      <Card className="p-5">
        <CardContent className="flex flex-wrap gap-4 pt-0">
          <Button asChild className="gap-2 px-6 h-12 rounded-full">
            <Link to="/me/tokens">
              <Key className="w-4 h-4" />
              Manage tokens
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2 px-6 h-12 rounded-full">
            <Link to="/me/skills">
              <Package className="w-4 h-4" />
              My skills
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 px-6 h-12 rounded-full border-brand-forest/30 hover:bg-brand-forest/10 hover:text-brand-forest font-bold">
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

