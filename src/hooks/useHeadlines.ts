import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Headline = {
  id: string;
  category_key: string;
  headline: string;
  referencia: string | null;
  gatilhos: string | null;
  estrutura: string | null;
};

export type Category = {
  id: string;
  name: string;
  key: string;
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useHeadlines = (categoryKey: string) => {
  return useQuery({
    queryKey: ["headlines", categoryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("headlines")
        .select("*")
        .eq("category_key", categoryKey)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Headline[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, key }: { name: string; key: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, key })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Categoria criada!",
        description: "A nova categoria foi adicionada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateHeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (headline: Omit<Headline, "id">) => {
      const { data, error } = await supabase
        .from("headlines")
        .insert(headline)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["headlines", variables.category_key] });
    },
  });
};

export const useUpdateHeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Headline> & { id: string }) => {
      const { data, error } = await supabase
        .from("headlines")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["headlines", data.category_key] });
    },
  });
};

export const useDeleteHeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryKey }: { id: string; categoryKey: string }) => {
      const { error } = await supabase
        .from("headlines")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, categoryKey };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["headlines", variables.categoryKey] });
    },
  });
};

export const useCreateMultipleHeadlines = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ headlines, categoryKey }: { headlines: Omit<Headline, "id">[]; categoryKey: string }) => {
      const { data, error } = await supabase
        .from("headlines")
        .insert(headlines)
        .select();

      if (error) throw error;
      return { data, categoryKey };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["headlines", result.categoryKey] });
      toast({
        title: "Headlines adicionadas!",
        description: `${result.data.length} linhas foram importadas com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
