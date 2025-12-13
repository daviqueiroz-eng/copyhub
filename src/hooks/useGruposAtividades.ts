import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GrupoAtividade {
  id: string;
  grupo_id: string;
  created_by: string;
  titulo: string;
  descricao: string | null;
  data_limite: string | null;
  concluida: boolean;
  created_at: string;
  updated_at: string;
}

export const useGrupoAtividades = (grupoId: string | null) => {
  return useQuery({
    queryKey: ["grupo-atividades", grupoId],
    queryFn: async () => {
      if (!grupoId) return [];
      
      const { data, error } = await supabase
        .from("grupos_atividades")
        .select("*")
        .eq("grupo_id", grupoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GrupoAtividade[];
    },
    enabled: !!grupoId,
  });
};

export const useCreateGrupoAtividade = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { grupo_id: string; titulo: string; descricao?: string; data_limite?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: atividade, error } = await supabase
        .from("grupos_atividades")
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return atividade as GrupoAtividade;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-atividades", variables.grupo_id] });
    },
  });
};

export const useUpdateGrupoAtividade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id, ...data }: { id: string; grupo_id: string; titulo?: string; descricao?: string; data_limite?: string; concluida?: boolean }) => {
      const { error } = await supabase
        .from("grupos_atividades")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-atividades", variables.grupo_id] });
    },
  });
};

export const useDeleteGrupoAtividade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id }: { id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_atividades")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-atividades", variables.grupo_id] });
    },
  });
};
