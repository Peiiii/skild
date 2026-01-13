import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';

export function HomePage(): JSX.Element {
  const auth = useAuth();
  if (auth.status === 'loading') return <div className="text-sm text-muted-foreground">Loading…</div>;
  return <Navigate to={auth.status === 'authed' ? '/me' : '/skills'} replace />;
}

