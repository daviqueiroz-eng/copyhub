import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type HeadlineVotacao = {
  id: string;
  criado_por: string;
  mentorado_id: string;
  guia_numero: number;
  ordem: number;
  headline_texto: string;
  iniciada_em: string;
  expira_em: string;
  encerrada: boolean;
  created_at: string;
};

export type HeadlineVoto = {
  id: string;
  votacao_id: string;
  user_id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
};

export const useDispararVotacao = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      mentoradoId: string;
      guiaNumero: number;
      ordem: number;
      headline: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("headline_votacoes")
        .insert({
          criado_por: user.id,
          mentorado_id: input.mentoradoId,
          guia_numero: input.guiaNumero,
          ordem: input.ordem,
          headline_texto: input.headline,
        })
        .select()
        .single();
      if (error) throw error;
      return data as HeadlineVotacao;
    },
  });
};

export const useRegistrarVoto = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      votacao_id: string;
      nota: number;
      comentario?: string | null;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("headline_votacoes_votos").insert({
        votacao_id: input.votacao_id,
        user_id: user.id,
        nota: input.nota,
        comentario: input.comentario ?? null,
      });
      if (error) throw error;
    },
  });
};

// Minhas votações (criadas por mim) + agregação de votos
export const useMinhasVotacoes = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`minhas-votacoes-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "headline_votacoes" },
        () => qc.invalidateQueries({ queryKey: ["minhas-votacoes", user.id] })
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "headline_votacoes_votos" },
        () => qc.invalidateQueries({ queryKey: ["minhas-votacoes", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["minhas-votacoes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: votacoes, error } = await supabase
        .from("headline_votacoes")
        .select("*")
        .eq("criado_por", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const ids = (votacoes ?? []).map((v) => v.id);
      if (ids.length === 0) return [];

      const { data: votos } = await supabase
        .from("headline_votacoes_votos")
        .select("*")
        .in("votacao_id", ids);

      const { data: vistas } = await supabase
        .from("headline_votacoes_visualizadas")
        .select("votacao_id")
        .eq("user_id", user.id)
        .in("votacao_id", ids);

      const vistasSet = new Set((vistas ?? []).map((v) => v.votacao_id));

      return (votacoes as HeadlineVotacao[]).map((v) => {
        const meus = ((votos ?? []) as HeadlineVoto[]).filter(
          (x) => x.votacao_id === v.id
        );
        const media = meus.length
          ? meus.reduce((a, b) => a + b.nota, 0) / meus.length
          : 0;
        return {
          votacao: v,
          votos: meus,
          media,
          visualizada: vistasSet.has(v.id),
        };
      });
    },
    enabled: !!user?.id,
  });
};

export const useMarcarVotacaoVisualizada = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (votacao_id: string) => {
      if (!user) return;
      await supabase
        .from("headline_votacoes_visualizadas")
        .upsert(
          { votacao_id, user_id: user.id },
          { onConflict: "votacao_id,user_id" }
        );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minhas-votacoes", user?.id] });
    },
  });
};

export const useEncerrarVotacao = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("headline_votacoes")
        .update({ encerrada: true })
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minhas-votacoes", user?.id] });
    },
  });
};
