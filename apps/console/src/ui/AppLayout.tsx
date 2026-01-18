import * as React from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
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
  Rocket,
  User,
  Menu,
  X
} from 'lucide-react';
import { DesignGrid } from '@/components/ui/design-grid';

function TopNavLink({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon?: React.ElementType }): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-1.5 text-sm font-medium text-brand-forest/60 hover:text-brand-forest transition-all active:scale-95 shrink-0',
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
  const location = useLocation();
  const publisher = auth.publisher;
  const authed = auth.status === 'authed' && publisher !== null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close menu on navigation
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
          <div className="flex items-center gap-4 lg:gap-6">
            <nav className="hidden lg:flex items-center lg:gap-4 xl:gap-6 border-r border-border/40 lg:pr-4 xl:pr-8 lg:mr-1 xl:mr-2 last:border-0 last:pr-0 last:mr-0">
              <TopNavLink to="/getting-started" icon={Rocket}>Get Started</TopNavLink>
              <TopNavLink to="/skills" icon={Compass}>Skills</TopNavLink>
              <TopNavLink to="/skillsets" icon={Layers}>Skillsets</TopNavLink>
              <TopNavLink to="/leaderboard" icon={Trophy}>Top</TopNavLink>
              <TopNavLink to="/linked" icon={Github}>Submit</TopNavLink>
              <TopNavLink to="/publish" icon={Upload}>Publish</TopNavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                {authed ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 px-3 gap-2 font-mono text-sm">
                        @{publisher.handle}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-white shadow-2xl shadow-brand-forest/20 border-brand-forest/10">
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
                ) : (
                  <>
                    <TopNavLink to="/login">Login</TopNavLink>
                    <Button asChild size="sm" className="h-8 rounded-full px-5">
                      <Link to="/signup">Sign up</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "lg:hidden h-9 w-9 transition-all duration-300",
                  isMobileMenuOpen ? "bg-brand-forest text-white" : "text-brand-forest/60"
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </Button>

              <a
                className="hidden lg:flex items-center gap-1.5 text-sm text-brand-forest/60 hover:text-brand-forest transition-colors group"
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
      <main className="mx-auto max-w-7xl px-4 py-10 pb-24 md:pb-10 flex-1 w-full">
        <Outlet />
      </main>

      {/* Premium Bottom Tab Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
        <div className="mx-auto max-w-md bg-white/80 backdrop-blur-xl border border-brand-forest/10 rounded-[32px] shadow-2xl shadow-brand-forest/20 flex items-center justify-around p-2">
          {[
            { to: "/getting-started", icon: Rocket, label: "Started" },
            { to: "/skills", icon: Compass, label: "Explore" },
            { to: "/skillsets", icon: Layers, label: "Sets" },
            { to: "/leaderboard", icon: Trophy, label: "Top" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "text-brand-forest bg-brand-forest/5" 
                    : "text-brand-forest/40 hover:text-brand-forest/60"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
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

      {/* Mobile Navigation Drawer - Side Sliding */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-brand-forest/40 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-[300px] z-[100] bg-white lg:hidden transition-all duration-300 ease-in-out shadow-2xl border-l border-brand-forest/10",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-brand-forest/[0.02] to-transparent pointer-events-none" />
        <div className="flex flex-col h-full p-6 pt-10 gap-8 overflow-y-auto relative z-10">
          {/* Header in Drawer */}
          <div className="flex items-center justify-between px-2 shrink-0">
            <span className="text-xl font-serif font-bold text-brand-forest">Account</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-8 w-8 text-brand-forest/40"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col gap-8">
            {/* User Identity Section */}
            {authed ? (
              <div className="flex flex-col gap-6">
                <div className="p-5 rounded-3xl bg-brand-forest/[0.03] border border-brand-forest/10 flex items-center gap-4 relative overflow-hidden group transition-all hover:bg-brand-forest/[0.05]">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-forest/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-2xl bg-brand-forest flex items-center justify-center shadow-xl shadow-brand-forest/20 relative z-10 hover:scale-105 transition-transform">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex flex-col relative z-10">
                    <span className="font-serif font-bold text-xl text-brand-forest leading-tight">@{publisher?.handle}</span>
                    <span className="text-[10px] text-brand-forest/40 uppercase tracking-[0.2em] font-black mt-0.5">Verified Profile</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-forest/20 px-4 mb-2">Management</span>
                  {[
                    { to: "/me", icon: LayoutDashboard, label: "Dashboard" },
                    { to: "/me/skills", icon: Package, label: "My Skills" },
                    { to: "/me/tokens", icon: Key, label: "Tokens" },
                    { to: "/me/settings", icon: Settings, label: "Settings" },
                  ].map((item) => (
                    <Button key={item.to} variant="ghost" asChild className="justify-start gap-4 h-12 rounded-2xl hover:bg-brand-forest/5 font-medium text-sm transition-all active:scale-[0.98] text-brand-forest/70 hover:text-brand-forest">
                      <Link to={item.to}>
                        <item.icon className="w-4.5 h-4.5 opacity-60" /> 
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-forest/20 px-4 mb-2">Developer Tools</span>
                  {[
                    { to: "/linked", icon: Github, label: "Submit from GitHub" },
                    { to: "/publish", icon: Upload, label: "Registry Publisher" },
                  ].map((item) => (
                    <Button key={item.to} variant="ghost" asChild className="justify-start gap-4 h-12 rounded-2xl hover:bg-brand-forest/5 font-medium text-sm transition-all active:scale-[0.98] text-brand-forest/70 hover:text-brand-forest">
                      <Link to={item.to}>
                        <item.icon className="w-4.5 h-4.5 opacity-60" /> 
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 py-4">
                <div className="p-8 rounded-[32px] bg-brand-forest/5 border border-brand-forest/10 text-center flex flex-col gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto mb-2">
                    <User className="w-8 h-8 text-brand-forest/20" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-brand-forest">Welcome to Skild</h3>
                  <p className="text-sm text-brand-forest/60 leading-relaxed">Sign in to manage your skills and access developer tools.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild className="w-full h-14 rounded-2xl text-base font-serif font-bold shadow-xl shadow-brand-forest/20">
                    <Link to="/signup">Create Account</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full h-14 rounded-2xl text-base font-serif font-bold border-brand-forest/10">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-brand-forest/5 flex flex-col gap-6 relative z-10">
            {authed && (
              <Button 
                variant="ghost" 
                onClick={() => void auth.logout()} 
                className="justify-start gap-4 px-4 h-12 text-destructive hover:text-destructive hover:bg-destructive/5 font-bold transition-all active:scale-[0.98] group"
              >
                <div className="w-8 h-8 rounded-lg bg-destructive/0 group-hover:bg-destructive/10 flex items-center justify-center transition-colors">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                Logout Session
              </Button>
            )}
            
            <div className="flex items-center justify-between px-4 pb-2 font-mono text-[10px] text-brand-forest/20">
              <div className="flex items-center gap-4 uppercase tracking-widest font-black opacity-60">
                <a href="https://skild.sh" target="_blank" rel="noreferrer" className="hover:text-brand-forest transition-colors">skild.sh</a>
                <a href="https://github.com/Peiiii/skild" target="_blank" rel="noreferrer" className="hover:text-brand-forest transition-colors">GitHub</a>
              </div>
              <span className="italic">v0.0.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
