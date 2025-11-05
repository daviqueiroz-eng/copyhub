import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Roteiro = {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
  nicho_id?: string;
  link_video?: string;
  user_id?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export const useRoteiros = () => {
  return useQuery({
    queryKey: ["roteiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roteiros")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as Roteiro[];
    },
  });
};

export const useCreateRoteiro = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roteiro: { titulo: string; conteudo: string; ordem: number; nicho_id?: string; link_video?: string; is_private?: boolean; user_id?: string }) => {
      const { data, error } = await supabase
        .from("roteiros")
        .insert(roteiro)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      toast({
        title: "Roteiro criado",
        description: "O roteiro foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar roteiro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRoteiro = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Roteiro> & { id: string }) => {
      const { data, error } = await supabase
        .from("roteiros")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      toast({
        title: "Roteiro atualizado",
        description: "O roteiro foi atualizado com sucesso.",
      });
    },
  });
};

export const useDeleteRoteiro = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roteiros")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      toast({
        title: "Roteiro deletado",
        description: "O roteiro foi removido com sucesso.",
      });
    },
  });
};
