import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type AdjetivoTipo = "positivo" | "negativo";

export type AdjetivoPoderoso = {
  id: string;
  texto: string;
  tipo: AdjetivoTipo;
  user_id: string;
  created_at: string;
};

export const useAdjetivosPoderosos = () => {
  return useQuery({
    queryKey: ["adjetivos_poderosos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adjetivos_poderosos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdjetivoPoderoso[];
    },
  });
};

export const useCreateAdjetivoPoderoso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { texto: string; tipo: AdjetivoTipo; user_id: string }) => {
      const { data: result, error } = await supabase
        .from("adjetivos_poderosos")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjetivos_poderosos"] });
      toast({ title: "Adjetivo adicionado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao adicionar adjetivo", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteAdjetivoPoderoso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("adjetivos_poderosos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjetivos_poderosos"] });
      toast({ title: "Adjetivo removido" });
    },
  });
};
