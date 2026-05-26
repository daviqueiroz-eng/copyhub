import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RoteiroComentario = {
  id: string;
  share_id: string | null;
  mentorado_id: string;
  guia_numero: number;
  ordem: number;
  escopo: "headline" | "estrutura" | "selecao";
  trecho_texto: string | null;
  autor_nome: string;
  autor_user_id: string | null;
  conteudo_texto: string | null;
  audio_url: string | null;
  audio_duracao_segundos?: number | null;
  parent_id?: string | null;
  arquivado?: boolean;
  resolvido: boolean;
  lido_por: string[];
  created_at: string;
};

export const useRoteiroComentarios = (
  mentoradoId: string,
  guiaNumero: number
) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!mentoradoId || !guiaNumero) return;
    const ch = supabase
      .channel(`roteiro-comentarios-${mentoradoId}-${guiaNumero}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "roteiro_comentarios",
          filter: `mentorado_id=eq.${mentoradoId}`,
        },
        () =>
          qc.invalidateQueries({
            queryKey: ["roteiro-comentarios", mentoradoId, guiaNumero],
          })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [mentoradoId, guiaNumero, qc]);

  return useQuery({
    queryKey: ["roteiro-comentarios", mentoradoId, guiaNumero],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roteiro_comentarios")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("arquivado", false)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as RoteiroComentario[];
      const rank = (e: string) => (e === "headline" ? 1 : e === "estrutura" ? 2 : 3);
      return rows.sort((a, b) => {
        if (a.ordem !== b.ordem) return a.ordem - b.ordem;
        const r = rank(a.escopo) - rank(b.escopo);
        if (r !== 0) return r;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    },
    enabled: !!mentoradoId && !!guiaNumero,
  });
};

export const useCriarComentarioInterno = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      mentoradoId: string;
      guiaNumero: number;
      ordem: number;
      escopo: "headline" | "estrutura" | "selecao";
      trecho_texto?: string | null;
      conteudo_texto?: string | null;
      audio_url?: string | null;
      audio_duracao_segundos?: number | null;
      parent_id?: string | null;
      share_id?: string | null;
      autor_nome: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("roteiro_comentarios").insert({
        mentorado_id: input.mentoradoId,
        guia_numero: input.guiaNumero,
        ordem: input.ordem,
        escopo: input.escopo,
        trecho_texto: input.trecho_texto ?? null,
        conteudo_texto: input.conteudo_texto ?? null,
        audio_url: input.audio_url ?? null,
        audio_duracao_segundos: input.audio_duracao_segundos ?? null,
        parent_id: input.parent_id ?? null,
        share_id: input.share_id ?? null,
        autor_user_id: user.id,
        autor_nome: input.autor_nome,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["roteiro-comentarios", vars.mentoradoId, vars.guiaNumero],
      });
    },
  });
};

export const useMarcarComentarioResolvido = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; resolvido: boolean }) => {
      const { error } = await supabase
        .from("roteiro_comentarios")
        .update({ resolvido: input.resolvido })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roteiro-comentarios"] });
    },
  });
};

export const useDeletarComentario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete: nada é apagado, apenas arquivado
      const { error } = await supabase
        .from("roteiro_comentarios")
        .update({ arquivado: true } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roteiro-comentarios"] });
    },
  });
};
