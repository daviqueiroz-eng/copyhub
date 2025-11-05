import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type Medalha = {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  roteiros_necessarios: number;
  ordem: number;
  created_at: string;
};

export type MedalhaUsuario = {
  id: string;
  user_id: string;
  medalha_id: string;
  desbloqueada_em: string;
  created_at: string;
};

export const useMedalhas = () => {
  return useQuery({
    queryKey: ["medalhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medalhas")
        .select("*")
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as Medalha[];
    },
  });
};

export const useMedalhasUsuario = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["medalhas-usuario", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("medalhas_usuarios")
        .select("*, medalhas(*)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useDesbloquearMedalha = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (medalha_id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("medalhas_usuarios")
        .insert({
          user_id: user.id,
          medalha_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medalhas-usuario"] });
      toast({
        title: "🏆 Nova medalha desbloqueada!",
        description: "Parabéns pela conquista!",
      });
    },
  });
};

export const useCreateMedalha = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (medalha: Omit<Medalha, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("medalhas")
        .insert(medalha)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medalhas"] });
      toast({
        title: "Medalha criada",
        description: "A medalha foi criada com sucesso.",
      });
    },
  });
};
