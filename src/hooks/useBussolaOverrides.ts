import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type BussolaOverride = {
  id: string;
  stable_key: string;
  nova_data: string;
  data_original: string;
  user_id: string;
};

export type BussolaComentario = {
  id: string;
  stable_key: string;
  comentario: string;
  user_id: string;
  created_at: string;
};

const OVERRIDES_KEY = ["bussola-overrides-db"];
const COMMENTS_KEY_PREFIX = "bussola-comentarios";

export const useBussolaOverrides = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: OVERRIDES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bussola_overrides")
        .select("*");
      if (error) throw error;
      // Convert to map: stable_key -> { date, originalDate }
      const map: Record<string, { date: string; originalDate: string }> = {};
      (data || []).forEach((row: any) => {
        map[row.stable_key] = { date: row.nova_data, originalDate: row.data_original };
      });
      return map;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("bussola-overrides-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bussola_overrides",
      }, () => {
        queryClient.invalidateQueries({ queryKey: OVERRIDES_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const upsertOverride = useMutation({
    mutationFn: async ({ stableKey, newDate, originalDate }: { stableKey: string; newDate: string; originalDate: string }) => {
      const { error } = await supabase
        .from("bussola_overrides")
        .upsert({
          stable_key: stableKey,
          nova_data: newDate,
          data_original: originalDate,
          user_id: user?.id || "",
        }, { onConflict: "stable_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERRIDES_KEY });
    },
  });

  const deleteOverride = useMutation({
    mutationFn: async (stableKey: string) => {
      const { error } = await supabase
        .from("bussola_overrides")
        .delete()
        .eq("stable_key", stableKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERRIDES_KEY });
    },
  });

  return {
    overrides: query.data || {},
    isLoading: query.isLoading,
    upsertOverride: upsertOverride.mutate,
    deleteOverride: deleteOverride.mutate,
  };
};

export const useBussolaComentarios = (stableKey: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = [COMMENTS_KEY_PREFIX, stableKey];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!stableKey) return [];
      const { data, error } = await supabase
        .from("bussola_comentarios")
        .select("*")
        .eq("stable_key", stableKey)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BussolaComentario[];
    },
    enabled: !!stableKey,
  });

  // Realtime for comments
  useEffect(() => {
    if (!stableKey) return;
    const channel = supabase
      .channel(`bussola-comentarios-${stableKey}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "bussola_comentarios",
        filter: `stable_key=eq.${stableKey}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [stableKey, queryClient]);

  const addComment = useMutation({
    mutationFn: async (comentario: string) => {
      if (!stableKey) throw new Error("No key");
      const { error } = await supabase
        .from("bussola_comentarios")
        .insert({
          stable_key: stableKey,
          comentario,
          user_id: user?.id || "",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bussola_comentarios")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    comments: query.data || [],
    isLoading: query.isLoading,
    addComment: addComment.mutate,
    isAdding: addComment.isPending,
    deleteComment: deleteComment.mutate,
  };
};
