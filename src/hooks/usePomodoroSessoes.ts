import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PomodoroSessao = {
  id: string;
  user_id: string;
  tipo: string;
  duracao_minutos: number;
  completada: boolean;
  created_at: string;
};

export const usePomodoroSessoes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pomodoro-sessoes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flow_pomodoro_sessoes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completada", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PomodoroSessao[];
    },
    enabled: !!user,
  });
};

export const usePomodoroEstatisticas = () => {
  const { data: sessoes } = usePomodoroSessoes();

  if (!sessoes) return null;

  const hoje = new Date();
  const inicioHoje = startOfDay(hoje);
  const fimHoje = endOfDay(hoje);

  const sessoesHoje = sessoes.filter(s => {
    const dataSessao = new Date(s.created_at);
    return dataSessao >= inicioHoje && dataSessao <= fimHoje;
  });

  const pomosHoje = sessoesHoje.filter(s => s.tipo === "trabalho").length;
  const focoHoje = sessoesHoje
    .filter(s => s.tipo === "trabalho")
    .reduce((acc, s) => acc + s.duracao_minutos, 0);

  const pomosTotal = sessoes.filter(s => s.tipo === "trabalho").length;
  const duracaoTotal = sessoes
    .filter(s => s.tipo === "trabalho")
    .reduce((acc, s) => acc + s.duracao_minutos, 0);

  return {
    pomosHoje,
    focoHoje,
    pomosTotal,
    duracaoTotal,
    sessoesAgrupadas: agruparPorData(sessoes),
  };
};

function agruparPorData(sessoes: PomodoroSessao[]) {
  const grupos: Record<string, PomodoroSessao[]> = {};
  
  sessoes.forEach(sessao => {
    const data = format(new Date(sessao.created_at), "dd 'de' MMM'.'", { locale: ptBR });
    if (!grupos[data]) grupos[data] = [];
    grupos[data].push(sessao);
  });

  return grupos;
}
