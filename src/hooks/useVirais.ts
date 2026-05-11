import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ViralFormato =
  | "lista_util"
  | "defesa_crenca"
  | "storytelling"
  | "comparacao";

export const FORMATOS_VIRAL: { value: ViralFormato; label: string }[] = [
  { value: "lista_util", label: "Lista útil" },
  { value: "defesa_crenca", label: "Defesa de crença" },
  { value: "storytelling", label: "Storytelling" },
  { value: "comparacao", label: "Comparação" },
];

export const formatoLabel = (v: string): string =>
  FORMATOS_VIRAL.find((f) => f.value === v)?.label || v;

export interface Viral {
  id: string;
  user_id: string;
  headline: string;
  estrutura: string | null;
  formato: string;
  views: number;
  link: string;
  nicho_id: string | null;
  perfil_id: string | null;
  created_at: string;
  updated_at: string;
  autor_nome?: string | null;
  nicho_nome?: string | null;
  perfil_nome?: string | null;
}

export interface ViralFilters {
  nichoIds?: string[];
  formatos?: string[];
  perfilIds?: string[];
  meusVirais?: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  orderBy?: "views" | "recentes";
}

export interface NewViralInput {
  headline: string;
  estrutura?: string | null;
  formato: ViralFormato | string;
  views: number;
  link: string;
  nicho_id: string | null;
  perfil_id?: string | null;
}

export const useVirais = (filters: ViralFilters = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["virais", filters, user?.id],
    queryFn: async (): Promise<Viral[]> => {
      let query = supabase
        .from("virais")
        .select("*, nicho:nichos(id, nome), perfil:perfis_referencia(id, nome)")
        .limit(1000);

      if (filters.meusVirais && user?.id) {
        query = query.eq("user_id", user.id);
      }
      if (filters.nichoIds && filters.nichoIds.length > 0) {
        query = query.in("nicho_id", filters.nichoIds);
      }
      if (filters.formatos && filters.formatos.length > 0) {
        query = query.in("formato", filters.formatos);
      }
      if (filters.perfilIds && filters.perfilIds.length > 0) {
        query = query.in("perfil_id", filters.perfilIds);
      }
      if (filters.dataInicio) {
        query = query.gte("created_at", filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte("created_at", filters.dataFim);
      }

      query =
        filters.orderBy === "views"
          ? query.order("views", { ascending: false })
          : query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as any[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

      let profilesMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nome")
          .in("user_id", userIds);
        (profiles || []).forEach((p: any) => {
          profilesMap.set(p.user_id, p.nome);
        });
      }

      return rows.map((r) => ({
        ...r,
        autor_nome: profilesMap.get(r.user_id) || "Usuário",
        nicho_nome: r.nicho?.nome || null,
        perfil_nome: r.perfil?.nome || null,
      }));
    },
  });
};

export const useCreateViraisBulk = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (virais: NewViralInput[]) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const payload = virais.map((v) => ({
        ...v,
        user_id: user.id,
        estrutura: v.estrutura || null,
      }));
      const { data, error } = await supabase
        .from("virais")
        .insert(payload)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virais"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao registrar virais", {
        description: err.message,
      });
    },
  });
};

export const useUpdateViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      headline,
      estrutura,
      views,
      link,
    }: {
      id: string;
      headline?: string;
      estrutura?: string | null;
      views?: number;
      link?: string;
    }) => {
      const updates: any = {};
      if (headline !== undefined) updates.headline = headline;
      if (estrutura !== undefined) updates.estrutura = estrutura;
      if (views !== undefined) updates.views = views;
      if (link !== undefined) updates.link = link;

      const { data, error } = await supabase
        .from("virais")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virais"] });
      toast.success("Viral atualizado");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar viral", {
        description: err.message,
      });
    },
  });
};

export const useDeleteViral = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("virais").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virais"] });
      toast.success("Viral apagado");
    },
    onError: (err: any) => {
      toast.error("Erro ao apagar viral", { description: err.message });
    },
  });
};