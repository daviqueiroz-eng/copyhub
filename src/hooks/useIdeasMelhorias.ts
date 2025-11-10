import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IdeaMelhoria {
  id: string;
  user_id: string | null;
  nome: string;
  feedback: string;
  imagens: string[];
  concluida: boolean;
  data_conclusao: string | null;
  created_at: string;
  updated_at: string;
}

export const useIdeasMelhorias = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ideias, isLoading } = useQuery({
    queryKey: ["ideias-melhorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias_melhorias")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IdeaMelhoria[];
    },
  });

  const createIdeia = useMutation({
    mutationFn: async (newIdeia: { nome: string; feedback: string; imagens: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("ideias_melhorias")
        .insert([
          {
            user_id: user?.id || null,
            nome: newIdeia.nome,
            feedback: newIdeia.feedback,
            imagens: newIdeia.imagens,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideias-melhorias"] });
      toast({
        title: "Ideia enviada!",
        description: "Obrigado pelo seu feedback. Nossa equipe irá analisá-lo em breve.",
      });
    },
    onError: (error) => {
      console.error("Erro ao enviar ideia:", error);
      
      let errorMessage = "Não foi possível enviar sua ideia.";
      
      if (error.message.includes("row-level security") || error.message.includes("policy")) {
        errorMessage = "Você precisa estar autenticado para enviar uma ideia. Por favor, faça login e tente novamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao enviar ideia",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteIdeia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ideias_melhorias")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideias-melhorias"] });
      toast({
        title: "Ideia deletada",
        description: "A ideia foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar ideia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateIdeia = useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const updates: any = { concluida };
      
      if (concluida) {
        updates.data_conclusao = new Date().toISOString();
      } else {
        updates.data_conclusao = null;
      }
      
      const { error } = await supabase
        .from("ideias_melhorias")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ideias-melhorias"] });
      toast({
        title: variables.concluida ? "Ideia marcada como concluída!" : "Ideia reaberta",
        description: variables.concluida 
          ? "A ideia foi marcada como implementada." 
          : "A ideia foi reaberta para análise.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar ideia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadImagem = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('feedback-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('feedback-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    ideias,
    isLoading,
    createIdeia,
    deleteIdeia,
    updateIdeia,
    uploadImagem,
  };
};
