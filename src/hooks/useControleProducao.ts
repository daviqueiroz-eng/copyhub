import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ControleProducao = {
  id: string;
  data: string;
  mentorado: string;
  quantidade_roteiros: string;
  maiores_dificuldades: string | null;
  horas_trabalhadas: string;
  plataformas: string;
  created_at: string;
  updated_at: string;
};

export const useControleProducao = () => {
  return useQuery({
    queryKey: ["controle-producao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controle_producao")
        .select("*")
        .order("data", { ascending: false });
      
      if (error) throw error;
      return data as ControleProducao[];
    },
  });
};

export const useCreateControleProducao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newControle: Omit<ControleProducao, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("controle_producao")
        .insert(newControle)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-producao"] });
      toast({
        title: "Registro criado",
        description: "O controle de produção foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateControleProducao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ControleProducao> & { id: string }) => {
      const { data, error } = await supabase
        .from("controle_producao")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-producao"] });
      toast({
        title: "Registro atualizado",
        description: "O controle de produção foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteControleProducao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("controle_producao")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-producao"] });
      toast({
        title: "Registro deletado",
        description: "O controle de produção foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
