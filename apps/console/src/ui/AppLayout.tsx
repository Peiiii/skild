import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';

function TopNavLink({ to, children }: { to: string; children: React.ReactNode }): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
          isActive && 'text-foreground'
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function AppLayout(): JSX.Element {
  const auth = useAuth();
  const publisher = auth.publisher;
  const authed = auth.status === 'authed' && publisher !== null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Skild Console
            </div>
            <nav className="flex items-center gap-5">
              <TopNavLink to="/skills">Discover</TopNavLink>
              <TopNavLink to="/publish">Publish</TopNavLink>
              {authed ? (
                <>
                  <TopNavLink to="/me">Dashboard</TopNavLink>
                  <TopNavLink to="/me/tokens">Tokens</TopNavLink>
                  <TopNavLink to="/me/skills">My Skills</TopNavLink>
                  <TopNavLink to="/me/settings">Account</TopNavLink>
                </>
              ) : (
                <>
                  <TopNavLink to="/login">Login</TopNavLink>
                  <TopNavLink to="/signup">Signup</TopNavLink>
                </>
              )}
              <TopNavLink to="/verify-email/request">Verify Email</TopNavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {authed ? (
              <>
                <div className="text-sm text-muted-foreground font-mono">@{publisher.handle}</div>
                <Button type="button" variant="outline" className="h-8" onClick={() => void auth.logout()}>
                  Logout
                </Button>
              </>
            ) : null}
            <a
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              href="https://skild.sh"
              target="_blank"
              rel="noreferrer"
            >
              skild.sh →
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-4xl px-4 pb-12 text-xs text-muted-foreground">
        API: <code className="font-mono text-foreground/60">https://registry.skild.sh</code>
      </footer>
    </div>
  );
}
