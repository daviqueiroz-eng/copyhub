import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OverdeliveryRoteiro {
  id: string;
  user_id: string;
  mentorado_id: string;
  guia_numero: number;
  bloco_id: string;
  bloco_titulo: string;
  bloco_ordem: number;
  roteiro_ordem: number;
  headline: string;
  estrutura: string;
  created_at: string;
  updated_at: string;
}

interface OverdeliveryBloco {
  id: string;
  titulo: string;
  isOpen: boolean;
  roteiros: { ordem: number; headline: string; estrutura: string }[];
}

// Hook para buscar roteiros de overdelivery
export const useOverdeliveryRoteiros = (mentoradoId: string | undefined, guiaNumero: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["overdelivery-roteiros", mentoradoId, guiaNumero],
    queryFn: async () => {
      if (!mentoradoId || !user) return [];

      const { data, error } = await supabase
        .from("mentorados_roteiros_overdelivery")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("user_id", user.id)
        .order("bloco_ordem", { ascending: true })
        .order("roteiro_ordem", { ascending: true });

      if (error) throw error;
      return data as OverdeliveryRoteiro[];
    },
    enabled: !!mentoradoId && !!user && guiaNumero > 0,
  });
};

// Transformar dados do banco em estrutura de blocos
export const transformToBlocos = (data: OverdeliveryRoteiro[]): OverdeliveryBloco[] => {
  if (!data || data.length === 0) return [];

  const blocosMap = new Map<string, OverdeliveryBloco>();

  data.forEach((item) => {
    if (!blocosMap.has(item.bloco_id)) {
      blocosMap.set(item.bloco_id, {
        id: item.bloco_id,
        titulo: item.bloco_titulo,
        isOpen: true,
        roteiros: [],
      });
    }

    const bloco = blocosMap.get(item.bloco_id)!;
    bloco.roteiros.push({
      ordem: item.roteiro_ordem,
      headline: item.headline || "",
      estrutura: item.estrutura || "",
    });
  });

  // Ordenar roteiros dentro de cada bloco
  blocosMap.forEach((bloco) => {
    bloco.roteiros.sort((a, b) => a.ordem - b.ordem);
  });

  // Retornar array ordenado por bloco_ordem
  return Array.from(blocosMap.values());
};

// Hook para salvar/atualizar roteiro
export const useUpsertOverdeliveryRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      blocoId,
      blocoTitulo,
      blocoOrdem,
      roteiroOrdem,
      headline,
      estrutura,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      blocoId: string;
      blocoTitulo: string;
      blocoOrdem: number;
      roteiroOrdem: number;
      headline: string;
      estrutura: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Verificar se já existe
      const { data: existing } = await supabase
        .from("mentorados_roteiros_overdelivery")
        .select("id")
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("bloco_id", blocoId)
        .eq("roteiro_ordem", roteiroOrdem)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("mentorados_roteiros_overdelivery")
          .update({
            bloco_titulo: blocoTitulo,
            bloco_ordem: blocoOrdem,
            headline,
            estrutura,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("mentorados_roteiros_overdelivery")
          .insert({
            user_id: user.id,
            mentorado_id: mentoradoId,
            guia_numero: guiaNumero,
            bloco_id: blocoId,
            bloco_titulo: blocoTitulo,
            bloco_ordem: blocoOrdem,
            roteiro_ordem: roteiroOrdem,
            headline,
            estrutura,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["overdelivery-roteiros", variables.mentoradoId, variables.guiaNumero],
      });
    },
  });
};

// Hook para deletar um roteiro específico
export const useDeleteOverdeliveryRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      blocoId,
      roteiroOrdem,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      blocoId: string;
      roteiroOrdem: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_roteiros_overdelivery")
        .delete()
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("bloco_id", blocoId)
        .eq("roteiro_ordem", roteiroOrdem)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["overdelivery-roteiros", variables.mentoradoId, variables.guiaNumero],
      });
    },
  });
};

// Hook para deletar bloco inteiro
export const useDeleteOverdeliveryBloco = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      blocoId,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      blocoId: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_roteiros_overdelivery")
        .delete()
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("bloco_id", blocoId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["overdelivery-roteiros", variables.mentoradoId, variables.guiaNumero],
      });
    },
  });
};

// Hook para salvar todos os blocos de uma vez
export const useSaveAllOverdeliveryBlocos = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      mentoradoId,
      guiaNumero,
      blocos,
    }: {
      mentoradoId: string;
      guiaNumero: number;
      blocos: OverdeliveryBloco[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Primeiro, deletar todos os dados existentes para esta guia
      const { error: deleteError } = await supabase
        .from("mentorados_roteiros_overdelivery")
        .delete()
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Preparar novos dados
      const insertData: Array<{
        user_id: string;
        mentorado_id: string;
        guia_numero: number;
        bloco_id: string;
        bloco_titulo: string;
        bloco_ordem: number;
        roteiro_ordem: number;
        headline: string;
        estrutura: string;
      }> = [];

      blocos.forEach((bloco, blocoIndex) => {
        bloco.roteiros.forEach((roteiro) => {
          insertData.push({
            user_id: user.id,
            mentorado_id: mentoradoId,
            guia_numero: guiaNumero,
            bloco_id: bloco.id,
            bloco_titulo: bloco.titulo,
            bloco_ordem: blocoIndex + 1,
            roteiro_ordem: roteiro.ordem,
            headline: roteiro.headline || "",
            estrutura: roteiro.estrutura || "",
          });
        });
      });

      // Inserir novos dados se houver
      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("mentorados_roteiros_overdelivery")
          .insert(insertData);

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["overdelivery-roteiros", variables.mentoradoId, variables.guiaNumero],
      });
    },
  });
};
