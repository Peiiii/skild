import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Rocket, Download, Info } from 'lucide-react';

export function PublishPage(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish</CardTitle>
        <CardDescription>Minimal publish workflow (registry-hosted tarball)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-4 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <p>
            Email verification may be required for publishing. If publish fails with a 403 status, please visit{' '}
            <a className="underline font-medium hover:text-foreground transition-colors" href="/verify-email/request">Verify Email</a>.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <LogIn className="w-5 h-5 text-indigo-400" />
            1) Login
          </div>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">skild login</pre>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Rocket className="w-5 h-5 text-purple-400" />
            2) Publish
          </div>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">
            skild publish --dir ./path/to/skill --name my-skill
          </pre>
          <div className="text-xs text-muted-foreground pl-1 border-l-2 border-border/30 italic">
            If <span className="font-mono text-foreground/80">--name</span> does not start with <span className="font-mono">@</span>, the CLI publishes to your personal scope.
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Download className="w-5 h-5 text-emerald-400" />
            3) Install
          </div>
          <pre className="rounded-xl border border-border/40 bg-black/40 p-4 text-xs font-mono text-foreground/90 overflow-auto">
            skild install @handle/my-skill --target claude
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
