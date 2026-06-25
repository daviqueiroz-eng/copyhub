import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MentoradoShare = {
  id: string;
  mentorado_id: string;
  token: string;
  slug: string | null;
  ativo: boolean;
  criado_por: string;
  created_at: string;
  updated_at: string;
};

export const useMentoradoShare = (mentoradoId: string) => {
  return useQuery({
    queryKey: ["mentorado-share", mentoradoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorado_shares")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .maybeSingle();
      if (error) throw error;
      return (data as MentoradoShare | null) ?? null;
    },
    enabled: !!mentoradoId,
  });
};

export const useCriarOuObterMentoradoShare = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mentoradoId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { data: existing } = await supabase
        .from("mentorado_shares")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .maybeSingle();
      if (existing) return existing as MentoradoShare;

      const { data, error } = await supabase
        .from("mentorado_shares")
        .insert({ mentorado_id: mentoradoId, criado_por: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as MentoradoShare;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["mentorado-share", data.mentorado_id] });
    },
  });
};

export const useToggleMentoradoShareAtivo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("mentorado_shares")
        .update({ ativo: input.ativo })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentorado-share"] });
    },
  });
};

export const useAtualizarMentoradoShareSlug = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; slug: string | null }) => {
      const { data, error } = await supabase
        .from("mentorado_shares")
        .update({ slug: input.slug })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as MentoradoShare;
    },
    onSuccess: (data) => {
      if (data) {
        qc.setQueryData(["mentorado-share", data.mentorado_id], data);
      }
      qc.invalidateQueries({ queryKey: ["mentorado-share"] });
    },
  });
};