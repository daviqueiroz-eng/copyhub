import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MentoradoRoteiro = {
  id: string;
  mentorado_id: string;
  user_id: string;
  guia_numero: number;
  ordem: number;
  headline: string;
  estrutura: string;
  created_at: string;
  updated_at: string;
};

export const useMentoradosRoteiros = (mentoradoId: string | undefined) => {
  return useQuery({
    queryKey: ["mentorados_roteiros", mentoradoId],
    queryFn: async () => {
      if (!mentoradoId) return [];
      
      const { data, error } = await supabase
        .from("mentorados_roteiros")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .order("guia_numero", { ascending: true })
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as MentoradoRoteiro[];
    },
    enabled: !!mentoradoId,
  });
};

export const useUpsertMentoradoRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      ordem,
      headline,
      estrutura,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      ordem: number;
      headline: string;
      estrutura: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("mentorados_roteiros")
        .upsert(
          {
            mentorado_id: mentoradoId,
            user_id: user.id,
            guia_numero: guiaNumero,
            ordem,
            headline,
            estrutura,
          },
          {
            onConflict: "mentorado_id,guia_numero,ordem",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros", variables.mentoradoId],
      });
    },
  });
};

export const useDeleteMentoradoRoteiro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      ordem,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      ordem: number;
    }) => {
      const { error } = await supabase
        .from("mentorados_roteiros")
        .delete()
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("ordem", ordem);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros", variables.mentoradoId],
      });
    },
  });
};

export const useGetGuiasCount = (mentoradoId: string | undefined) => {
  return useQuery({
    queryKey: ["mentorados_roteiros_guias_count", mentoradoId],
    queryFn: async () => {
      if (!mentoradoId) return 1;
      
      const { data, error } = await supabase
        .from("mentorados_roteiros")
        .select("guia_numero")
        .eq("mentorado_id", mentoradoId)
        .order("guia_numero", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data.length > 0 ? data[0].guia_numero : 1;
    },
    enabled: !!mentoradoId,
  });
};
