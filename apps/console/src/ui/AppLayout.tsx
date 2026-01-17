import * as React from 'react';
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
import {
  Compass,
  Layers,
  Upload,
  LayoutDashboard,
  Package,
  Key,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  Trophy,
  Github,
  Rocket
} from 'lucide-react';
import { DesignGrid } from '@/components/ui/design-grid';

function TopNavLink({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon?: React.ElementType }): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-1.5 text-sm font-medium text-brand-forest/60 hover:text-brand-forest transition-all active:scale-95',
          isActive && 'text-brand-forest opacity-100 font-bold'
        )
      }
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </NavLink>
  );
}

export function AppLayout(): JSX.Element {
  const auth = useAuth();
  const publisher = auth.publisher;
  const authed = auth.status === 'authed' && publisher !== null;

  return (
    <div className="min-h-dvh bg-background flex flex-col relative overflow-hidden">
      <DesignGrid />
      <header className="border-b border-brand-forest/5 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-brand-forest rounded-lg flex items-center justify-center shadow-lg shadow-brand-forest/10">
              <img src="/favicon.svg" alt="Skild Logo" className="w-5 h-5 invert" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-brand-forest">
              skild <span className="text-brand-eco italic">hub</span>
            </span>
          </Link>

          {/* Right Section: Nav + Auth */}
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-6 border-r border-border/40 pr-8 mr-2 last:border-0 last:pr-0 last:mr-0">
              <TopNavLink to="/getting-started" icon={Rocket}>Get Started</TopNavLink>
              <TopNavLink to="/skills" icon={Compass}>Skills</TopNavLink>
              <TopNavLink to="/skillsets" icon={Layers}>Skillsets</TopNavLink>
              <TopNavLink to="/leaderboard" icon={Trophy}>Top</TopNavLink>
              <TopNavLink to="/linked" icon={Github}>Submit Skills from GitHub</TopNavLink>
              <TopNavLink to="/publish" icon={Upload}>Publish</TopNavLink>
            </nav>

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
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem asChild>
                        <Link to="/me" className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 opacity-70" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/me/skills" className="flex items-center gap-2">
                          <Package className="w-4 h-4 opacity-70" />
                          My Skills
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/me/tokens" className="flex items-center gap-2">
                          <Key className="w-4 h-4 opacity-70" />
                          Tokens
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/me/settings" className="flex items-center gap-2">
                          <Settings className="w-4 h-4 opacity-70" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => void auth.logout()} className="text-destructive flex items-center gap-2">
                        <LogOut className="w-4 h-4 opacity-70" />
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
                className="flex items-center gap-1.5 text-sm text-brand-forest/60 hover:text-brand-forest transition-colors group"
                href="https://skild.sh"
                target="_blank"
                rel="noreferrer"
              >
                skild.sh
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 flex-1 w-full">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-12 border-t border-brand-forest/5 pt-12 w-full mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5 transition-all opacity-60 hover:opacity-100">
              <div className="w-6 h-6 bg-brand-forest rounded-md flex items-center justify-center">
                <img src="/favicon.svg" alt="Skild Logo" className="w-3.5 h-3.5 invert" />
              </div>
              <span className="font-serif font-bold text-sm tracking-tight text-brand-forest">skild hub</span>
            </div>
            <div className="text-[10px] text-brand-forest/30 font-mono tracking-wider">
              © {new Date().getFullYear()} Skild Protocol · registry.skild.sh
            </div>
          </div>
          <div className="flex items-center gap-8 text-xs text-brand-forest/40 font-medium">
            <a href="https://skild.sh" target="_blank" rel="noreferrer" className="hover:text-brand-forest transition-colors">skild.sh</a>
            <a href="https://github.com/Peiiii/skild" target="_blank" rel="noreferrer" className="hover:text-brand-forest transition-colors">GitHub</a>
            <a href="https://agentskills.io" target="_blank" rel="noreferrer" className="hover:text-brand-forest transition-colors">Spec</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
