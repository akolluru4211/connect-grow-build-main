import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle referral after signup
        if (_event === "SIGNED_IN" && session?.user) {
          const referralCode = localStorage.getItem("pending_referral_code");
          if (referralCode) {
            localStorage.removeItem("pending_referral_code");
            try {
              // Look up the referrer by code
              const { data: referrer } = await supabase
                .from("profiles")
                .select("id")
                .eq("referral_code", referralCode.toUpperCase())
                .maybeSingle();

              if (referrer && referrer.id !== session.user.id) {
                await supabase.from("referrals").insert({
                  referrer_id: referrer.id,
                  referred_id: session.user.id,
                  referral_code: referralCode.toUpperCase(),
                });
              }
            } catch (e) {
              console.error("Referral tracking error:", e);
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, referralCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    // Store referral code for post-signup processing
    if (referralCode?.trim()) {
      localStorage.setItem("pending_referral_code", referralCode.trim().toUpperCase());
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: true,
      signUp: async () => ({ error: new Error("AuthProvider not ready") }),
      signIn: async () => ({ error: new Error("AuthProvider not ready") }),
      signOut: async () => {},
    };
  }
  return context;
}
