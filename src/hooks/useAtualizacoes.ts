import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Atualizacao {
  id: string;
  titulo: string;
  conteudo: string;
  versao: string | null;
  tipo: string;
  created_by: string | null;
  created_at: string;
  ativo: boolean;
}

interface AtualizacaoLida {
  id: string;
  atualizacao_id: string;
  user_id: string;
  lida_em: string;
}

export const useAtualizacoes = () => {
  return useQuery({
    queryKey: ["atualizacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atualizacoes_sistema")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Atualizacao[];
    },
  });
};

export const useAtualizacoesNaoLidas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["atualizacoes-nao-lidas", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all active updates
      const { data: atualizacoes, error: atualError } = await supabase
        .from("atualizacoes_sistema")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (atualError) throw atualError;

      // Get user's read updates
      const { data: lidas, error: lidasError } = await supabase
        .from("atualizacoes_lidas")
        .select("atualizacao_id")
        .eq("user_id", user.id);

      if (lidasError) throw lidasError;

      const lidasIds = new Set((lidas as AtualizacaoLida[]).map((l) => l.atualizacao_id));
      
      // Filter unread updates
      return (atualizacoes as Atualizacao[]).filter((a) => !lidasIds.has(a.id));
    },
    enabled: !!user,
  });
};

export const useCreateAtualizacao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { titulo: string; conteudo: string; versao?: string; tipo: string }) => {
      const { error } = await supabase.from("atualizacoes_sistema").insert({
        ...data,
        created_by: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes"] });
    },
  });
};

export const useDeleteAtualizacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atualizacoes_sistema").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes"] });
    },
  });
};

export const useToggleAtualizacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("atualizacoes_sistema")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes"] });
    },
  });
};

export const useMarcarComoLida = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (atualizacaoIds: string[]) => {
      if (!user) throw new Error("User not authenticated");

      const inserts = atualizacaoIds.map((atualizacao_id) => ({
        atualizacao_id,
        user_id: user.id,
      }));

      const { error } = await supabase.from("atualizacoes_lidas").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atualizacoes-nao-lidas"] });
    },
  });
};
