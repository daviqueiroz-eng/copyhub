import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { HeadlineVotacaoToast } from "@/components/mentorados/HeadlineVotacaoToast";
import type { HeadlineVotacao } from "@/hooks/useHeadlineVotacoes";

export const HeadlineVotacoesRealtimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    // Carregar votações ativas existentes (caso o usuário entre depois)
    (async () => {
      const { data } = await supabase
        .from("headline_votacoes")
        .select("*")
        .eq("encerrada", false)
        .gt("expira_em", new Date().toISOString());
      (data ?? []).forEach((v: any) => {
        if (v.criado_por === user.id) return;
        if (shownRef.current.has(v.id)) return;
        shownRef.current.add(v.id);
        const id = `votacao-${v.id}`;
        const expiraMs = new Date(v.expira_em).getTime() - Date.now();
        if (expiraMs <= 0) return;
        toast.custom(
          () => (
            <HeadlineVotacaoToast
              votacao={v as HeadlineVotacao}
              onClose={() => toast.dismiss(id)}
            />
          ),
          { id, duration: expiraMs, position: "top-right" }
        );
      });
    })();

    const channel = supabase
      .channel("headline-votacoes-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "headline_votacoes" },
        (payload) => {
          const v = payload.new as HeadlineVotacao;
          if (!v) return;
          if (v.criado_por === user.id) return;
          if (shownRef.current.has(v.id)) return;
          shownRef.current.add(v.id);
          const id = `votacao-${v.id}`;
          const expiraMs = new Date(v.expira_em).getTime() - Date.now();
          if (expiraMs <= 0) return;
          toast.custom(
            () => (
              <HeadlineVotacaoToast
                votacao={v}
                onClose={() => toast.dismiss(id)}
              />
            ),
            { id, duration: expiraMs, position: "top-right" }
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user?.id]);

  return <>{children}</>;
};
