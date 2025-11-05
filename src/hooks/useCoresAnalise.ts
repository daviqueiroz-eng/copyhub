import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type CorAnalise = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export const useCoresAnalise = () => {
  return useQuery({
    queryKey: ["cores-analise"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cores_analise")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as CorAnalise[];
    },
  });
};

export const useCreateCorAnalise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cor: { nome: string; cor: string; ordem: number }) => {
      const { data, error } = await supabase
        .from("cores_analise")
        .insert(cor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cores-analise"] });
      toast({
        title: "Cor criada",
        description: "A cor de análise foi criada com sucesso.",
      });
    },
  });
};

export const useUpdateCorAnalise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorAnalise> & { id: string }) => {
      const { data, error } = await supabase
        .from("cores_analise")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cores-analise"] });
      toast({
        title: "Cor atualizada",
        description: "A cor foi atualizada com sucesso.",
      });
    },
  });
};

export const useDeleteCorAnalise = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cores_analise")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cores-analise"] });
      toast({
        title: "Cor deletada",
        description: "A cor foi removida com sucesso.",
      });
    },
  });
};
