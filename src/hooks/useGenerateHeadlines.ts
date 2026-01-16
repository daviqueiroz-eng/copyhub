import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdaptedHeadline {
  original: string;
  adaptada: string;
}

interface GenerateHeadlinesParams {
  inteligencia: string;
  headlines: string[];
}

export const useGenerateHeadlines = () => {
  return useMutation({
    mutationFn: async ({ inteligencia, headlines }: GenerateHeadlinesParams): Promise<AdaptedHeadline[]> => {
      const { data, error } = await supabase.functions.invoke("generate-headlines", {
        body: { inteligencia, headlines },
      });

      if (error) {
        console.error("Error generating headlines:", error);
        throw new Error(error.message || "Erro ao gerar headlines");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data.headlines || [];
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar headlines adaptadas");
    },
  });
};
