import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrupoTag {
  id: string;
  grupo_id: string;
  nome: string;
  cor: string;
  created_at: string;
}

export const useGrupoTags = (grupoId: string | null) => {
  return useQuery({
    queryKey: ["grupo-tags", grupoId],
    queryFn: async () => {
      if (!grupoId) return [];
      
      const { data, error } = await supabase
        .from("grupos_tags")
        .select("*")
        .eq("grupo_id", grupoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as GrupoTag[];
    },
    enabled: !!grupoId,
  });
};

export const useCreateGrupoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { grupo_id: string; nome: string; cor: string }) => {
      const { data: tag, error } = await supabase
        .from("grupos_tags")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return tag as GrupoTag;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-tags", variables.grupo_id] });
    },
  });
};

export const useUpdateGrupoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id, ...data }: { id: string; grupo_id: string; nome?: string; cor?: string }) => {
      const { error } = await supabase
        .from("grupos_tags")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-tags", variables.grupo_id] });
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};

export const useDeleteGrupoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id }: { id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-tags", variables.grupo_id] });
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};
