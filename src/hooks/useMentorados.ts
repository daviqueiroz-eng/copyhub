import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Mentorado = {
  id: string;
  nome: string;
  iniciais: string;
  avatar: string | null;
  dores: string | null;
  desejos: string | null;
  objecoes: string | null;
  crencas: string | null;
  plano: string | null;
  estilo_comum: string | null;
  roteiros: string | null;
  observacoes: string | null;
  links_chats: string | null;
  link_drive: string | null;
  referencias: string | null;
  instagram: string | null;
  user_id: string;
};

export const useMentorados = () => {
  return useQuery({
    queryKey: ["mentorados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Mentorado[];
    },
  });
};

export const useCreateMentorado = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mentorado: Omit<Mentorado, "id">) => {
      const { data, error } = await supabase
        .from("mentorados")
        .insert(mentorado)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mentorados"] });
      toast({
        title: "Mentorado adicionado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar mentorado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMentorado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Mentorado> & { id: string }) => {
      const { data, error } = await supabase
        .from("mentorados")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados"] });
    },
  });
};

export const useDeleteMentorado = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mentorados")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados"] });
      toast({
        title: "Mentorado removido",
        description: "O mentorado foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover mentorado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
