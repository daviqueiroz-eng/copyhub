import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InteligenciaGlobal {
  id: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useInteligenciaGlobal = () => {
  return useQuery({
    queryKey: ["inteligencia-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inteligencia_global")
        .select("*")
        .eq("ativo", true)
        .maybeSingle();
      
      if (error) throw error;
      return data as InteligenciaGlobal | null;
    },
  });
};

export const useUpdateInteligenciaGlobal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ titulo, conteudo }: { titulo: string; conteudo: string }) => {
      // First, check if there's an existing active record
      const { data: existing, error: fetchError } = await supabase
        .from("inteligencia_global")
        .select("id")
        .eq("ativo", true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("inteligencia_global")
          .update({ 
            titulo, 
            conteudo, 
            updated_at: new Date().toISOString() 
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
          .from("inteligencia_global")
          .insert({
            titulo,
            conteudo,
            ativo: true,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inteligencia-global"] });
      toast({
        title: "Inteligência Global salva",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error saving inteligencia global:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a inteligência global.",
        variant: "destructive",
      });
    },
  });
};
