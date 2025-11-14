import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FlowBibliotecaMusica {
  id: string;
  titulo: string;
  youtube_url: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export const useFlowBiblioteca = () => {
  const queryClient = useQueryClient();

  const { data: musicas = [], isLoading } = useQuery({
    queryKey: ["flow-biblioteca-musicas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flow_biblioteca_musicas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FlowBibliotecaMusica[];
    },
  });

  const createMusica = useMutation({
    mutationFn: async (musica: { titulo: string; youtube_url: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("flow_biblioteca_musicas")
        .insert({
          titulo: musica.titulo,
          youtube_url: musica.youtube_url,
          created_by: userData?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-biblioteca-musicas"] });
      toast.success("Música adicionada à biblioteca!");
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar música: " + error.message);
    },
  });

  const deleteMusica = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flow_biblioteca_musicas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-biblioteca-musicas"] });
      toast.success("Música removida da biblioteca!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover música: " + error.message);
    },
  });

  return {
    musicas,
    isLoading,
    createMusica,
    deleteMusica,
  };
};
