import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TipoChatRevisao {
  id: string;
  nome: string;
  descricao: string | null;
  prompt_sistema: string | null;
  user_id: string;
  created_at: string;
}

export const useTiposChatRevisao = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["tipos-chat-revisao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_chat_revisao")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as TipoChatRevisao[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateTipoChatRevisao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; prompt_sistema?: string }) => {
      const { error } = await supabase
        .from("tipos_chat_revisao")
        .insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-chat-revisao"] });
    },
  });
};

export const useUpdateTipoChatRevisao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      nome?: string;
      descricao?: string | null;
      prompt_sistema?: string | null;
    }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("tipos_chat_revisao")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-chat-revisao"] });
    },
  });
};

export const useDeleteTipoChatRevisao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_chat_revisao")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-chat-revisao"] });
    },
  });
};
