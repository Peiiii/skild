import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth-store';

export function RequireAuth({ children }: { children: React.ReactNode }): JSX.Element {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (auth.status !== 'authed') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

