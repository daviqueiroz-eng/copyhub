import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface RoteiroFeedback {
  id: string;
  user_id: string;
  mentorado_id: string;
  guia_numero: number;
  tempo_headlines: number;
  tempo_roteiros: number;
  tempo_revisao: number;
  dificuldades: string | null;
  created_at: string;
}

interface CreateFeedbackData {
  mentorado_id: string;
  guia_numero: number;
  tempo_headlines: number;
  tempo_roteiros: number;
  tempo_revisao: number;
  dificuldades?: string;
}

// Hook para buscar feedbacks do usuário atual
export const useRoteiroFeedbacks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["roteiro-feedbacks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("roteiro_feedbacks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RoteiroFeedback[];
    },
    enabled: !!user?.id,
  });
};

// Hook para buscar TODOS os feedbacks (admin)
export const useAllRoteiroFeedbacks = () => {
  return useQuery({
    queryKey: ["all-roteiro-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roteiro_feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RoteiroFeedback[];
    },
  });
};

// Mutation para criar/atualizar feedback
export const useCreateRoteiroFeedback = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateFeedbackData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("roteiro_feedbacks")
        .upsert(
          {
            user_id: user.id,
            mentorado_id: data.mentorado_id,
            guia_numero: data.guia_numero,
            tempo_headlines: data.tempo_headlines,
            tempo_roteiros: data.tempo_roteiros,
            tempo_revisao: data.tempo_revisao,
            dificuldades: data.dificuldades || null,
          },
          {
            onConflict: "user_id,mentorado_id,guia_numero",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roteiro-feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["all-roteiro-feedbacks"] });
      toast({
        title: "Feedback salvo!",
        description: "Seu registro de tempo foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao salvar feedback:", error);
      toast({
        title: "Erro ao salvar feedback",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
};

// Hook para verificar se já existe feedback para um guia específico
export const useCheckFeedbackExists = (mentoradoId: string, guiaNumero: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["roteiro-feedback-exists", user?.id, mentoradoId, guiaNumero],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("roteiro_feedbacks")
        .select("id")
        .eq("user_id", user.id)
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!mentoradoId && guiaNumero > 0,
  });
};
