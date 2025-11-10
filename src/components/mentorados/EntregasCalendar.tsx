import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { type DropArg } from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import { differenceInDays } from "date-fns";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useEntregas, useUpdateEntrega } from "@/hooks/useEntregas";
import { Mentorado } from "@/hooks/useMentorados";
import { EntregaDialog } from "./EntregaDialog";
import { useToast } from "@/hooks/use-toast";

export interface EntregasCalendarProps {
  mentorados: Mentorado[];
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
}

const getLevaColor = (numeroLeva: number) => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--primary))",
  ];
  return colors[numeroLeva - 1] || "hsl(var(--primary))";
};

const getStatusColor = (dataEntrega: string, concluida: boolean) => {
  if (concluida) return "hsl(142 76% 36%)"; // green-600
  
  const hoje = new Date();
  const data = new Date(dataEntrega);
  const diasRestantes = differenceInDays(data, hoje);
  
  if (diasRestantes < 0) return "hsl(0 84% 60%)"; // red-500
  if (diasRestantes <= 3) return "hsl(48 96% 53%)"; // yellow-500
  return getLevaColor(1); // default: primary/blue
};

export const EntregasCalendar: React.FC<EntregasCalendarProps> = ({ 
  mentorados, 
  initialView = "dayGridMonth" 
}) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [selectedLeva, setSelectedLeva] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { data: entregas = [] } = useEntregas();
  const updateMutation = useUpdateEntrega();
  const { toast } = useToast();

  // Mapear entregas para eventos do FullCalendar
  const fcEvents = useMemo(() => {
    return entregas
      .filter((e) => e.data_entrega)
      .map((entrega) => {
        const mentorado = mentorados.find((m) => m.id === entrega.mentorado_id);
        if (!mentorado) return null;

        const statusColor = getStatusColor(entrega.data_entrega!, entrega.concluida);

        return {
          id: entrega.id,
          title: `${mentorado.iniciais} - Leva ${entrega.numero_leva}`,
          start: entrega.data_entrega,
          allDay: true,
          backgroundColor: statusColor,
          borderColor: statusColor,
          extendedProps: {
            mentorado,
            numeroLeva: entrega.numero_leva,
            concluida: entrega.concluida,
            observacoes: entrega.observacoes,
          },
        };
      })
      .filter(Boolean);
  }, [entregas, mentorados]);

  // Clique em slot vazio (criar entrega)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setSelectedMentorado(null);
    setSelectedLeva(1);
    setDialogOpen(true);
    selectInfo.view.calendar.unselect();
  };

  // Clique em entrega existente (editar)
  const handleEventClick = (clickInfo: EventClickArg) => {
    const evt = clickInfo.event;
    const mentorado = evt.extendedProps["mentorado"] as Mentorado;
    const numeroLeva = evt.extendedProps["numeroLeva"] as number;

    setSelectedMentorado(mentorado);
    setSelectedLeva(numeroLeva);
    setSelectedDate(undefined);
    setDialogOpen(true);
  };

  // Drag & Drop de entrega no calendário
  const handleEventDrop = (dropInfo: EventDropArg) => {
    const evt = dropInfo.event;
    const entrega = entregas.find((e) => e.id === evt.id);
    if (!entrega) {
      dropInfo.revert();
      return;
    }

    updateMutation.mutate(
      {
        id: entrega.id,
        mentorado_id: entrega.mentorado_id,
        numero_leva: entrega.numero_leva,
        data_entrega: evt.start?.toISOString().split("T")[0] || null,
        concluida: entrega.concluida,
        observacoes: entrega.observacoes,
      },
      {
        onError: () => {
          dropInfo.revert();
        },
      }
    );
  };

  // Drop de elemento externo (do painel lateral) no calendário
  const handleDrop = (dropInfo: DropArg) => {
    const entregaId = dropInfo.draggedEl.getAttribute("data-entrega-id");
    if (!entregaId) return;

    const entrega = entregas.find((e) => e.id === entregaId);
    if (!entrega) return;

    const dataStr = dropInfo.dateStr;

    // Atualizar a data da entrega
    updateMutation.mutate(
      {
        id: entrega.id,
        mentorado_id: entrega.mentorado_id,
        numero_leva: entrega.numero_leva,
        data_entrega: dataStr,
        concluida: entrega.concluida,
        observacoes: entrega.observacoes,
      },
      {
        onSuccess: () => {
          toast({
            title: "Entrega agendada!",
            description: `Data definida para ${new Date(dataStr).toLocaleDateString("pt-BR")}`,
          });
        },
      }
    );
  };

  return (
    <TooltipProvider>
      {/* Legenda de Status */}
      <Card className="mb-4">
        <div className="p-4 space-y-2">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-base">Legenda - Datas Limites</span>
            <p className="text-xs text-muted-foreground">
              Este calendário mostra apenas entregas com datas limite definidas
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
              <span className="text-muted-foreground">Agendadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142 76% 36%)" }} />
              <span className="text-muted-foreground">Concluídas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(48 96% 53%)" }} />
              <span className="text-muted-foreground">Atenção (3 dias)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(0 84% 60%)" }} />
              <span className="text-muted-foreground">Atrasadas</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <Tabs defaultValue={initialView} className="w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-2">
            <TabsList>
              <TabsTrigger value="dayGridMonth">Mês</TabsTrigger>
              <TabsTrigger value="timeGridWeek">Semana</TabsTrigger>
              <TabsTrigger value="listWeek">Lista</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dayGridMonth">
            <FullCalendar
              ref={calendarRef as any}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
              height="auto"
              weekNumbers={false}
              events={fcEvents}
              eventDisplay="block"
              selectable={true}
              editable={true}
              droppable={true}
              drop={handleDrop}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              locale="pt-br"
              eventContent={(arg) => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate flex items-center gap-1 px-1">
                      {arg.event.extendedProps["concluida"] && (
                        <Badge className="h-4 px-1 text-[10px]" variant="secondary">✓</Badge>
                      )}
                      <span className="font-medium text-xs">{arg.event.title}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs text-sm space-y-1">
                      <p className="font-semibold">
                        {arg.event.extendedProps["mentorado"]?.nome}
                      </p>
                      <p>Leva: {arg.event.extendedProps["numeroLeva"]}</p>
                      <p>Status: {arg.event.extendedProps["concluida"] ? "Concluída" : "Pendente"}</p>
                      {arg.event.extendedProps["observacoes"] && (
                        <p className="text-xs text-muted-foreground">
                          {arg.event.extendedProps["observacoes"]}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            />
          </TabsContent>

          <TabsContent value="timeGridWeek">
            <FullCalendar
              ref={calendarRef as any}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
              allDaySlot={true}
              height="auto"
              events={fcEvents}
              selectable={true}
              editable={true}
              droppable={true}
              drop={handleDrop}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              locale="pt-br"
            />
          </TabsContent>

          <TabsContent value="listWeek">
            <FullCalendar
              ref={calendarRef as any}
              plugins={[listPlugin]}
              initialView="listWeek"
              headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
              height="auto"
              events={fcEvents}
              locale="pt-br"
              eventClick={handleEventClick}
              listDayFormat={{ weekday: "short", day: "2-digit", month: "2-digit" }}
              eventContent={(arg) => (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: arg.event.backgroundColor }} 
                  />
                  <span className="truncate">{arg.event.title}</span>
                  {arg.event.extendedProps["concluida"] && (
                    <Badge className="h-4 px-1 text-[10px]" variant="secondary">✓</Badge>
                  )}
                </div>
              )}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <EntregaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mentorado={selectedMentorado}
        numeroLeva={selectedLeva}
        initialDate={selectedDate}
        mentorados={mentorados}
      />

      {/* Theming FullCalendar with semantic tokens */}
      <style>{`
        .fc .fc-button-primary {
          background: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .fc .fc-button-primary:hover {
          background: hsl(var(--primary) / 0.9);
          border-color: hsl(var(--primary));
        }
        .fc .fc-toolbar-title { font-weight: 600; }
        .fc {
          --fc-border-color: hsl(var(--border));
          --fc-page-bg-color: hsl(var(--background));
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-neutral-text-color: hsl(var(--muted-foreground));
          --fc-list-event-hover-bg-color: hsl(var(--accent));
          --fc-today-bg-color: hsl(var(--primary) / 0.06);
        }
        .fc-event { cursor: pointer; }
        .fc-event:hover { opacity: 0.9; }
      `}</style>
    </TooltipProvider>
  );
};

export default EntregasCalendar;
