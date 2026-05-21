import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthResult = { error?: string; needsConfirmation?: boolean };

// The app owner who moderates new courts. UI-level gate for the prototype.
export const OWNER_EMAIL = 'bagnegil@gmail.com';

type Auth = {
  session: Session | null;
  playerName: string | null;
  isOwner: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<AuthResult>;
};

const AuthContext = createContext<Auth | null>(null);

function nameFromSession(session: Session | null): string | null {
  if (!session) return null;
  const meta = session.user.user_metadata as { name?: string } | undefined;
  return meta?.name?.trim() || session.user.email || 'Player';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? { error: error.message } : {};
  }

  async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) return { error: error.message };
    // When email confirmation is enabled, sign-up returns no session.
    return { needsConfirmation: !data.session };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateName(name: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.updateUser({
      data: { name: name.trim() },
    });
    if (error) return { error: error.message };
    // Reflect the new name immediately (a USER_UPDATED event also refreshes it).
    if (data.user) setSession((s) => (s ? { ...s, user: data.user } : s));
    return {};
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        playerName: nameFromSession(session),
        isOwner: session?.user.email === OWNER_EMAIL,
        initializing,
        signIn,
        signUp,
        signOut,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
