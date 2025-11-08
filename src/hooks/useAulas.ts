import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type Aula = {
  id: string;
  modulo_id: string;
  titulo: string;
  descricao: string;
  youtube_url: string;
  conteudo?: string;
  duracao?: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export const useAulas = (moduloId?: string) => {
  return useQuery({
    queryKey: ["aulas", moduloId],
    queryFn: async () => {
      let query = supabase
        .from("aulas")
        .select("*")
        .order("ordem", { ascending: true });

      if (moduloId) {
        query = query.eq("modulo_id", moduloId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Aula[];
    },
    enabled: !!moduloId,
  });
};

export const useCreateAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aula: Omit<Aula, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("aulas")
        .insert(aula)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aulas", variables.modulo_id] });
      toast({
        title: "Aula criada",
        description: "A aula foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar aula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Aula> & { id: string }) => {
      const { data, error } = await supabase
        .from("aulas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["aulas", data.modulo_id] });
      toast({
        title: "Aula atualizada",
        description: "A aula foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar aula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, moduloId }: { id: string; moduloId: string }) => {
      const { error } = await supabase
        .from("aulas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return moduloId;
    },
    onSuccess: (moduloId) => {
      queryClient.invalidateQueries({ queryKey: ["aulas", moduloId] });
      toast({
        title: "Aula deletada",
        description: "A aula foi deletada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar aula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
