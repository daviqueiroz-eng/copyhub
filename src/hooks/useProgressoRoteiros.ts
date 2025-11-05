import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ProgressoRoteiro = {
  id: string;
  user_id: string;
  roteiro_id: string;
  completado: boolean;
  data_completado: string | null;
  created_at: string;
};

export const useProgressoRoteiros = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["progresso-roteiros", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("progresso_roteiros")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as ProgressoRoteiro[];
    },
    enabled: !!user,
  });
};

export const useCompletarRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roteiro_id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("progresso_roteiros")
        .upsert({
          user_id: user.id,
          roteiro_id,
          completado: true,
          data_completado: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresso-roteiros"] });
      queryClient.invalidateQueries({ queryKey: ["medalhas-usuario"] });
      toast({
        title: "Roteiro completado!",
        description: "Parabéns por concluir este roteiro!",
      });
    },
  });
};
