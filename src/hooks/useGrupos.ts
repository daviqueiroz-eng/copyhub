import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Grupo {
  id: string;
  created_by: string;
  nome: string;
  descricao_meta: string | null;
  data_inicio_meta: string | null;
  data_fim_meta: string | null;
  created_at: string;
  updated_at: string;
}

export const useGrupos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["grupos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Grupo[];
    },
    enabled: !!user,
  });
};

export const useGrupo = (grupoId: string | null) => {
  return useQuery({
    queryKey: ["grupo", grupoId],
    queryFn: async () => {
      if (!grupoId) return null;
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("id", grupoId)
        .single();

      if (error) throw error;
      return data as Grupo;
    },
    enabled: !!grupoId,
  });
};

export const useCreateGrupo = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao_meta?: string; data_inicio_meta?: string; data_fim_meta?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: grupo, error } = await supabase
        .from("grupos")
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return grupo as Grupo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
    },
  });
};

export const useUpdateGrupo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Grupo> & { id: string }) => {
      const { error } = await supabase
        .from("grupos")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
      queryClient.invalidateQueries({ queryKey: ["grupo"] });
    },
  });
};

export const useDeleteGrupo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grupos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
    },
  });
};
