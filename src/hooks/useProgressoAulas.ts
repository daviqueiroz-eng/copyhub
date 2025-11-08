import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ProgressoAula = {
  id: string;
  aula_id: string;
  user_id: string;
  concluido: boolean;
  data_conclusao?: string;
  created_at: string;
  updated_at: string;
};

export const useProgressoAulas = (userId?: string) => {
  return useQuery({
    queryKey: ["progresso_aulas", userId],
    queryFn: async () => {
      let query = supabase
        .from("progresso_aulas")
        .select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProgressoAula[];
    },
    enabled: !!userId,
  });
};

export const useToggleProgressoAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      aulaId, 
      userId, 
      concluido 
    }: { 
      aulaId: string; 
      userId: string; 
      concluido: boolean;
    }) => {
      // Verificar se já existe um registro
      const { data: existing } = await supabase
        .from("progresso_aulas")
        .select("*")
        .eq("aula_id", aulaId)
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { data, error } = await supabase
          .from("progresso_aulas")
          .update({
            concluido,
            data_conclusao: concluido ? new Date().toISOString() : null,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from("progresso_aulas")
          .insert({
            aula_id: aulaId,
            user_id: userId,
            concluido,
            data_conclusao: concluido ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progresso_aulas", variables.userId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar progresso",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
