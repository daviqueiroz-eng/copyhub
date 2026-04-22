import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useNavigate } from "react-router-dom";

export const isEmbeddedWebView = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const ua = navigator.userAgent || "";
    const patterns = [
      /Obsidian/i,
      /Electron/i,
      /\bwv\b/i, // Android WebView
      /FBAN|FBAV/i, // Facebook
      /Instagram/i,
      /Line\//i,
      /Twitter/i,
      /MicroMessenger/i, // WeChat
      /TikTok/i,
    ];
    if (patterns.some((re) => re.test(ua))) return true;
    if (window.top !== window.self) return true;
  } catch {
    return true; // cross-origin frame access blocked => likely embedded
  }
  return false;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setAuthReady(true);
    };

    const bootstrapAuth = async () => {
      try {
        const hash = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("OAuth callback detected, restoring session from URL hash...");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          applySession(data.session);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        applySession(session);
      } catch (error) {
        console.error("Error restoring auth session:", error);
        applySession(null);
      }
    };

    // Listen for subsequent changes (sign in/out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySession(session);
      }
    );

    void bootstrapAuth();

    // Verificação periódica do status ativo
    const checkUserStatus = setInterval(async () => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('ativo')
          .eq('user_id', currentUser.id)
          .single();

        if (data && !data.ativo) {
          console.log('User blocked, signing out...');
          await supabase.auth.signOut();
          navigate("/auth");
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(checkUserStatus);
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    try {
      // Em ambientes embedded (Obsidian, Electron, webviews) o Google bloqueia
      // OAuth e gera redirect_uri_mismatch. Abrimos a página de auth pública
      // no navegador externo do sistema e instruímos o usuário.
      if (isEmbeddedWebView()) {
        const externalUrl = `${window.location.origin}/auth?external=1`;
        try {
          window.open(externalUrl, "_blank", "noopener,noreferrer");
        } catch {
          // ignore — UI tratará via estado embedded
        }
        return {
          error: {
            message:
              "Abra esta página no seu navegador padrão (Chrome/Safari) para entrar com Google. O login não funciona dentro do Obsidian/webview.",
          },
        };
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });

      return { error: result.error ?? null };
    } catch (error: any) {
      if (error.message?.includes('não autorizado')) {
        return { 
          error: { 
            message: 'Email não autorizado. Entre em contato com o administrador para solicitar acesso.' 
          }
        };
      }
      return { error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const code = (error as any)?.code || "";
      const msg = error.message || "";
      if (code === "email_provider_disabled" || /Email logins are disabled/i.test(msg)) {
        return {
          error: {
            message:
              "O login por email/senha está desativado no backend. Peça ao administrador para ativar o provider Email em Lovable Cloud → Users → Auth Settings → Sign In Methods → Email.",
          },
        };
      }
      if (code === "invalid_credentials" || /Invalid login credentials/i.test(msg)) {
        return {
          error: {
            message:
              "Email ou senha incorretos. Confirme com o administrador a senha definida para sua conta.",
          },
        };
      }
    }

    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authReady, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
