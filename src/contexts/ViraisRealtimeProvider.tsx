import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ViralAprovadoToast } from "@/components/virais/ViralAprovadoToast";

/**
 * Subscribe global a INSERTs em `virais` para disparar o toast
 * "Viral Aprovado!!" para todos os usuários autenticados.
 * Não duplica toasts do próprio autor (esses são disparados no submit).
 */
export const ViraisRealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("virais-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "virais" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["virais"] });
          const row: any = payload.new;
          // Não notificar o próprio autor (já viu o toast localmente)
          if (row?.user_id === user.id) return;

          toast.custom(
            () => (
              <ViralAprovadoToast
                onClick={() => navigate("/virais")}
              />
            ),
            { duration: 6000 }
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, navigate, queryClient]);

  return <>{children}</>;
};