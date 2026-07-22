import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConquistaVideo {
  id: string;
  mentorado_id: string;
  titulo: string;
  link: string | null;
  thumbnail_url: string | null;
  visualizacoes: number;
  data_publicacao: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export const useConquistasVideos = (mentoradoId: string | null) => {
  return useQuery({
    queryKey: ["conquistas-videos", mentoradoId],
    queryFn: async () => {
      if (!mentoradoId) return [];
      const { data, error } = await supabase
        .from("mentorado_conquistas_videos")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ConquistaVideo[];
    },
    enabled: !!mentoradoId,
  });
};

export const useUpsertConquistaVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (video: Partial<ConquistaVideo> & { mentorado_id: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload: any = {
        ...video,
        created_by: video.id ? undefined : userData.user?.id,
      };
      if (video.id) {
        const { data, error } = await supabase
          .from("mentorado_conquistas_videos")
          .update(payload)
          .eq("id", video.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("mentorado_conquistas_videos")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["conquistas-videos", v.mentorado_id] });
    },
  });
};

export const useDeleteConquistaVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; mentorado_id: string }) => {
      const { error } = await supabase
        .from("mentorado_conquistas_videos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["conquistas-videos", v.mentorado_id] });
    },
  });
};

export const useUpdateSeguidores = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mentorado_id, seguidores_atual }: { mentorado_id: string; seguidores_atual: number }) => {
      const { error } = await supabase
        .from("mentorados")
        .update({ seguidores_atual })
        .eq("id", mentorado_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentorados"] });
    },
  });
};

export async function uploadConquistaThumbnail(file: File, mentoradoId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `conquistas/${mentoradoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("mentorado-avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("mentorado-avatars").getPublicUrl(path);
  return data.publicUrl;
}

export const MILESTONES = [
  { key: "primeiro-viral", label: "Primeiro viral", desc: "Seu primeiro vídeo que viralizou", target: 1, tipo: "video", color: "#F59E0B", icon: "trophy" },
  { key: "100k", label: "Bater 100k", desc: "Alcançar 100 mil visualizações", target: 100_000, tipo: "views", color: "#6366F1", icon: "target" },
  { key: "500k", label: "Bater 500k", desc: "Alcançar 500 mil visualizações", target: 500_000, tipo: "views", color: "#10B981", icon: "rocket" },
  { key: "1M", label: "Bater 1M", desc: "Alcançar 1 milhão de visualizações", target: 1_000_000, tipo: "views", color: "#3B82F6", icon: "gem" },
] as const;

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}