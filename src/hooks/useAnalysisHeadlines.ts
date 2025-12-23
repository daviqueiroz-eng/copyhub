import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnalysisHeadline {
  id: string;
  headline: string;
  estrutura: string | null;
}

export const useAnalysisHeadlines = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analysis-headlines", user?.id],
    queryFn: async (): Promise<AnalysisHeadline[]> => {
      if (!user?.id) return [];

      // Buscar progresso_roteiros com JOIN em roteiros
      const { data, error } = await supabase
        .from("progresso_roteiros")
        .select(`
          id,
          estrutura_invisivel,
          roteiros (
            id,
            titulo
          )
        `)
        .eq("user_id", user.id)
        .eq("completado", true);

      if (error) {
        console.error("Erro ao buscar headlines:", error);
        return [];
      }

      // Mapear para o formato esperado
      return (data || [])
        .filter((item) => item.roteiros)
        .map((item) => ({
          id: item.id,
          headline: (item.roteiros as any).titulo || "",
          estrutura: item.estrutura_invisivel || null,
        }));
    },
    enabled: !!user?.id,
  });
};
