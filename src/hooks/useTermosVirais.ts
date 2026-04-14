import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type TermoViral = {
  id: string;
  termo: string;
  nicho_id: string | null;
  views: string;
  user_id: string;
  created_at: string;
  nicho_nome?: string;
};

export const useTermosVirais = () => {
  return useQuery({
    queryKey: ["termos_virais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("termos_virais")
        .select("*, nichos(nome)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]).map((item) => ({
        id: item.id,
        termo: item.termo,
        nicho_id: item.nicho_id,
        views: item.views || "",
        user_id: item.user_id,
        created_at: item.created_at,
        nicho_nome: item.nichos?.nome || "Sem nicho",
      })) as TermoViral[];
    },
  });
};

export const useCreateTermoViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { termo: string; nicho_id: string | null; views: string; user_id: string }) => {
      const { data: result, error } = await supabase
        .from("termos_virais")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termos_virais"] });
      toast({ title: "Termo viral registrado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar termo", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateTermoViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nicho_id }: { id: string; nicho_id: string | null }) => {
      const { data, error } = await supabase
        .from("termos_virais")
        .update({ nicho_id })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termos_virais"] });
      toast({ title: "Termo movido para outro nicho!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao mover termo", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteTermoViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("termos_virais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termos_virais"] });
      toast({ title: "Termo removido" });
    },
  });
};
