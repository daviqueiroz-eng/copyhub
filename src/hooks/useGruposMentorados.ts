import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrupoMentorado {
  id: string;
  grupo_id: string;
  membro_id: string;
  nome: string;
  created_at: string;
  updated_at: string;
  tags?: { id: string; nome: string; cor: string }[];
}

export const useGrupoMentorados = (grupoId: string | null) => {
  return useQuery({
    queryKey: ["grupo-mentorados", grupoId],
    queryFn: async () => {
      if (!grupoId) return [];
      
      // Get mentorados
      const { data: mentorados, error } = await supabase
        .from("grupos_mentorados")
        .select("*")
        .eq("grupo_id", grupoId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get tags for each mentorado
      const mentoradoIds = mentorados.map(m => m.id);
      if (mentoradoIds.length === 0) return mentorados as GrupoMentorado[];

      const { data: tagRelations, error: tagError } = await supabase
        .from("grupos_mentorados_tags")
        .select(`
          mentorado_id,
          tag:grupos_tags(id, nome, cor)
        `)
        .in("mentorado_id", mentoradoIds);

      if (tagError) throw tagError;

      // Merge tags into mentorados
      const mentoradosWithTags = mentorados.map(m => ({
        ...m,
        tags: tagRelations
          .filter(tr => tr.mentorado_id === m.id)
          .map(tr => tr.tag)
          .filter(Boolean) as { id: string; nome: string; cor: string }[]
      }));

      return mentoradosWithTags as GrupoMentorado[];
    },
    enabled: !!grupoId,
  });
};

export const useCreateGrupoMentorado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { grupo_id: string; membro_id: string; nome: string }) => {
      const { data: mentorado, error } = await supabase
        .from("grupos_mentorados")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return mentorado as GrupoMentorado;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};

export const useUpdateGrupoMentorado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id, ...data }: { id: string; grupo_id: string; nome?: string }) => {
      const { error } = await supabase
        .from("grupos_mentorados")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};

export const useDeleteGrupoMentorado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id }: { id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_mentorados")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};

export const useAssignTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mentorado_id, tag_id, grupo_id }: { mentorado_id: string; tag_id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_mentorados_tags")
        .insert({ mentorado_id, tag_id });

      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};

export const useRemoveTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mentorado_id, tag_id, grupo_id }: { mentorado_id: string; tag_id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_mentorados_tags")
        .delete()
        .eq("mentorado_id", mentorado_id)
        .eq("tag_id", tag_id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};
