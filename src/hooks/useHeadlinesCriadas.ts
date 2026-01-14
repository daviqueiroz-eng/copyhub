import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type HeadlineCriada = {
  id: string;
  user_id: string;
  progresso_id: string | null;
  roteiro_id: string | null;
  nicho_id: string | null;
  headline: string;
  estrutura_base: string | null;
  created_at: string;
  // Joined fields
  nicho?: { nome: string } | null;
  roteiro?: { titulo: string } | null;
};

export const useHeadlinesCriadas = () => {
  return useQuery({
    queryKey: ["headlines-criadas"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("headlines_criadas")
        .select(`
          *,
          nicho:nichos(nome),
          roteiro:roteiros(titulo)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HeadlineCriada[];
    },
  });
};

export const useCreateHeadlinesCriadas = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (headlines: {
      user_id: string;
      progresso_id?: string;
      roteiro_id?: string;
      nicho_id?: string | null;
      mentorado_id?: string | null;
      headline: string;
      estrutura_base?: string;
    }[]) => {
      if (headlines.length === 0) return [];

      const { data, error } = await supabase
        .from("headlines_criadas")
        .insert(headlines)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headlines-criadas"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar headlines",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteHeadlineCriada = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("headlines_criadas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headlines-criadas"] });
      toast({
        title: "Headline removida",
        description: "A headline foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover headline",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
