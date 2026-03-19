import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGestaoEntregasStatus = () => {
  return useQuery({
    queryKey: ["gestao-entregas-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestao_entregas_status")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((d: any) => d.nome as string);
    },
  });
};

export const useCreateGestaoEntregaStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("gestao_entregas_status")
        .insert({ nome, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestao-entregas-status"] });
    },
  });
};
