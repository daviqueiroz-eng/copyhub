import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type GestaoEntregaConfig = {
  id: string;
  user_id: string;
  mentorado_id: string;
  mentor: string | null;
  dias_uteis: number;
  roteiros_por_leva: number | null;
  levas_totais: number | null;
  status: string;
  leva_atual: number;
};

export const useGestaoEntregasConfig = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gestao-entregas-config", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestao_entregas_config")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as GestaoEntregaConfig[];
    },
  });
};

export const useUpsertGestaoEntregaConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Omit<GestaoEntregaConfig, "id">) => {
      const { data, error } = await supabase
        .from("gestao_entregas_config")
        .upsert(config as any, { onConflict: "user_id,mentorado_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestao-entregas-config"] });
    },
  });
};
