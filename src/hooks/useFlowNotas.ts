import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type FlowNota = {
  id: string;
  user_id: string;
  titulo: string;
  conteudo: string | null;
  cor: string;
  created_at: string;
  updated_at: string;
};

export const useFlowNotas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["flow-notas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flow_notas")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FlowNota[];
    },
    enabled: !!user,
  });
};

export const useCreateNota = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { titulo: string; conteudo?: string; cor?: string }) => {
      const { error } = await supabase
        .from("flow_notas")
        .insert({
          user_id: user!.id,
          titulo: data.titulo,
          conteudo: data.conteudo || null,
          cor: data.cor || "#fbbf24",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-notas"] });
      toast({
        title: "Nota criada!",
        description: "Sua nota foi salva com sucesso.",
      });
    },
  });
};

export const useUpdateNota = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<FlowNota> & { id: string }) => {
      const { error } = await supabase
        .from("flow_notas")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-notas"] });
      toast({
        title: "Nota atualizada!",
      });
    },
  });
};

export const useDeleteNota = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flow_notas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-notas"] });
      toast({
        title: "Nota excluída!",
        variant: "destructive",
      });
    },
  });
};
