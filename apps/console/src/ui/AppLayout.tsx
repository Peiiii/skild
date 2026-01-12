import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
              <TopNavLink to="/signup">Signup</TopNavLink>
              <TopNavLink to="/token/new">Token</TopNavLink>
              <TopNavLink to="/verify-email/request">Verify Email</TopNavLink>
            </nav>
          </div>
          <a
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="https://skild.sh"
            target="_blank"
            rel="noreferrer"
          >
            skild.sh →
          </a>
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

