"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { isNative } from "@/lib/platform";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Native: deep link ile dönen OAuth callback'leri dinle
    let removeAppListener: (() => void) | undefined;
    if (isNative()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', async ({ url }) => {
          // wordwall://auth/callback#access_token=...
          if (url.includes('auth/callback')) {
            // In-App Browser'ı kapat
            import('@capacitor/browser').then(({ Browser }) => Browser.close());

            // URL fragment'tan token'ları çıkar
            const hashPart = url.split('#')[1];
            if (hashPart) {
              const params = new URLSearchParams(hashPart);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              if (accessToken && refreshToken) {
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              }
            }
          }
        });
        removeAppListener = () => {
          App.removeAllListeners();
        };
      });
    }

    return () => {
      subscription.unsubscribe();
      removeAppListener?.();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    if (isNative()) {
      // Native: In-App Browser ile OAuth aç, deep link ile geri dön
      const { Browser } = await import('@capacitor/browser');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: 'wordwall://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (data?.url && !error) {
        await Browser.open({ url: data.url });
      }
    } else {
      // Web: standart redirect
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
