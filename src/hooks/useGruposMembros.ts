import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrupoMembro {
  id: string;
  grupo_id: string;
  user_id: string;
  apelido: string;
  created_at: string;
  profile?: {
    nome: string;
    avatar: string | null;
  };
}

export const useGrupoMembros = (grupoId: string | null) => {
  return useQuery({
    queryKey: ["grupo-membros", grupoId],
    queryFn: async () => {
      if (!grupoId) return [];
      
      const { data: membros, error } = await supabase
        .from("grupos_membros")
        .select("*")
        .eq("grupo_id", grupoId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return membros as GrupoMembro[];
    },
    enabled: !!grupoId,
  });
};

export const useAddGrupoMembro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { grupo_id: string; user_id: string; apelido: string }) => {
      const { data: membro, error } = await supabase
        .from("grupos_membros")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return membro as GrupoMembro;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-membros", variables.grupo_id] });
    },
  });
};

export const useUpdateGrupoMembro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id, ...data }: { id: string; grupo_id: string; apelido?: string }) => {
      const { error } = await supabase
        .from("grupos_membros")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-membros", variables.grupo_id] });
    },
  });
};

export const useRemoveGrupoMembro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id }: { id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_membros")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-membros", variables.grupo_id] });
      queryClient.invalidateQueries({ queryKey: ["grupo-mentorados", variables.grupo_id] });
    },
  });
};
