import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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

        // Se usuário foi bloqueado, deslogar
        if (data && !data.ativo) {
          console.log('User blocked, signing out...');
          await supabase.auth.signOut();
          navigate("/auth");
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    }, 10000); // Verifica a cada 10 segundos

    return () => {
      subscription.unsubscribe();
      clearInterval(checkUserStatus);
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/`,
        },
      });
      return { error };
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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
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
