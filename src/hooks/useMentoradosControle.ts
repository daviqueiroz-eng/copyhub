import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type MentoradoControle = {
  id: string;
  nome: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export const useMentoradosControle = () => {
  return useQuery({
    queryKey: ["mentorados-controle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados_controle")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as MentoradoControle[];
    },
  });
};

export const useCreateMentoradoControle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newMentorado: { nome: string }) => {
      // Buscar a maior ordem existente
      const { data: mentorados } = await supabase
        .from("mentorados_controle")
        .select("ordem")
        .order("ordem", { ascending: false })
        .limit(1);
      
      const maxOrdem = mentorados?.[0]?.ordem || 0;
      
      const { data, error } = await supabase
        .from("mentorados_controle")
        .insert({ ...newMentorado, ordem: maxOrdem + 1 })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados-controle"] });
      toast({
        title: "Mentorado adicionado",
        description: "O mentorado foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar mentorado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMentoradoControle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MentoradoControle> & { id: string }) => {
      const { data, error } = await supabase
        .from("mentorados_controle")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados-controle"] });
      toast({
        title: "Mentorado atualizado",
        description: "O mentorado foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar mentorado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMentoradoControle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mentorados_controle")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados-controle"] });
      toast({
        title: "Mentorado removido",
        description: "O mentorado foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover mentorado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
