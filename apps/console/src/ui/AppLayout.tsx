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
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold">Skild Console</div>
            <nav className="flex items-center gap-4">
              <TopNavLink to="/skills">Discover</TopNavLink>
              <TopNavLink to="/publish">Publish</TopNavLink>
              <TopNavLink to="/signup">Signup</TopNavLink>
              <TopNavLink to="/token/new">Token</TopNavLink>
            </nav>
          </div>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="https://skild.sh" target="_blank" rel="noreferrer">
            skild.sh
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-4xl px-4 pb-10 text-xs text-muted-foreground">
        API: <span className="font-mono">https://registry.skild.sh</span>
      </footer>
    </div>
  );
}

