import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RoteiroAnotacao = {
  id: string;
  roteiro_id: string;
  user_id: string;
  referencia_texto: string;
  notas: string;
  estudos: string;
  comentario: string;
  created_at: string;
  updated_at: string;
};

export type AnotacaoCampo = "referencia_texto" | "notas" | "estudos" | "comentario";

export const useRoteiroAnotacoes = (roteiroId: string | undefined) => {
  return useQuery({
    queryKey: ["roteiro_anotacoes", roteiroId],
    queryFn: async () => {
      if (!roteiroId) return null;
      const { data, error } = await supabase
        .from("mentorados_roteiros_anotacoes")
        .select("*")
        .eq("roteiro_id", roteiroId)
        .maybeSingle();
      if (error) throw error;
      return data as RoteiroAnotacao | null;
    },
    enabled: !!roteiroId,
    staleTime: 1000 * 60,
  });
};

export const useUpsertRoteiroAnotacao = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roteiroId,
      campo,
      valor,
    }: {
      roteiroId: string;
      campo: AnotacaoCampo;
      valor: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Tenta atualizar; se não existir, insere
      const { data: existing } = await supabase
        .from("mentorados_roteiros_anotacoes")
        .select("id")
        .eq("roteiro_id", roteiroId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("mentorados_roteiros_anotacoes")
          .update({ [campo]: valor })
          .eq("roteiro_id", roteiroId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("mentorados_roteiros_anotacoes")
          .insert({
            roteiro_id: roteiroId,
            user_id: user.id,
            [campo]: valor,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["roteiro_anotacoes", vars.roteiroId] });
    },
  });
};
