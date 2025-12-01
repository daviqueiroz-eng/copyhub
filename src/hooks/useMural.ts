import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Comunicado {
  id: string;
  created_by: string | null;
  titulo: string;
  conteudo: string;
  tipo: 'importante' | 'atualização' | 'geral';
  created_at: string;
  updated_at: string;
  profiles?: {
    nome: string;
    avatar: string | null;
  };
  _count?: {
    reacoes: number;
    comentarios: number;
  };
}

export interface Reacao {
  id: string;
  comunicado_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Comentario {
  id: string;
  comunicado_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome: string;
    avatar: string | null;
  };
}

// Hook para listar comunicados
export const useComunicados = () => {
  return useQuery({
    queryKey: ["comunicados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comunicados")
        .select(`
          *,
          profiles:created_by (nome, avatar)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Comunicado[];
    },
  });
};

// Hook para criar comunicado (admin only)
export const useCreateComunicado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      conteudo: string;
      tipo: 'importante' | 'atualização' | 'geral';
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("comunicados").insert({
        ...data,
        created_by: user.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      toast.success("Comunicado criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar comunicado:", error);
      toast.error("Erro ao criar comunicado");
    },
  });
};

// Hook para deletar comunicado (admin only)
export const useDeleteComunicado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("comunicados")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      toast.success("Comunicado deletado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar comunicado:", error);
      toast.error("Erro ao deletar comunicado");
    },
  });
};

// Hook para listar reações de um comunicado
export const useReacoes = (comunicadoId: string) => {
  return useQuery({
    queryKey: ["reacoes", comunicadoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comunicados_reacoes")
        .select("*")
        .eq("comunicado_id", comunicadoId);

      if (error) throw error;
      return data as Reacao[];
    },
    enabled: !!comunicadoId,
  });
};

// Hook para adicionar/remover reação (toggle)
export const useToggleReacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      comunicadoId: string;
      emoji: string;
      userId: string;
    }) => {
      // Verificar se já existe reação
      const { data: existing } = await supabase
        .from("comunicados_reacoes")
        .select("id")
        .eq("comunicado_id", data.comunicadoId)
        .eq("user_id", data.userId)
        .eq("emoji", data.emoji)
        .maybeSingle();

      if (existing) {
        // Remover reação existente
        const { error } = await supabase
          .from("comunicados_reacoes")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Adicionar nova reação
        const { error } = await supabase
          .from("comunicados_reacoes")
          .insert({
            comunicado_id: data.comunicadoId,
            user_id: data.userId,
            emoji: data.emoji,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reacoes", variables.comunicadoId] });
    },
    onError: (error) => {
      console.error("Erro ao reagir:", error);
      toast.error("Erro ao reagir ao comunicado");
    },
  });
};

// Hook para listar comentários de um comunicado
export const useComentariosMural = (comunicadoId: string) => {
  return useQuery({
    queryKey: ["comentarios-mural", comunicadoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comunicados_comentarios")
        .select(`
          *,
          profiles:user_id (nome, avatar)
        `)
        .eq("comunicado_id", comunicadoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comentario[];
    },
    enabled: !!comunicadoId,
  });
};

// Hook para criar comentário
export const useCreateComentarioMural = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      comunicadoId: string;
      comentario: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("comunicados_comentarios")
        .insert({
          comunicado_id: data.comunicadoId,
          user_id: data.userId,
          comentario: data.comentario,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comentarios-mural", variables.comunicadoId] });
      toast.success("Comentário adicionado!");
    },
    onError: (error) => {
      console.error("Erro ao comentar:", error);
      toast.error("Erro ao adicionar comentário");
    },
  });
};

// Hook para deletar comentário
export const useDeleteComentarioMural = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; comunicadoId: string }) => {
      const { error } = await supabase
        .from("comunicados_comentarios")
        .delete()
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comentarios-mural", variables.comunicadoId] });
      toast.success("Comentário deletado!");
    },
    onError: (error) => {
      console.error("Erro ao deletar comentário:", error);
      toast.error("Erro ao deletar comentário");
    },
  });
};