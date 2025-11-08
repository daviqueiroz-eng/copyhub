import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { Mentorado } from "./useMentorados";

interface DistribuirEntregasParams {
  dataInicio: Date;
  diasSemana: number[];
  mentorados: Mentorado[];
}

export const useDistribuirEntregas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dataInicio, diasSemana, mentorados }: DistribuirEntregasParams) => {
      if (mentorados.length === 0 || diasSemana.length === 0) {
        throw new Error("Selecione pelo menos um dia da semana e tenha mentorados cadastrados");
      }

      const entregas = [];
      let diaAtual = new Date(dataInicio);
      let indiceMentorado = 0;

      // Gerar entregas para 6 levas de cada mentorado
      const totalEntregas = mentorados.length * 6;
      let entregasCriadas = 0;

      while (entregasCriadas < totalEntregas) {
        const diaSemanaAtual = diaAtual.getDay();

        // Verificar se o dia atual está nos dias selecionados
        if (diasSemana.includes(diaSemanaAtual)) {
          const mentorado = mentorados[indiceMentorado % mentorados.length];
          const leva = Math.floor(indiceMentorado / mentorados.length) + 1;

          entregas.push({
            mentorado_id: mentorado.id,
            numero_leva: leva,
            data_entrega: diaAtual.toISOString().split('T')[0],
            concluida: false,
          });

          indiceMentorado++;
          entregasCriadas++;
        }

        // Avançar para o próximo dia
        diaAtual = addDays(diaAtual, 1);
      }

      // Deletar entregas existentes para todos os mentorados
      const mentoradoIds = mentorados.map(m => m.id);
      await supabase
        .from("entregas_mentorados")
        .delete()
        .in("mentorado_id", mentoradoIds);

      // Inserir novas entregas em lotes
      const batchSize = 100;
      for (let i = 0; i < entregas.length; i += batchSize) {
        const batch = entregas.slice(i, i + batchSize);
        const { error } = await supabase
          .from("entregas_mentorados")
          .insert(batch);

        if (error) throw error;
      }

      return entregas.length;
    },
    onSuccess: (totalEntregas) => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast.success(`${totalEntregas} entregas distribuídas com sucesso!`);
    },
    onError: (error) => {
      toast.error("Erro ao distribuir entregas: " + error.message);
    },
  });
};
