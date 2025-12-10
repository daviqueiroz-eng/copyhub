import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FotoCelebracao {
  id: string;
  url: string;
  created_at: string;
  created_by: string | null;
}

export const useFotosCelebracao = () => {
  return useQuery({
    queryKey: ["fotos-celebracao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fotos_celebracao")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FotoCelebracao[];
    },
  });
};

export const useFotoAleatoria = () => {
  return useQuery({
    queryKey: ["foto-celebracao-aleatoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fotos_celebracao")
        .select("*");

      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex] as FotoCelebracao;
    },
    enabled: false, // Só executa quando chamado manualmente
  });
};

export const useCreateFotoCelebracao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload do arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("fotos-celebracao")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("fotos-celebracao")
        .getPublicUrl(fileName);

      // Inserir no banco
      const { data, error } = await supabase
        .from("fotos_celebracao")
        .insert({
          url: urlData.publicUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fotos-celebracao"] });
      toast({
        title: "Foto adicionada!",
        description: "A foto de celebração foi cadastrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFotoCelebracao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (foto: FotoCelebracao) => {
      // Extrair nome do arquivo da URL
      const urlParts = foto.url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("fotos-celebracao")
        .remove([fileName]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error } = await supabase
        .from("fotos_celebracao")
        .delete()
        .eq("id", foto.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fotos-celebracao"] });
      toast({
        title: "Foto removida!",
        description: "A foto de celebração foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
