import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CheckRoteiroViral {
  id: string;
  nome: string;
  descricao: string | null;
  regra_tipo: string;
  regra_valor: string | null;
  campo: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

// Buscar todos os checks ativos
export const useCheckRoteiroViral = () => {
  return useQuery({
    queryKey: ["check-roteiro-viral"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_roteiro_viral")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as CheckRoteiroViral[];
    },
  });
};

// Buscar apenas checks ativos
export const useCheckRoteiroViralAtivos = () => {
  return useQuery({
    queryKey: ["check-roteiro-viral", "ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_roteiro_viral")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as CheckRoteiroViral[];
    },
  });
};

// Criar check
export const useCreateCheckRoteiroViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (check: Omit<CheckRoteiroViral, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("check_roteiro_viral")
        .insert(check)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-roteiro-viral"] });
      toast({ title: "Check criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar check",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Atualizar check
export const useUpdateCheckRoteiroViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CheckRoteiroViral> & { id: string }) => {
      const { data, error } = await supabase
        .from("check_roteiro_viral")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-roteiro-viral"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar check",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Deletar check
export const useDeleteCheckRoteiroViral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("check_roteiro_viral")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-roteiro-viral"] });
      toast({ title: "Check removido!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover check",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Função para verificar se um check passa
export const verificarCheck = (
  check: CheckRoteiroViral,
  headline: string,
  estrutura: string,
  mentoradoNome: string
): boolean => {
  const textoParaVerificar =
    check.campo === "headline"
      ? headline
      : check.campo === "estrutura"
      ? estrutura
      : `${headline} ${estrutura}`;

  if (!textoParaVerificar?.trim()) return true; // Se não tem texto, não verificar

  switch (check.regra_tipo) {
    case "contem": {
      // Verificar se ALGUMA das palavras/frases aparece
      const palavras =
        check.regra_valor?.split(",").map((p) => p.trim().toLowerCase()) || [];
      return palavras.some((p) =>
        textoParaVerificar.toLowerCase().includes(p)
      );
    }

    case "nao_contem": {
      // Verificar se NENHUMA das palavras aparece (deve ser true se não contém)
      const palavrasProibidas =
        check.regra_valor?.split(",").map((p) => p.trim().toLowerCase()) || [];
      return !palavrasProibidas.some((p) =>
        textoParaVerificar.toLowerCase().includes(p)
      );
    }

    case "regex": {
      try {
        const regex = new RegExp(check.regra_valor || "", "i");
        return regex.test(textoParaVerificar);
      } catch {
        return true; // Se regex inválido, ignorar
      }
    }

    case "mentorado_nome": {
      // Verificar se nome do mentorado aparece (primeiro nome)
      const primeiroNome = mentoradoNome.split(" ")[0].toLowerCase();
      return textoParaVerificar.toLowerCase().includes(primeiroNome);
    }

    default:
      return true;
  }
};
