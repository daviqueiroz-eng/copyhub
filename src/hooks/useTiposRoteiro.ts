import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TipoRoteiro {
  id: string;
  nome: string;
  descricao: string | null;
  user_id: string;
  created_at: string;
}

export const useTiposRoteiro = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["tipos-roteiro", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_roteiro")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as TipoRoteiro[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateTipoRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string }) => {
      const { error } = await supabase
        .from("tipos_roteiro")
        .insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-roteiro"] });
    },
  });
};

export const useDeleteTipoRoteiro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_roteiro")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-roteiro"] });
    },
  });
};
