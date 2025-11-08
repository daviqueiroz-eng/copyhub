import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CalendarEvent = {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  extendedProperties?: {
    private?: {
      mentoradoId?: string;
      entregaId?: string;
      numeroLeva?: string;
    };
  };
};

// Buscar eventos do calendário
export const useGoogleCalendarEvents = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["google-calendar-events", { enabled }],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = (session as any)?.provider_token;
      if (!providerToken) {
        throw new Error('Sem token do Google. Faça login com Google e conceda acesso ao Calendar.');
      }
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { method: 'GET', providerToken }
      });
      
      if (error) throw error;
      return data.items || [];
    },
    retry: 1,
    enabled,
  });
};

// Criar evento no calendário
export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = (session as any)?.provider_token;
      if (!providerToken) {
        throw new Error('Sem token do Google. Faça login com Google e conceda acesso ao Calendar.');
      }
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          method: 'POST',
          eventData: event,
          providerToken,
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
      toast.success("Evento criado no Google Calendar!");
    },
    onError: (error: any) => {
      console.error('Error creating event:', error);
      toast.error("Erro ao criar evento: " + error.message);
    },
  });
};

// Deletar evento do calendário
export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = (session as any)?.provider_token;
      if (!providerToken) {
        throw new Error('Sem token do Google. Faça login com Google e conceda acesso ao Calendar.');
      }
      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          method: 'DELETE',
          eventData: { eventId },
          providerToken,
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-calendar-events"] });
      toast.success("Evento removido do Google Calendar!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover evento: " + error.message);
    },
  });
};

// Helper para formatar data de entrega em evento
export const formatEntregaToEvent = (
  mentorado: { id: string; nome: string },
  entrega: { id: string; numero_leva: number; data_entrega: string }
): CalendarEvent => {
  const dataEntrega = new Date(entrega.data_entrega);
  const endDate = new Date(dataEntrega);
  endDate.setHours(endDate.getHours() + 1); // Evento de 1 hora

  return {
    summary: `${entrega.numero_leva}ª Leva - ${mentorado.nome}`,
    description: `Prazo de entrega da ${entrega.numero_leva}ª leva para ${mentorado.nome}`,
    start: {
      dateTime: dataEntrega.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    colorId: String(Math.min(entrega.numero_leva, 11)), // Cores 1-11 do Google Calendar
    extendedProperties: {
      private: {
        mentoradoId: mentorado.id,
        entregaId: entrega.id,
        numeroLeva: String(entrega.numero_leva),
      },
    },
  };
};
