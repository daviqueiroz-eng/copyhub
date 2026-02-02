import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GuiaConfig {
  id: string;
  user_id: string;
  mentorado_id: string;
  numero: number;
  quantidade: number;
  is_overdelivery: boolean;
  nome_customizado?: string | null;
  ordem_personalizada?: number | null;
  created_at: string;
  updated_at: string;
}

export const useGuiasConfig = (mentoradoId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["guias-config", mentoradoId],
    queryFn: async () => {
      if (!mentoradoId || !user) return [];

      const { data, error } = await supabase
        .from("mentorados_guias_config")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .eq("user_id", user.id)
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as GuiaConfig[];
    },
    enabled: !!mentoradoId && !!user,
  });
};

export const useUpsertGuiaConfig = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      mentorado_id: string;
      numero: number;
      quantidade: number;
      is_overdelivery: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_guias_config")
        .upsert(
          {
            user_id: user.id,
            mentorado_id: data.mentorado_id,
            numero: data.numero,
            quantidade: data.quantidade,
            is_overdelivery: data.is_overdelivery,
          },
          {
            onConflict: "user_id,mentorado_id,numero",
          }
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guias-config", variables.mentorado_id],
      });
    },
  });
};

export const useDeleteGuiaConfig = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { mentorado_id: string; numero: number }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_guias_config")
        .delete()
        .eq("user_id", user.id)
        .eq("mentorado_id", data.mentorado_id)
        .eq("numero", data.numero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guias-config", variables.mentorado_id],
      });
    },
  });
};

export const useUpdateGuiaQuantidade = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      mentorado_id: string;
      numero: number;
      quantidade: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_guias_config")
        .update({ quantidade: data.quantidade })
        .eq("user_id", user.id)
        .eq("mentorado_id", data.mentorado_id)
        .eq("numero", data.numero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guias-config", variables.mentorado_id],
      });
    },
  });
};

export const useUpdateGuiaNome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      mentorado_id: string;
      numero: number;
      nome_customizado: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_guias_config")
        .update({ nome_customizado: data.nome_customizado })
        .eq("user_id", user.id)
        .eq("mentorado_id", data.mentorado_id)
        .eq("numero", data.numero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guias-config", variables.mentorado_id],
      });
    },
  });
};

export const useUpdateGuiaOrdem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      mentorado_id: string;
      numero: number;
      ordem_personalizada: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_guias_config")
        .update({ ordem_personalizada: data.ordem_personalizada })
        .eq("user_id", user.id)
        .eq("mentorado_id", data.mentorado_id)
        .eq("numero", data.numero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guias-config", variables.mentorado_id],
      });
    },
  });
};
