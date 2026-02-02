import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SprintIniciativa {
  id: string;
  titulo: string;
  descricao: string | null;
  criterio_conclusao: string | null;
  dono_id: string | null;
  prazo_entrega: string | null;
  impacto: "baixo" | "medio" | "alto";
  status: "backlog" | "sprint" | "finalizado";
  arquivada: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  dono?: {
    nome: string;
    avatar: string | null;
  } | null;
}

export interface SprintTarefa {
  id: string;
  iniciativa_id: string;
  texto: string;
  concluida: boolean;
  created_at: string;
}

export const useSprintsIniciativas = (arquivadas: boolean = false) => {
  return useQuery({
    queryKey: ["sprints-iniciativas", arquivadas],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprints_iniciativas")
        .select(`
          *,
          dono:profiles!sprints_iniciativas_dono_id_fkey(nome, avatar)
        `)
        .eq("arquivada", arquivadas)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SprintIniciativa[];
    },
  });
};

export const useSprintsTarefas = (iniciativaId: string) => {
  return useQuery({
    queryKey: ["sprints-tarefas", iniciativaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprints_tarefas")
        .select("*")
        .eq("iniciativa_id", iniciativaId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as SprintTarefa[];
    },
    enabled: !!iniciativaId,
  });
};

export const useCreateIniciativa = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao?: string;
      criterio_conclusao?: string;
      dono_id?: string;
      prazo_entrega?: string;
      impacto?: "baixo" | "medio" | "alto";
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("sprints_iniciativas").insert({
        ...data,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints-iniciativas"] });
    },
  });
};

export const useUpdateIniciativa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<SprintIniciativa> & { id: string }) => {
      const { error } = await supabase
        .from("sprints_iniciativas")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints-iniciativas"] });
    },
  });
};

export const useDeleteIniciativa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sprints_iniciativas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints-iniciativas"] });
    },
  });
};

export const useCreateTarefa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { iniciativa_id: string; texto: string }) => {
      const { error } = await supabase.from("sprints_tarefas").insert(data);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sprints-tarefas", variables.iniciativa_id],
      });
    },
  });
};

export const useUpdateTarefa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      iniciativa_id,
      ...data
    }: Partial<SprintTarefa> & { id: string; iniciativa_id: string }) => {
      const { error } = await supabase
        .from("sprints_tarefas")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      return { iniciativa_id };
    },
    onSuccess: (result) => {
      if (result?.iniciativa_id) {
        queryClient.invalidateQueries({
          queryKey: ["sprints-tarefas", result.iniciativa_id],
        });
      }
    },
  });
};

export const useDeleteTarefa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      iniciativa_id,
    }: {
      id: string;
      iniciativa_id: string;
    }) => {
      const { error } = await supabase
        .from("sprints_tarefas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { iniciativa_id };
    },
    onSuccess: (result) => {
      if (result?.iniciativa_id) {
        queryClient.invalidateQueries({
          queryKey: ["sprints-tarefas", result.iniciativa_id],
        });
      }
    },
  });
};

export const useProfiles = () => {
  return useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, avatar")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });
};
