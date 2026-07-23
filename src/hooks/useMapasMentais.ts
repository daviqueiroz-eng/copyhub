import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MapaMental = {
  id: string;
  mentorado_id: string;
  nome: string;
  ordem: number;
  snapshot: any | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const useMapasMentais = (mentoradoId: string | undefined) => {
  return useQuery({
    queryKey: ["mapas-mentais", mentoradoId],
    enabled: !!mentoradoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .select("*")
        .eq("mentorado_id", mentoradoId!)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MapaMental[];
    },
  });
};

export const useCreateMapaMental = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ mentorado_id, nome }: { mentorado_id: string; nome: string }) => {
      const { data, error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .insert({ mentorado_id, nome, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MapaMental;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mapas-mentais", vars.mentorado_id] });
    },
  });
};

export const useUpdateMapaMental = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      mentorado_id,
      patch,
    }: {
      id: string;
      mentorado_id: string;
      patch: Partial<Pick<MapaMental, "nome" | "snapshot" | "ordem">>;
    }) => {
      const { error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mapas-mentais", vars.mentorado_id] });
    },
  });
};

export const useDeleteMapaMental = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mentorado_id }: { id: string; mentorado_id: string }) => {
      const { error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["mapas-mentais", vars.mentorado_id] });
    },
  });
};