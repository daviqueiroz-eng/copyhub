import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Prompt = {
  id: string;
  titulo: string;
  descricao: string;
  nicho: string;
  youtube_url: string;
  comentarios?: string | null;
  conteudo: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

export const usePrompts = () => {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Prompt[];
    },
  });
};

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("prompts")
        .insert({
          ...prompt,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast({
        title: "Prompt criado",
        description: "O novo prompt foi adicionado ao banco.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...prompt }: Partial<Prompt> & { id: string }) => {
      const { data, error } = await supabase
        .from("prompts")
        .update(prompt)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast({
        title: "Prompt atualizado",
        description: "O prompt foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast({
        title: "Prompt excluído",
        description: "O prompt foi removido do banco.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir prompt",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
