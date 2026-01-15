import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-store';
import { PageLoading } from '@/components/PageLoading';

export function HomePage(): JSX.Element {
  const auth = useAuth();
  if (auth.status === 'loading') return <PageLoading />;
  return <Navigate to="/skills" replace />;
}

