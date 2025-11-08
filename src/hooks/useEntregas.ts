import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreateCalendarEvent, formatEntregaToEvent } from "./useGoogleCalendar";

export type Entrega = {
  id: string;
  mentorado_id: string;
  numero_leva: number;
  data_entrega: string | null;
  concluida: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export const useEntregas = (mentoradoId?: string) => {
  return useQuery({
    queryKey: ["entregas", mentoradoId],
    queryFn: async () => {
      let query = supabase.from("entregas_mentorados").select("*");
      
      if (mentoradoId) {
        query = query.eq("mentorado_id", mentoradoId);
      }
      
      const { data, error } = await query.order("numero_leva", { ascending: true });

      if (error) throw error;
      return data as Entrega[];
    },
  });
};

export const useCreateEntrega = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate: createCalendarEvent } = useCreateCalendarEvent();

  return useMutation({
    mutationFn: async (entrega: Omit<Entrega, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("entregas_mentorados")
        .insert(entrega)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast({
        title: "Entrega criada!",
        description: "A entrega foi criada com sucesso.",
      });

      // Buscar dados do mentorado para criar evento no calendário
      if (data.data_entrega) {
        const { data: mentorado } = await supabase
          .from("mentorados")
          .select("id, nome")
          .eq("id", variables.mentorado_id)
          .single();

        if (mentorado) {
          // Criar evento no Google Calendar
          const event = formatEntregaToEvent(mentorado, {
            id: data.id,
            numero_leva: data.numero_leva,
            data_entrega: data.data_entrega,
          });
          
          createCalendarEvent(event);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEntrega = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Entrega> & { id: string }) => {
      const { data, error } = await supabase
        .from("entregas_mentorados")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEntrega = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entregas_mentorados")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast({
        title: "Entrega removida",
        description: "A entrega foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useMoveEntrega = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ mentoradoId, novaLeva }: { mentoradoId: string; novaLeva: number }) => {
      // Buscar entregas existentes
      const { data: entregas, error: fetchError } = await supabase
        .from("entregas_mentorados")
        .select("*")
        .eq("mentorado_id", mentoradoId);

      if (fetchError) throw fetchError;

      // Criar entrega na nova leva se não existir
      const entregaExistente = entregas?.find((e) => e.numero_leva === novaLeva);
      
      if (!entregaExistente) {
        const { error: insertError } = await supabase
          .from("entregas_mentorados")
          .insert({
            mentorado_id: mentoradoId,
            numero_leva: novaLeva,
            concluida: false,
          });

        if (insertError) throw insertError;
      }

      return { mentoradoId, novaLeva };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast({
        title: "Mentorado movido!",
        description: "O mentorado foi movido para a nova leva.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao mover mentorado",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
