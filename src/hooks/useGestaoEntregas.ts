import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type GestaoEntrega = {
  id: string;
  mentorado_id: string;
  responsavel_id: string | null;
  user_id: string;
  leva: number | null;
  prazo: string;
  data_entrega: string | null;
  dias_uteis: number;
  status: string;
  observacao: string | null;
  created_at: string;
  mentorado?: {
    id: string;
    nome: string;
    iniciais: string;
    mentor: string | null;
    curso: string | null;
    cor: string | null;
    pausado: boolean | null;
  };
  responsavel?: {
    user_id: string;
    nome: string;
  } | null;
};

export const useGestaoEntregas = () => {
  return useQuery({
    queryKey: ["gestao-entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestao_entregas")
        .select(`
          *,
          mentorado:mentorados!gestao_entregas_mentorado_id_fkey(id, nome, iniciais, mentor, curso, cor, pausado),
          responsavel:profiles!gestao_entregas_responsavel_id_fkey(user_id, nome)
        `)
        .order("prazo", { ascending: true });

      if (error) throw error;
      return data as unknown as GestaoEntrega[];
    },
  });
};

export const useCreateGestaoEntrega = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entrega: {
      mentorado_id: string;
      responsavel_id?: string | null;
      user_id: string;
      leva?: number | null;
      prazo: string;
      data_entrega?: string | null;
      dias_uteis?: number;
      status?: string;
      observacao?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("gestao_entregas")
        .insert(entrega)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestao-entregas"] });
      toast({ title: "Entrega criada!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar entrega", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateGestaoEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("gestao_entregas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestao-entregas"] });
    },
  });
};

export const useDeleteGestaoEntrega = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gestao_entregas")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestao-entregas"] });
      toast({ title: "Entrega removida" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });
};
