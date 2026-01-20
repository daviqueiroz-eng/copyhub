import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserHeadlineExcel {
  id: string;
  user_id: string;
  headline: string;
  estrutura: string | null;
  arquivo_origem: string | null;
  created_at: string;
  is_global: boolean;
}

export const useUserHeadlinesExcel = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-headlines-excel", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Buscar headlines próprias OU globais
      const { data, error } = await supabase
        .from("user_headlines_excel")
        .select("*")
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserHeadlineExcel[];
    },
    enabled: !!user?.id,
  });
};

export const useImportExcelHeadlines = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (headlines: { headline: string; estrutura?: string; arquivo_origem: string; is_global?: boolean }[]) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const toInsert = headlines.map((h) => ({
        user_id: user.id,
        headline: h.headline,
        estrutura: h.estrutura || null,
        arquivo_origem: h.arquivo_origem,
        is_global: h.is_global || false,
      }));

      const { error } = await supabase
        .from("user_headlines_excel")
        .insert(toInsert);

      if (error) throw error;
      return { count: toInsert.length, isGlobal: toInsert[0]?.is_global || false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-headlines-excel"] });
      const msg = result.isGlobal 
        ? `${result.count} headlines compartilhadas com a equipe!`
        : `${result.count} headlines importadas com sucesso!`;
      toast.success(msg);
    },
    onError: (error) => {
      toast.error("Erro ao importar headlines: " + error.message);
    },
  });
};

export const useDeleteAllUserHeadlines = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_headlines_excel")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-headlines-excel"] });
      toast.success("Todas as headlines foram removidas");
    },
    onError: (error) => {
      toast.error("Erro ao remover headlines: " + error.message);
    },
  });
};

export const useDeleteHeadlinesByFile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (arquivo_origem: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_headlines_excel")
        .delete()
        .eq("user_id", user.id)
        .eq("arquivo_origem", arquivo_origem);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-headlines-excel"] });
      toast.success("Headlines do arquivo removidas");
    },
    onError: (error) => {
      toast.error("Erro ao remover headlines: " + error.message);
    },
  });
};
