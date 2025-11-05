import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ProgressoRoteiro = {
  id: string;
  user_id: string;
  roteiro_id: string;
  completado: boolean;
  data_completado: string | null;
  created_at: string;
};

export const useProgressoRoteiros = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["progresso-roteiros", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("progresso_roteiros")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as ProgressoRoteiro[];
    },
    enabled: !!user,
  });
};

export const useCompletarRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roteiro_id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("progresso_roteiros")
        .upsert({
          user_id: user.id,
          roteiro_id,
          completado: true,
          data_completado: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["progresso-roteiros"] });
      
      // Verificar e desbloquear medalhas automaticamente
      if (!user) return;
      
      // Buscar total de roteiros completados
      const { data: totalProgresso } = await supabase
        .from("progresso_roteiros")
        .select("*")
        .eq("user_id", user.id)
        .eq("completado", true);
      
      const totalCompletados = totalProgresso?.length || 0;
      
      // Buscar medalhas disponíveis
      const { data: medalhas } = await supabase
        .from("medalhas")
        .select("*")
        .lte("roteiros_necessarios", totalCompletados)
        .order("roteiros_necessarios", { ascending: false });
      
      // Buscar medalhas já desbloqueadas
      const { data: medalhasDesbloqueadas } = await supabase
        .from("medalhas_usuarios")
        .select("medalha_id")
        .eq("user_id", user.id);
      
      const idsDesbloqueados = medalhasDesbloqueadas?.map(m => m.medalha_id) || [];
      
      // Desbloquear novas medalhas
      if (medalhas) {
        for (const medalha of medalhas) {
          if (!idsDesbloqueados.includes(medalha.id)) {
            await supabase
              .from("medalhas_usuarios")
              .insert({
                user_id: user.id,
                medalha_id: medalha.id,
              });
            
            toast({
              title: `🏆 Nova medalha: ${medalha.icone} ${medalha.nome}!`,
              description: medalha.descricao,
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["medalhas-usuario"] });
      
      toast({
        title: "Roteiro completado!",
        description: "Parabéns por concluir este roteiro!",
      });
    },
  });
};
