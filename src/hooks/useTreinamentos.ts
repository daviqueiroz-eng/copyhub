import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type Treinamento = {
  id: string;
  titulo: string;
  descricao: string;
  thumbnail_url?: string;
  ordem: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export const useTreinamentos = () => {
  return useQuery({
    queryKey: ["treinamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treinamentos")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as Treinamento[];
    },
  });
};

export const useCreateTreinamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (treinamento: Omit<Treinamento, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("treinamentos")
        .insert(treinamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      toast({
        title: "Treinamento criado",
        description: "O treinamento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar treinamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTreinamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Treinamento> & { id: string }) => {
      const { data, error } = await supabase
        .from("treinamentos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      toast({
        title: "Treinamento atualizado",
        description: "O treinamento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar treinamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTreinamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treinamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treinamentos"] });
      toast({
        title: "Treinamento deletado",
        description: "O treinamento foi deletado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar treinamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
