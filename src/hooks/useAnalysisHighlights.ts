import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Cores definidas no banco:
// Intensificador: #F97316 (laranja)
// CTA: #EAB308 (amarelo)

export interface HighlightItem {
  id: string;
  texto: string;
  roteiroTitulo: string;
}

export const useIntensificadores = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["intensificadores", user?.id],
    queryFn: async (): Promise<HighlightItem[]> => {
      if (!user?.id) return [];

      // Buscar progresso_roteiros do usuário que tem sublinhados
      const { data: progressos, error } = await supabase
        .from("progresso_roteiros")
        .select(`
          id,
          sublinhados,
          roteiro:roteiros(titulo)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const items: HighlightItem[] = [];

      progressos?.forEach((progresso) => {
        if (!progresso.sublinhados) return;
        
        const sublinhados = progresso.sublinhados as Array<{
          text: string;
          colorId: string;
          color?: string;
        }>;

        sublinhados.forEach((sub) => {
          // #F97316 é a cor do Intensificador
          if (sub.color === "#F97316" || sub.colorId === "#F97316") {
            items.push({
              id: `${progresso.id}-${sub.text.substring(0, 20)}`,
              texto: sub.text,
              roteiroTitulo: (progresso.roteiro as any)?.titulo || "Roteiro",
            });
          }
        });
      });

      return items;
    },
    enabled: !!user?.id,
  });
};

export const useCTAs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ctas", user?.id],
    queryFn: async (): Promise<HighlightItem[]> => {
      if (!user?.id) return [];

      const { data: progressos, error } = await supabase
        .from("progresso_roteiros")
        .select(`
          id,
          sublinhados,
          roteiro:roteiros(titulo)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const items: HighlightItem[] = [];

      progressos?.forEach((progresso) => {
        if (!progresso.sublinhados) return;
        
        const sublinhados = progresso.sublinhados as Array<{
          text: string;
          colorId: string;
          color?: string;
        }>;

        sublinhados.forEach((sub) => {
          // #EAB308 é a cor do CTA
          if (sub.color === "#EAB308" || sub.colorId === "#EAB308") {
            items.push({
              id: `${progresso.id}-${sub.text.substring(0, 20)}`,
              texto: sub.text,
              roteiroTitulo: (progresso.roteiro as any)?.titulo || "Roteiro",
            });
          }
        });
      });

      return items;
    },
    enabled: !!user?.id,
  });
};
