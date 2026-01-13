import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          {/* Left: Logo + Core Features */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              🛡️ Skild
            </Link>
            <nav className="flex items-center gap-5">
              <TopNavLink to="/skills">Discover</TopNavLink>
              <TopNavLink to="/linked">Catalog</TopNavLink>
              <TopNavLink to="/publish">Publish</TopNavLink>
            </nav>
          </div>

          {/* Right: Auth Actions */}
          <div className="flex items-center gap-3">
            {authed ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 gap-2 font-mono text-sm">
                      @{publisher.handle}
                      <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/me">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/me/skills">My Skills</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/me/tokens">Tokens</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/me/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void auth.logout()} className="text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <TopNavLink to="/login">Login</TopNavLink>
                <Button asChild size="sm" className="h-8">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
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
      <main className="mx-auto max-w-4xl px-4 py-10 flex-1 w-full">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-4xl px-4 pb-12 border-t border-border/30 pt-8 w-full mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <a href="https://skild.sh" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">skild.sh</a>
            <a href="https://github.com/Peiiii/skild" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://github.com/Peiiii/skild#readme" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Docs</a>
            <a href="https://agentskills.io" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Spec</a>
          </div>
          <div className="font-mono text-foreground/50">registry.skild.sh</div>
        </div>
      </footer>
    </div>
  );
}
