import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type FlowTarefa = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  status: "todo" | "doing" | "done";
  ordem: number;
  prioridade: "baixa" | "media" | "alta";
  data_limite: string | null;
  atividade_geral_id: string | null;
  created_at: string;
  updated_at: string;
};

export const useFlowTarefas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["flow-tarefas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flow_tarefas")
        .select("*")
        .eq("user_id", user!.id)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as FlowTarefa[];
    },
    enabled: !!user,
  });
};

export const useCreateTarefa = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string;
      prioridade?: "baixa" | "media" | "alta";
      data_limite?: string;
    }) => {
      const { error } = await supabase
        .from("flow_tarefas")
        .insert({
          user_id: user!.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-tarefas"] });
      toast({
        title: "Tarefa criada!",
      });
    },
  });
};

export const useUpdateTarefa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, atividade_geral_id, ...data }: Partial<FlowTarefa> & { id: string }) => {
      // Se for atividade geral, permitir apenas atualização de status e ordem
      const updateData = atividade_geral_id 
        ? { status: data.status, ordem: data.ordem }
        : data;

      const { error } = await supabase
        .from("flow_tarefas")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-tarefas"] });
    },
  });
};

export const useDeleteTarefa = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flow_tarefas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-tarefas"] });
      toast({
        title: "Tarefa excluída!",
        variant: "destructive",
      });
    },
  });
};
