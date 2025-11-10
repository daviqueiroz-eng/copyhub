import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addBusinessDays } from "@/lib/dateUtils";

interface ReplicateEntregasParams {
  mentoradoId: string;
  dataInicial: Date;
  intervaloDias: number;
}

export const useReplicateEntregas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mentoradoId, dataInicial, intervaloDias }: ReplicateEntregasParams) => {
      const entregas = [];
      
      // Criar entregas para levas 1 a 6 (apenas dias úteis)
      for (let i = 1; i <= 6; i++) {
        const diasUteis = intervaloDias * (i - 1);
        const dataEntrega = addBusinessDays(dataInicial, diasUteis);
        const dataStr = dataEntrega.toISOString().split('T')[0];
        
        entregas.push({
          mentorado_id: mentoradoId,
          numero_leva: i,
          data_entrega: dataStr,
          data_limite: dataStr, // Define data limite igual à data de entrega
          concluida: false,
        });
      }

      // Primeiro, remover entregas existentes para esse mentorado
      await supabase
        .from("entregas_mentorados")
        .delete()
        .eq("mentorado_id", mentoradoId);

      // Depois, inserir as novas entregas
      const { error } = await supabase
        .from("entregas_mentorados")
        .insert(entregas);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast.success("Entregas criadas com sucesso para todas as levas!");
    },
    onError: (error) => {
      toast.error("Erro ao criar entregas: " + error.message);
    },
  });
};
