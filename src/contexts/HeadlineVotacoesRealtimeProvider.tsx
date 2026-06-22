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

    const showVotacao = (v: HeadlineVotacao) => {
      if (!v) return;
      if (v.criado_por === user.id) return;
      if (shownRef.current.has(v.id)) return;
      const expiraMs = new Date(v.expira_em).getTime() - Date.now();
      if (expiraMs <= 0) return;
      shownRef.current.add(v.id);
      const id = `votacao-${v.id}`;
      toast.custom(
        () => (
          <HeadlineVotacaoToast
            votacao={v}
            onClose={() => toast.dismiss(id)}
          />
        ),
        { id, duration: expiraMs, position: "top-right" }
      );
    };

    const fetchActive = async () => {
      const { data } = await supabase
        .from("headline_votacoes")
        .select("*")
        .eq("encerrada", false)
        .gt("expira_em", new Date().toISOString());
      (data ?? []).forEach((v: any) => showVotacao(v as HeadlineVotacao));
    };

    // Carregamento inicial
    fetchActive();

    // Polling fallback (caso realtime falhe)
    const pollId = setInterval(fetchActive, 5000);

    const channel = supabase
      .channel("headline-votacoes-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "headline_votacoes" },
        (payload) => {
          showVotacao(payload.new as HeadlineVotacao);
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      clearInterval(pollId);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user?.id]);

  return <>{children}</>;
};
