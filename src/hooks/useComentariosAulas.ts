import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ComentarioAula = {
  id: string;
  aula_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome: string;
    avatar?: string;
  };
};

export const useComentariosAulas = (aulaId: string) => {
  return useQuery({
    queryKey: ["comentarios_aulas", aulaId],
    queryFn: async () => {
      const { data: comentarios, error } = await supabase
        .from("comentarios_aulas")
        .select("*")
        .eq("aula_id", aulaId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar perfis dos usuários
      const userIds = [...new Set(comentarios?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, avatar")
        .in("user_id", userIds);

      // Juntar comentários com perfis
      const comentariosComPerfis = comentarios?.map(comentario => ({
        ...comentario,
        profiles: profiles?.find(p => p.user_id === comentario.user_id),
      })) || [];

      return comentariosComPerfis as ComentarioAula[];
    },
    enabled: !!aulaId,
  });
};

export const useCreateComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comentario: { aula_id: string; user_id: string; comentario: string }) => {
      const { data, error } = await supabase
        .from("comentarios_aulas")
        .insert(comentario)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comentarios_aulas", variables.aula_id] });
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, aulaId }: { id: string; aulaId: string }) => {
      const { error } = await supabase
        .from("comentarios_aulas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return aulaId;
    },
    onSuccess: (aulaId) => {
      queryClient.invalidateQueries({ queryKey: ["comentarios_aulas", aulaId] });
      toast({
        title: "Comentário deletado",
        description: "O comentário foi deletado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
