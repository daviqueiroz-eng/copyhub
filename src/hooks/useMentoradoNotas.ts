import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMentoradoNotas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notasQuery = useQuery({
    queryKey: ['mentorado-notas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentorado_notas' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const upsertNota = useMutation({
    mutationFn: async ({ mentoradoId, conteudo }: { mentoradoId: string; conteudo: string }) => {
      // Try update first
      const { data: existing } = await supabase
        .from('mentorado_notas' as any)
        .select('id')
        .eq('user_id', user!.id)
        .eq('mentorado_id', mentoradoId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('mentorado_notas' as any)
          .update({ conteudo } as any)
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mentorado_notas' as any)
          .insert({ user_id: user!.id, mentorado_id: mentoradoId, conteudo } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentorado-notas', user?.id] });
    },
  });

  const getNotaForMentorado = (mentoradoId: string) => {
    return notasQuery.data?.find((n: any) => n.mentorado_id === mentoradoId);
  };

  return {
    notas: notasQuery.data || [],
    isLoading: notasQuery.isLoading,
    upsertNota,
    getNotaForMentorado,
  };
};
