import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading, authReady } = useAuth();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (authReady && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authReady, navigate]);

  // Verificar se usuário está ativo — only after authReady
  useEffect(() => {
    const checkActiveStatus = async () => {
      if (!user || !session) {
        setIsActive(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('ativo')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (!data.ativo) {
          console.log('User is blocked, redirecting...');
          await supabase.auth.signOut();
          navigate("/auth", { replace: true });
          return;
        }

        setIsActive(data.ativo);
      } catch (error) {
        console.error('Error checking active status:', error);
        // Fallback: allow access instead of showing blank screen
        setIsActive(true);
      }
    };

    if (authReady && user && session) {
      checkActiveStatus();
    }
  }, [user, session, authReady, navigate]);

  // Wait for auth to be fully ready before showing anything
  if (!authReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // While checking active status, show loader
  if (isActive === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isActive) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
