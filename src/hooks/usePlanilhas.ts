import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Planilha = {
  id: string;
  nome: string;
  link: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export const usePlanilhas = () => {
  return useQuery({
    queryKey: ["planilhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planilhas")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as Planilha[];
    },
  });
};

export const useCreatePlanilha = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newPlanilha: Omit<Planilha, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("planilhas")
        .insert(newPlanilha)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planilhas"] });
      toast({
        title: "Planilha criada",
        description: "A planilha foi registrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar planilha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePlanilha = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Planilha> & { id: string }) => {
      const { data, error } = await supabase
        .from("planilhas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planilhas"] });
    },
  });
};

export const useDeletePlanilha = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("planilhas")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planilhas"] });
      toast({
        title: "Planilha deletada",
        description: "A planilha foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar planilha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
