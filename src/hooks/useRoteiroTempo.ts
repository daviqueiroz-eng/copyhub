import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RoteiroTempo {
  id: string;
  roteiro_id: string;
  tempo_segundos: number;
  finalizado: boolean;
  created_at: string;
  updated_at: string;
}

export const useRoteiroTempo = (roteiroId: string | null) => {
  return useQuery({
    queryKey: ["roteiro_tempo", roteiroId],
    queryFn: async () => {
      if (!roteiroId) return null;
      
      const { data, error } = await supabase
        .from("mentorados_roteiros_tempos")
        .select("*")
        .eq("roteiro_id", roteiroId)
        .maybeSingle();
      
      if (error) throw error;
      return data as RoteiroTempo | null;
    },
    enabled: !!roteiroId,
  });
};

export const useUpsertRoteiroTempo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roteiroId,
      tempoSegundos,
      finalizado = false,
    }: {
      roteiroId: string;
      tempoSegundos: number;
      finalizado?: boolean;
    }) => {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from("mentorados_roteiros_tempos")
        .select("id")
        .eq("roteiro_id", roteiroId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("mentorados_roteiros_tempos")
          .update({
            tempo_segundos: tempoSegundos,
            finalizado,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("mentorados_roteiros_tempos")
          .insert({
            roteiro_id: roteiroId,
            tempo_segundos: tempoSegundos,
            finalizado,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["roteiro_tempo", variables.roteiroId],
      });
    },
  });
};
