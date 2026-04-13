import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export type HeadlineChecklistItem = {
  id: string;
  user_id: string;
  label: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
};

export type HeadlineChecklistProgress = {
  id: string;
  mentorado_id: string;
  guia_numero: number;
  ordem_roteiro: number;
  checklist_item_id: string;
  checked: boolean;
  user_id: string;
  created_at: string;
};

export const useHeadlineChecklistItems = () => {
  return useQuery({
    queryKey: ["headline-checklist-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("headline_checklist_items")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as HeadlineChecklistItem[];
    },
  });
};

export const useAllHeadlineChecklistItems = () => {
  return useQuery({
    queryKey: ["headline-checklist-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("headline_checklist_items")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as HeadlineChecklistItem[];
    },
  });
};

export const useCreateChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: { label: string; ordem: number; user_id: string }) => {
      const { data, error } = await supabase
        .from("headline_checklist_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-items"] });
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-items-all"] });
    },
  });
};

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HeadlineChecklistItem> & { id: string }) => {
      const { error } = await supabase
        .from("headline_checklist_items")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-items"] });
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-items-all"] });
    },
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("headline_checklist_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-items"] });
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-items-all"] });
    },
  });
};

// Progress hooks
export const useHeadlineChecklistProgress = (mentoradoId: string, guiaNumero: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["headline-checklist-progress", mentoradoId, guiaNumero, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("headline_checklist_progress")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("user_id", user.id);
      if (error) throw error;
      return data as HeadlineChecklistProgress[];
    },
    enabled: !!user,
  });
};

export const useToggleChecklistProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      ordemRoteiro,
      checklistItemId,
      checked,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      ordemRoteiro: number;
      checklistItemId: string;
      checked: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert
      const { error } = await supabase
        .from("headline_checklist_progress")
        .upsert(
          {
            mentorado_id: mentoradoId,
            guia_numero: guiaNumero,
            ordem_roteiro: ordemRoteiro,
            checklist_item_id: checklistItemId,
            checked,
            user_id: user.id,
          },
          {
            onConflict: "mentorado_id,guia_numero,ordem_roteiro,checklist_item_id,user_id",
          }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-progress"] });
    },
  });
};

export const useBulkToggleChecklistProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      ordemRoteiro,
      items,
      checked,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      ordemRoteiro: number;
      items: HeadlineChecklistItem[];
      checked: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const rows = items.map((item) => ({
        mentorado_id: mentoradoId,
        guia_numero: guiaNumero,
        ordem_roteiro: ordemRoteiro,
        checklist_item_id: item.id,
        checked,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("headline_checklist_progress")
        .upsert(rows, {
          onConflict: "mentorado_id,guia_numero,ordem_roteiro,checklist_item_id,user_id",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headline-checklist-progress"] });
    },
  });
};
