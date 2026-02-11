import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ControleLeva = {
  id: string;
  user_id: string;
  mentorado_id: string;
  numero_leva: number;
  data_inicio: string;
  dias_uteis: number | null;
  data_prevista: string | null;
  data_real: string | null;
  concluida: boolean;
  created_at: string;
};

export const useControleLevas = () => {
  return useQuery({
    queryKey: ["controle-levas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controle_levas")
        .select("*")
        .order("data_inicio", { ascending: true });

      if (error) throw error;
      return data as ControleLeva[];
    },
  });
};

export const useCreateControleLeva = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (leva: {
      user_id: string;
      mentorado_id: string;
      numero_leva: number;
      data_inicio: string;
      dias_uteis?: number;
      data_prevista?: string;
    }) => {
      const { data, error } = await supabase
        .from("controle_levas")
        .insert(leva)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-levas"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar leva",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateControleLeva = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ControleLeva> & { id: string }) => {
      const { data, error } = await supabase
        .from("controle_levas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-levas"] });
    },
  });
};

export const useDeleteControleLeva = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("controle_levas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-levas"] });
      toast({
        title: "Leva removida",
        description: "A leva foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover leva",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
