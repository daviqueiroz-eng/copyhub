import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Nicho = {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
};

export const useNichos = () => {
  return useQuery({
    queryKey: ["nichos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nichos")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Nicho[];
    },
  });
};

export const useCreateNicho = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("nichos")
        .insert({ nome })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nichos"] });
      toast({
        title: "Nicho criado",
        description: "O nicho foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar nicho",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteNicho = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nichos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nichos"] });
      toast({
        title: "Nicho deletado",
        description: "O nicho foi removido com sucesso.",
      });
    },
  });
};
