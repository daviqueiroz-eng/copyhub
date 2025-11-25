import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProgressoAtividade {
  atividade_id: string;
  titulo: string;
  tipo: string;
  prioridade: string;
  data_limite: string | null;
  created_at: string;
  total_usuarios: number;
  usuarios_concluidos: number;
  usuarios_pendentes: number;
  percentual_conclusao: number;
}

export interface DetalheUsuarioAtividade {
  id: string;
  status: string;
  updated_at: string;
  user: {
    nome: string;
    avatar: string | null;
  };
}

export const useProgressoAtividadesGerais = () => {
  const { user } = useAuth();

  return useQuery<ProgressoAtividade[]>({
    queryKey: ["progresso-atividades-gerais"],
    queryFn: async (): Promise<ProgressoAtividade[]> => {
      // Query simplificada para evitar inferência profunda de tipos
      const { data: atividades, error: atividadesError } = await supabase
        .from("atividades_gerais")
        .select("id, titulo, tipo, prioridade, data_limite, created_at")
        .order("created_at", { ascending: false });

      if (atividadesError) throw atividadesError;
      if (!atividades) return [];

      const progressos: ProgressoAtividade[] = [];

      for (const atividade of atividades) {
        const { data: tarefas } = await supabase
          .from("flow_tarefas")
          .select("status, user_id")
          .eq("atividade_geral_id", atividade.id);

        const total = tarefas?.length || 0;
        const concluidos = tarefas?.filter((t: any) => t.status === "done").length || 0;

        progressos.push({
          atividade_id: atividade.id,
          titulo: atividade.titulo,
          tipo: atividade.tipo,
          prioridade: atividade.prioridade,
          data_limite: atividade.data_limite,
          created_at: atividade.created_at,
          total_usuarios: total,
          usuarios_concluidos: concluidos,
          usuarios_pendentes: total - concluidos,
          percentual_conclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0,
        });
      }

      return progressos;
    },
    enabled: !!user,
  });
};

export const useDetalhesAtividadeGeral = (atividadeId: string) => {
  return useQuery({
    queryKey: ["detalhes-atividade-geral", atividadeId],
    queryFn: async (): Promise<DetalheUsuarioAtividade[]> => {
      const { data, error } = await supabase
        .from("flow_tarefas")
        .select("id, status, updated_at, profiles:user_id(nome, avatar)")
        .eq("atividade_geral_id", atividadeId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const result: DetalheUsuarioAtividade[] = data.map((item: any) => ({
        id: item.id,
        status: item.status,
        updated_at: item.updated_at,
        user: {
          nome: item.profiles?.nome || "Usuário",
          avatar: item.profiles?.avatar || null,
        },
      }));

      return result;
    },
    enabled: !!atividadeId,
  });
};
