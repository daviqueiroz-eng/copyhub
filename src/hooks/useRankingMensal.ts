import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export type RankingUsuario = {
  user_id: string;
  nome: string;
  avatar: string | null;
  total_analises: number;
  posicao: number;
};

export const useRankingMensal = () => {
  return useQuery({
    queryKey: ["ranking-mensal", new Date().getMonth(), new Date().getFullYear()],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Buscar todas as análises completadas no mês atual
      const { data: progressos, error: progressoError } = await supabase
        .from("progresso_roteiros")
        .select("user_id, created_at")
        .eq("completado", true)
        .gte("data_completado", inicioMes)
        .lte("data_completado", fimMes);

      if (progressoError) throw progressoError;
      if (!progressos || progressos.length === 0) return [];

      // Agrupar por user_id e contar
      const contagemPorUsuario = progressos.reduce((acc, progresso) => {
        acc[progresso.user_id] = (acc[progresso.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Buscar dados dos usuários
      const userIds = Object.keys(contagemPorUsuario);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, avatar")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;
      if (!profiles) return [];

      // Combinar dados e ordenar
      const ranking: RankingUsuario[] = profiles
        .map((profile) => ({
          user_id: profile.user_id,
          nome: profile.nome,
          avatar: profile.avatar,
          total_analises: contagemPorUsuario[profile.user_id] || 0,
          posicao: 0, // Será calculado depois
        }))
        .sort((a, b) => b.total_analises - a.total_analises)
        .map((usuario, index) => ({
          ...usuario,
          posicao: index + 1,
        }));

      return ranking;
    },
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Atualizar a cada minuto
  });
};
