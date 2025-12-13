import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrupoMembroViral {
  id: string;
  membro_id: string;
  tipo: "primeira_viral" | "viral_constante";
  quantidade: number;
  data_registro: string;
  created_at: string;
}

export const useGrupoMembrosVirais = (grupoId: string | null) => {
  return useQuery({
    queryKey: ["grupo-membros-virais", grupoId],
    queryFn: async () => {
      if (!grupoId) return [];
      
      // First get all member IDs for this group
      const { data: membros, error: membrosError } = await supabase
        .from("grupos_membros")
        .select("id")
        .eq("grupo_id", grupoId);
      
      if (membrosError) throw membrosError;
      if (!membros.length) return [];
      
      const membroIds = membros.map(m => m.id);
      
      const { data: virais, error } = await supabase
        .from("grupos_membros_virais")
        .select("*")
        .in("membro_id", membroIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return virais as GrupoMembroViral[];
    },
    enabled: !!grupoId,
  });
};

export const useAddViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { membro_id: string; tipo: "primeira_viral" | "viral_constante"; grupo_id: string }) => {
      const { data: viral, error } = await supabase
        .from("grupos_membros_virais")
        .insert({
          membro_id: data.membro_id,
          tipo: data.tipo,
          quantidade: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return viral as GrupoMembroViral;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-membros-virais", variables.grupo_id] });
    },
  });
};

export const useRemoveViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, grupo_id }: { id: string; grupo_id: string }) => {
      const { error } = await supabase
        .from("grupos_membros_virais")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grupo-membros-virais", variables.grupo_id] });
    },
  });
};

// Helper to count virals by member and type
export const countViralsByMembro = (
  virais: GrupoMembroViral[],
  membroId: string,
  tipo: "primeira_viral" | "viral_constante"
): number => {
  return virais
    .filter(v => v.membro_id === membroId && v.tipo === tipo)
    .reduce((sum, v) => sum + v.quantidade, 0);
};

// Helper to count total virals by type across all members
export const countTotalVirais = (
  virais: GrupoMembroViral[],
  tipo: "primeira_viral" | "viral_constante"
): number => {
  return virais
    .filter(v => v.tipo === tipo)
    .reduce((sum, v) => sum + v.quantidade, 0);
};
