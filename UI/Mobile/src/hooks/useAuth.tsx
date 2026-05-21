import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { getProfile, login } from '../api/auth';
import { setAuthToken } from '../api/client';
import { AuthResult, User } from '../types/domain';

interface StoredSession {
  token?: string;
  user: User;
}

interface AuthContextValue {
  isLoading: boolean;
  token?: string;
  user?: User;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SESSION_KEY = 'laktasense.mobile.session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function getStoredSession() {
  if (Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage.getItem(SESSION_KEY);
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

async function setStoredSession(value: string) {
  if (Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem(SESSION_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function removeStoredSession() {
  if (Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<StoredSession | undefined>();

  const persistSession = useCallback(async (authResult: AuthResult) => {
    const nextSession = { token: authResult.token, user: authResult.user };
    setAuthToken(nextSession.token);
    setSession(nextSession);
    await setStoredSession(JSON.stringify(nextSession));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const rawSession = await getStoredSession();
        if (!rawSession) {
          return;
        }

        const parsed = JSON.parse(rawSession) as StoredSession;
        setAuthToken(parsed.token);
        const nextSession = parsed.token ? { token: parsed.token, user: await getProfile() } : parsed;
        await setStoredSession(JSON.stringify(nextSession));

        if (mounted) {
          setSession(nextSession);
        }
      } catch {
        setAuthToken(undefined);
        await removeStoredSession();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await login({ email, password });
      await persistSession(result);
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    setAuthToken(undefined);
    setSession(undefined);
    await removeStoredSession();
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      token: session?.token,
      user: session?.user,
      signIn,
      signOut,
    }),
    [isLoading, session?.token, session?.user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
