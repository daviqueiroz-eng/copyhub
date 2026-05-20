import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RoteiroGuiaShare = {
  id: string;
  mentorado_id: string;
  guia_numero: number;
  token: string;
  slug: string | null;
  ativo: boolean;
  criado_por: string;
  created_at: string;
  updated_at: string;
};

export const useRoteiroShare = (mentoradoId: string, guiaNumero: number) => {
  return useQuery({
    queryKey: ["roteiro-share", mentoradoId, guiaNumero],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roteiro_guia_shares")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .maybeSingle();
      if (error) throw error;
      return (data as RoteiroGuiaShare | null) ?? null;
    },
    enabled: !!mentoradoId && !!guiaNumero,
  });
};

export const useCriarOuObterShare = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mentoradoId: string; guiaNumero: number }) => {
      if (!user) throw new Error("Não autenticado");
      const { data: existing } = await supabase
        .from("roteiro_guia_shares")
        .select("*")
        .eq("mentorado_id", input.mentoradoId)
        .eq("guia_numero", input.guiaNumero)
        .maybeSingle();
      if (existing) return existing as RoteiroGuiaShare;

      const { data, error } = await supabase
        .from("roteiro_guia_shares")
        .insert({
          mentorado_id: input.mentoradoId,
          guia_numero: input.guiaNumero,
          criado_por: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as RoteiroGuiaShare;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ["roteiro-share", data.mentorado_id, data.guia_numero],
      });
    },
  });
};

export const useToggleShareAtivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("roteiro_guia_shares")
        .update({ ativo: input.ativo })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roteiro-share"] });
    },
  });
};

export const useAtualizarShareSlug = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; slug: string | null }) => {
      const { data, error } = await supabase
        .from("roteiro_guia_shares")
        .update({ slug: input.slug })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as RoteiroGuiaShare;
    },
    onSuccess: (data) => {
      if (data) {
        qc.setQueryData(
          ["roteiro-share", data.mentorado_id, data.guia_numero],
          data
        );
      }
      qc.invalidateQueries({ queryKey: ["roteiro-share"] });
    },
  });
};
