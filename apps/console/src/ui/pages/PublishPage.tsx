import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PublishPage(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish</CardTitle>
        <CardDescription>Minimal publish workflow (registry-hosted tarball)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          Publishing requires email verification. If publish fails with a 403, go to <a className="underline" href="/verify-email/request">Verify Email</a>.
        </div>
        <div className="space-y-2">
          <div className="font-medium">1) Login</div>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">skild login</pre>
        </div>
        <div className="space-y-2">
          <div className="font-medium">2) Publish</div>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
skild publish --dir ./examples/hello-skill --name hello-skill --skill-version 0.0.1
          </pre>
          <div className="text-xs text-muted-foreground">If <span className="font-mono">--name</span> does not start with <span className="font-mono">@</span>, the CLI infers your scope from the current login and publishes as <span className="font-mono">@handle/name</span>.</div>
        </div>
        <div className="space-y-2">
          <div className="font-medium">3) Install</div>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">skild install @handle/hello-skill -t codex --local</pre>
        </div>
      </CardContent>
    </Card>
  );
}
