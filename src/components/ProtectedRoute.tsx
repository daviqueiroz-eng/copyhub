import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Verificar se usuário está ativo
  useEffect(() => {
    const checkActiveStatus = async () => {
      if (!user) {
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

    if (user) {
      checkActiveStatus();
    }
  }, [user, navigate]);

  if (loading || isActive === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isActive) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
