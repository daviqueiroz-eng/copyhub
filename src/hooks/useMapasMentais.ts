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

const sortMapasMentais = (items: MapaMental[]) =>
  [...items].sort((a, b) => {
    const ordemDiff = (a.ordem ?? 0) - (b.ordem ?? 0);
    if (ordemDiff !== 0) return ordemDiff;
    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
  });

export const useMapasMentais = (mentoradoId: string | undefined) => {
  return useQuery({
    queryKey: ["mapas-mentais", mentoradoId],
    enabled: !!mentoradoId,
    queryFn: async () => {
      if (!mentoradoId) return [];
      const { data, error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .select("*")
        .eq("mentorado_id", mentoradoId)
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
    mutationFn: async ({
      mentorado_id,
      nome,
      ordem,
    }: {
      mentorado_id: string;
      nome: string;
      ordem?: number;
    }) => {
      const { data, error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .insert({ mentorado_id, nome, ordem: ordem ?? 0, snapshot: null, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MapaMental;
    },
    onSuccess: (novo, vars) => {
      qc.setQueryData<MapaMental[]>(["mapas-mentais", vars.mentorado_id], (old = []) =>
        sortMapasMentais([...old.filter((m) => m.id !== novo.id), novo])
      );
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
      silent: _silent,
    }: {
      id: string;
      mentorado_id: string;
      patch: Partial<Pick<MapaMental, "nome" | "snapshot" | "ordem">>;
      silent?: boolean;
    }) => {
      const { error } = await supabase
        .from("mentorado_mapas_mentais" as any)
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      // Keep the local snapshot current without refetching, so switching maps
      // never reloads an old cached version over the user's latest edits.
      qc.setQueryData<MapaMental[]>(["mapas-mentais", vars.mentorado_id], (old = []) =>
        sortMapasMentais(old.map((mapa) => (mapa.id === vars.id ? { ...mapa, ...vars.patch } : mapa)))
      );
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
      qc.setQueryData<MapaMental[]>(["mapas-mentais", vars.mentorado_id], (old = []) =>
        old.filter((mapa) => mapa.id !== vars.id)
      );
    },
  });
};