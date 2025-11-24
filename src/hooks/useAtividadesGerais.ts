import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AtividadeGeral {
  id: string;
  created_by: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  prioridade: string;
  data_limite: string | null;
  anexos: any;
  created_at: string;
  updated_at: string;
}

export const useAtividadesGerais = () => {
  return useQuery({
    queryKey: ["atividades-gerais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_gerais")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AtividadeGeral[];
    },
  });
};

export const useCreateAtividadeGeral = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (atividade: Omit<AtividadeGeral, "id" | "created_by" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Criar atividade geral
      const { data: atividadeData, error: atividadeError } = await supabase
        .from("atividades_gerais")
        .insert({
          ...atividade,
          created_by: user.id,
        })
        .select()
        .single();

      if (atividadeError) throw atividadeError;

      // Buscar todos os usuários ativos
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("ativo", true);

      if (profilesError) throw profilesError;

      // Criar uma tarefa para cada usuário
      if (profiles && profiles.length > 0) {
        const tarefas = profiles.map(profile => ({
          user_id: profile.user_id,
          titulo: atividade.titulo,
          descricao: atividade.descricao,
          prioridade: atividade.prioridade,
          data_limite: atividade.data_limite,
          atividade_geral_id: atividadeData.id,
          status: 'todo' as const,
        }));

        const { error: tarefasError } = await supabase
          .from("flow_tarefas")
          .insert(tarefas);

        if (tarefasError) throw tarefasError;
      }

      return atividadeData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-gerais"] });
      queryClient.invalidateQueries({ queryKey: ["flow-tarefas"] });
      toast.success("Atividade criada e distribuída para todos os usuários!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar atividade: ${error.message}`);
    },
  });
};

export const useUpdateAtividadeGeral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...atividade }: Partial<AtividadeGeral> & { id: string }) => {
      const { data, error } = await supabase
        .from("atividades_gerais")
        .update(atividade)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-gerais"] });
      toast.success("Atividade atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar atividade: ${error.message}`);
    },
  });
};

export const useDeleteAtividadeGeral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atividades_gerais")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-gerais"] });
      toast.success("Atividade deletada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar atividade: ${error.message}`);
    },
  });
};

export const useAtividadesNaoVisualizadas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["atividades-nao-visualizadas", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Buscar todas as atividades
      const { data: atividades, error: atividadesError } = await supabase
        .from("atividades_gerais")
        .select("id");

      if (atividadesError) throw atividadesError;

      // Buscar atividades visualizadas pelo usuário
      const { data: visualizadas, error: visualizadasError } = await supabase
        .from("atividades_visualizadas")
        .select("atividade_id")
        .eq("user_id", user.id);

      if (visualizadasError) throw visualizadasError;

      const idsVisualizadas = new Set(visualizadas?.map((v) => v.atividade_id) || []);
      const naoVisualizadas = atividades?.filter((a) => !idsVisualizadas.has(a.id)) || [];

      return naoVisualizadas.length;
    },
    enabled: !!user,
  });
};

export const useMarcarAtividadeComoVista = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (atividadeId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("atividades_visualizadas")
        .upsert({
          user_id: user.id,
          atividade_id: atividadeId,
        }, {
          onConflict: "user_id,atividade_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-nao-visualizadas"] });
    },
  });
};

export const useMarcarTodasComoVistas = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (atividadesIds: string[]) => {
      if (!user) throw new Error("Usuário não autenticado");

      const inserts = atividadesIds.map((atividadeId) => ({
        user_id: user.id,
        atividade_id: atividadeId,
      }));

      const { error } = await supabase
        .from("atividades_visualizadas")
        .upsert(inserts, {
          onConflict: "user_id,atividade_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades-nao-visualizadas"] });
    },
  });
};
