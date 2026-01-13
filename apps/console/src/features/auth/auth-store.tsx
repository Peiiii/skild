import React from 'react';
import type { Publisher } from '@/lib/api-types';
import { me, sessionLogin, sessionLogout } from '@/lib/api';
import { getRegistryUrl } from '@/lib/env';

type AuthStatus = 'loading' | 'authed' | 'guest';

export interface AuthContextValue {
  status: AuthStatus;
  publisher: Publisher | null;
  error: string | null;
  refresh: () => Promise<void>;
  login: (handleOrEmail: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  const [publisher, setPublisher] = React.useState<Publisher | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const res = await me();
      if (!res.ok || !res.publisher) {
        setPublisher(null);
        setStatus('guest');
        return;
      }
      setPublisher(res.publisher);
      setStatus('authed');
    } catch (err: unknown) {
      setPublisher(null);
      setStatus('guest');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = React.useCallback(
    async (handleOrEmail: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      setError(null);
      const res = await sessionLogin(handleOrEmail, password);
      if (!res.ok) {
        setStatus('guest');
        setPublisher(null);
        return res;
      }
      try {
        const meRes = await me();
        if (!meRes.ok || !meRes.publisher) {
          setStatus('guest');
          setPublisher(null);
          const consoleOrigin = globalThis.location?.origin ?? '(unknown)';
          const registryUrl = getRegistryUrl();
          const hint =
            consoleOrigin.includes('localhost') || consoleOrigin.includes('127.0.0.1')
              ? ` If you are running Skild Hub locally, ensure Hub and Registry use the same hostname (both localhost or both 127.0.0.1). Current: hub=${consoleOrigin}, registry=${registryUrl}.`
              : '';
          const base =
            meRes.ok
              ? 'Login succeeded, but the browser did not establish a session cookie (this is NOT related to email verification). Please retry.'
              : meRes.error;
          return { ok: false, error: `${base}${hint}` };
        }
        setPublisher(meRes.publisher);
        setStatus('authed');
        return { ok: true };
      } catch (err: unknown) {
        setStatus('guest');
        setPublisher(null);
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    []
  );

  const logout = React.useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await sessionLogout();
    } finally {
      setPublisher(null);
      setStatus('guest');
    }
  }, []);

  const value: AuthContextValue = React.useMemo(
    () => ({ status, publisher, error, refresh, login, logout }),
    [status, publisher, error, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
