import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BussolaEntry {
  copy: string;
  cliente: string;
  plano: string;
  mentor: string;
  leva_atual: string;
  prazo_atual: string;
  levas_no_total: string;
  roteiros_por_leva: string;
  status: string;
  entregas: string;
  observacao: string;
}

export const useBussolaCopy = () => {
  return useQuery({
    queryKey: ["bussola-copy"],
    queryFn: async (): Promise<BussolaEntry[]> => {
      const { data, error } = await supabase.functions.invoke("fetch-google-sheet");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch");

      return (data.data || []).map((row: Record<string, string>) => ({
        copy: row.copy || "",
        cliente: row.cliente || "",
        plano: row.plano || "",
        mentor: row.mentor || row.mentor_ || "",
        leva_atual: row.leva_atual || "",
        prazo_atual: row.prazo_atual || "",
        levas_no_total: row.levas_no_total || "",
        roteiros_por_leva: row.roteiros_por_leva || "",
        status: row.status || row.status_ || "",
        entregas: row.entregas || "",
        observacao: row.observacao || row.observaçao || row.observacao_ || "",
      }));
    },
    staleTime: 0, // Always fresh - no cache
    gcTime: 1000 * 60, // Keep in memory for 1 min
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
};
