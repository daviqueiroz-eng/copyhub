import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  tipo_roteiro_id: string | null;
  link_referencia: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// Shared ref to track when the current session last wrote, so realtime
// events triggered by our own saves don't cause a refetch/flicker.
let lastLocalWriteTs = 0;
const REALTIME_SKIP_WINDOW_MS = 4000; // ignore realtime for 4s after a local save

export const markLocalWrite = () => {
  lastLocalWriteTs = Date.now();
};

export const useMentoradosRoteiros = (mentoradoId: string | undefined) => {
  const queryClient = useQueryClient();

  // Realtime subscription to sync across devices
  useEffect(() => {
    if (!mentoradoId) return;

    const channel = supabase
      .channel(`mentorados_roteiros_${mentoradoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorados_roteiros',
          filter: `mentorado_id=eq.${mentoradoId}`,
        },
        () => {
          // Skip invalidation if we recently saved locally — avoids
          // refetch overwriting what the user is currently typing.
          if (Date.now() - lastLocalWriteTs < REALTIME_SKIP_WINDOW_MS) {
            return;
          }
          queryClient.invalidateQueries({
            queryKey: ["mentorados_roteiros", mentoradoId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mentoradoId, queryClient]);

  return useQuery({
    queryKey: ["mentorados_roteiros", mentoradoId],
    queryFn: async () => {
      if (!mentoradoId) return [];
      
      const { data, error } = await supabase
        .from("mentorados_roteiros")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .is("deleted_at", null)
        .order("guia_numero", { ascending: true })
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as MentoradoRoteiro[];
    },
    enabled: !!mentoradoId,
  });
};

// Hook para buscar guias deletadas (últimos 2 dias)
export const useDeletedGuias = (mentoradoId: string | undefined) => {
  return useQuery({
    queryKey: ["mentorados_roteiros_deleted", mentoradoId],
    queryFn: async () => {
      if (!mentoradoId) return [];
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data, error } = await supabase
        .from("mentorados_roteiros")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .not("deleted_at", "is", null)
        .gte("deleted_at", twoDaysAgo.toISOString())
        .order("guia_numero", { ascending: true })
        .order("ordem", { ascending: true });

      if (error) throw error;
      
      // Agrupar por guia_numero
      const guiasMap = new Map<number, { guia_numero: number; deleted_at: string; count: number }>();
      (data as MentoradoRoteiro[]).forEach((r) => {
        const existing = guiasMap.get(r.guia_numero);
        if (!existing || (r.deleted_at && r.deleted_at > existing.deleted_at)) {
          guiasMap.set(r.guia_numero, {
            guia_numero: r.guia_numero,
            deleted_at: r.deleted_at || "",
            count: (existing?.count || 0) + 1,
          });
        } else if (existing) {
          guiasMap.set(r.guia_numero, { ...existing, count: existing.count + 1 });
        }
      });
      
      return Array.from(guiasMap.values());
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
      tipoRoteiroId,
      linkReferencia,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      ordem: number;
      headline: string;
      estrutura: string;
      tipoRoteiroId?: string | null;
      linkReferencia?: string | null;
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
            deleted_at: null,
            tipo_roteiro_id: tipoRoteiroId ?? null,
            link_referencia: linkReferencia ?? null,
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
    onSuccess: () => {
      // Não invalidar queries para evitar sobrescrever dados locais durante digitação
      // Os dados já estão sincronizados localmente
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

// Soft delete - marca com deleted_at ao invés de deletar permanentemente
export const useDeleteGuia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
    }: {
      mentoradoId: string;
      guiaNumero: number;
    }) => {
      const { error } = await supabase
        .from("mentorados_roteiros")
        .update({ deleted_at: new Date().toISOString() })
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros", variables.mentoradoId],
      });
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros_deleted", variables.mentoradoId],
      });
    },
  });
};

// Restaurar guia deletada
export const useRestoreGuia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
    }: {
      mentoradoId: string;
      guiaNumero: number;
    }) => {
      const { error } = await supabase
        .from("mentorados_roteiros")
        .update({ deleted_at: null })
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros", variables.mentoradoId],
      });
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros_deleted", variables.mentoradoId],
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
        .is("deleted_at", null) // Só contar guias não deletadas
        .order("guia_numero", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data.length > 0 ? data[0].guia_numero : 1;
    },
    enabled: !!mentoradoId,
  });
};

// Reorder roteiros within a guia by rewriting headline/estrutura/tipo/link
// content at each ordem slot — keeps the unique (mentorado_id, guia_numero, ordem)
// constraint intact and avoids juggling ordem values.
export const useReorderRoteiros = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      newOrder,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      // newOrder[i] holds the content that should live at ordem = i + 1
      newOrder: Array<{
        headline: string;
        estrutura: string;
        tipo_roteiro_id: string | null;
        link_referencia: string | null;
      }>;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");
      markLocalWrite();

      const rows = newOrder.map((r, i) => ({
        mentorado_id: mentoradoId,
        user_id: user.id,
        guia_numero: guiaNumero,
        ordem: i + 1,
        headline: r.headline ?? "",
        estrutura: r.estrutura ?? "",
        tipo_roteiro_id: r.tipo_roteiro_id ?? null,
        link_referencia: r.link_referencia ?? null,
        deleted_at: null,
      }));

      const { error } = await supabase
        .from("mentorados_roteiros")
        .upsert(rows, { onConflict: "mentorado_id,guia_numero,ordem" });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mentorados_roteiros", variables.mentoradoId],
      });
    },
  });
};
