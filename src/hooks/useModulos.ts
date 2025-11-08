import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type Modulo = {
  id: string;
  treinamento_id: string;
  titulo: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export const useModulos = (treinamentoId?: string) => {
  return useQuery({
    queryKey: ["modulos", treinamentoId],
    queryFn: async () => {
      let query = supabase
        .from("modulos")
        .select("*")
        .order("ordem", { ascending: true });

      if (treinamentoId) {
        query = query.eq("treinamento_id", treinamentoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Modulo[];
    },
    enabled: !!treinamentoId,
  });
};

export const useCreateModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modulo: Omit<Modulo, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("modulos")
        .insert(modulo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modulos", variables.treinamento_id] });
      toast({
        title: "Módulo criado",
        description: "O módulo foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Modulo> & { id: string }) => {
      const { data, error } = await supabase
        .from("modulos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modulos", data.treinamento_id] });
      toast({
        title: "Módulo atualizado",
        description: "O módulo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteModulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, treinamentoId }: { id: string; treinamentoId: string }) => {
      const { error } = await supabase
        .from("modulos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return treinamentoId;
    },
    onSuccess: (treinamentoId) => {
      queryClient.invalidateQueries({ queryKey: ["modulos", treinamentoId] });
      toast({
        title: "Módulo deletado",
        description: "O módulo foi deletado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
