import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type PerfilReferencia = {
  id: string;
  nome: string;
  inscritos: string;
  link: string;
  nicho_id: string | null;
  favorito: boolean;
  user_id: string;
  created_at: string;
  nicho_nome?: string;
};

export const usePerfisReferencia = () => {
  return useQuery({
    queryKey: ["perfis_referencia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis_referencia")
        .select("*, nichos(nome)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]).map((item) => ({
        id: item.id,
        nome: item.nome,
        inscritos: item.inscritos || "",
        link: item.link,
        nicho_id: item.nicho_id,
        favorito: item.favorito,
        user_id: item.user_id,
        created_at: item.created_at,
        nicho_nome: item.nichos?.nome || "Sem nicho",
      })) as PerfilReferencia[];
    },
  });
};

export const useCreatePerfilReferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; inscritos: string; link: string; nicho_id: string | null; user_id: string }) => {
      const { data: result, error } = await supabase
        .from("perfis_referencia")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfis_referencia"] });
      toast({ title: "Perfil registrado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar perfil", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdatePerfilReferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; favorito?: boolean; nicho_id?: string | null; nome?: string; inscritos?: string; link?: string }) => {
      const { data, error } = await supabase
        .from("perfis_referencia")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfis_referencia"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeletePerfilReferencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("perfis_referencia").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfis_referencia"] });
      toast({ title: "Perfil removido" });
    },
  });
};
