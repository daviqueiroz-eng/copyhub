import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EstruturaFormato {
  id: string;
  nome: string;
  ordem: number;
  created_at: string;
}

export interface EstruturaVideo {
  id: string;
  formato_id: string;
  titulo: string | null;
  link_video: string;
  imagem_path: string | null;
  views: number;
  transcricao: string | null;
  created_at: string;
}

const BUCKET = "estrutura-videos";

export const useEstruturaFormatos = () => {
  return useQuery({
    queryKey: ["estrutura-formatos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_formatos")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EstruturaFormato[];
    },
  });
};

export const useEstruturaVideos = (formatoId: string | null) => {
  return useQuery({
    queryKey: ["estrutura-videos", formatoId],
    enabled: !!formatoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_videos")
        .select("*")
        .eq("formato_id", formatoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EstruturaVideo[];
    },
  });
};

export const useEstruturaFavoritos = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["estrutura-favoritos", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_video_favoritos")
        .select("video_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.video_id as string));
    },
  });
};

export const useToggleFavorito = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ videoId, favorito }: { videoId: string; favorito: boolean }) => {
      if (!user) throw new Error("no user");
      if (favorito) {
        const { error } = await supabase
          .from("estrutura_video_favoritos")
          .delete()
          .eq("user_id", user.id)
          .eq("video_id", videoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("estrutura_video_favoritos")
          .insert({ user_id: user.id, video_id: videoId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estrutura-favoritos"] });
    },
  });
};

export const useCreateFormato = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { nome: string; ordem?: number }) => {
      const { error, data: row } = await supabase
        .from("estrutura_formatos")
        .insert({ nome: data.nome, ordem: data.ordem ?? 0, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estrutura-formatos"] });
      toast.success("Formato criado");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
};

export const useUpdateFormato = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome, ordem }: { id: string; nome?: string; ordem?: number }) => {
      const patch: any = {};
      if (nome !== undefined) patch.nome = nome;
      if (ordem !== undefined) patch.ordem = ordem;
      const { error } = await supabase.from("estrutura_formatos").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estrutura-formatos"] }),
  });
};

export const useDeleteFormato = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estrutura_formatos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estrutura-formatos"] });
      toast.success("Formato excluído");
    },
  });
};

export const useUploadEstruturaImagem = () => {
  return useMutation({
    mutationFn: async ({ file, formatoId }: { file: File; formatoId: string }) => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${formatoId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      return path;
    },
  });
};

export const useSignedImageUrl = (path: string | null) => {
  return useQuery({
    queryKey: ["estrutura-image", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
};

export const useCreateVideo = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      formato_id: string;
      titulo?: string | null;
      link_video: string;
      imagem_path?: string | null;
      views?: number;
      transcricao?: string | null;
    }) => {
      const { error, data: row } = await supabase
        .from("estrutura_videos")
        .insert({
          formato_id: data.formato_id,
          titulo: data.titulo ?? null,
          link_video: data.link_video,
          imagem_path: data.imagem_path ?? null,
          views: data.views ?? 0,
          transcricao: data.transcricao ?? null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["estrutura-videos", row.formato_id] });
      toast.success("Vídeo adicionado");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
};

export const useUpdateVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<EstruturaVideo>) => {
      const { error, data } = await supabase
        .from("estrutura_videos")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["estrutura-videos", row.formato_id] });
      toast.success("Vídeo atualizado");
    },
  });
};

export const useDeleteVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formato_id, imagem_path }: { id: string; formato_id: string; imagem_path: string | null }) => {
      if (imagem_path) {
        await supabase.storage.from(BUCKET).remove([imagem_path]);
      }
      const { error } = await supabase.from("estrutura_videos").delete().eq("id", id);
      if (error) throw error;
      return { formato_id };
    },
    onSuccess: ({ formato_id }) => {
      qc.invalidateQueries({ queryKey: ["estrutura-videos", formato_id] });
      toast.success("Vídeo excluído");
    },
  });
};