import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TipoAjuste {
  id: string;
  nome: string;
  descricao: string | null;
  instrucoes: string | null;
  user_id: string;
  created_at: string;
}

export const useTiposAjuste = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["tipos-ajuste", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_ajuste")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as TipoAjuste[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateTipoAjuste = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; instrucoes?: string }) => {
      const { error } = await supabase
        .from("tipos_ajuste")
        .insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-ajuste"] });
    },
  });
};

export const useUpdateTipoAjuste = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      nome?: string;
      descricao?: string | null;
      instrucoes?: string | null;
    }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("tipos_ajuste")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-ajuste"] });
    },
  });
};

export const useDeleteTipoAjuste = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_ajuste")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-ajuste"] });
    },
  });
};
