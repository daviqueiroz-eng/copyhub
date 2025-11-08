import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EventDialog } from "./EventDialog";
import { CalendarEvent, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from "@/hooks/useGoogleCalendar";

export type GoogleCalendarItem = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  colorId?: string;
  htmlLink?: string;
};

export interface GoogleLikeCalendarProps {
  events: GoogleCalendarItem[];
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
}

// Helper to map Google items to FullCalendar events
const mapEvents = (items: GoogleCalendarItem[]) => {
  return items.map((e) => {
    const start = e.start?.dateTime || e.start?.date || undefined;
    const end = e.end?.dateTime || e.end?.date || undefined;
    return {
      id: e.id,
      title: e.summary || "(Sem título)",
      start,
      end,
      extendedProps: {
        description: e.description,
        colorId: e.colorId,
        htmlLink: e.htmlLink,
      },
    } as any;
  });
};

export const GoogleLikeCalendar: React.FC<GoogleLikeCalendarProps> = ({ events, initialView = "timeGridWeek" }) => {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<(CalendarEvent & { id?: string }) | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  const fcEvents = useMemo(() => mapEvents(events), [events]);

  // Clique em slot vazio (criar evento)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(undefined);
    setDialogOpen(true);
    selectInfo.view.calendar.unselect();
  };

  // Clique em evento existente (editar)
  const handleEventClick = (clickInfo: EventClickArg) => {
    const evt = clickInfo.event;
    const calEvent: CalendarEvent & { id: string } = {
      id: evt.id,
      summary: evt.title,
      description: evt.extendedProps["description"] as string,
      start: { dateTime: evt.start!.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: (evt.end || evt.start)!.toISOString(), timeZone: "America/Sao_Paulo" },
    };
    setSelectedEvent(calEvent);
    setSelectedDate(undefined);
    setDialogOpen(true);
  };

  // Drag & Drop de evento
  const handleEventDrop = (dropInfo: EventDropArg) => {
    const evt = dropInfo.event;
    const updated: CalendarEvent & { id: string } = {
      id: evt.id,
      summary: evt.title,
      description: evt.extendedProps["description"] as string,
      start: { dateTime: evt.start!.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: (evt.end || evt.start)!.toISOString(), timeZone: "America/Sao_Paulo" },
    };
    updateMutation.mutate(updated, {
      onError: () => {
        dropInfo.revert();
      }
    });
  };

  // Resize de evento
  const handleEventResize = (resizeInfo: any) => {
    const evt = resizeInfo.event;
    const updated: CalendarEvent & { id: string } = {
      id: evt.id,
      summary: evt.title,
      description: evt.extendedProps["description"] as string,
      start: { dateTime: evt.start!.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: (evt.end || evt.start)!.toISOString(), timeZone: "America/Sao_Paulo" },
    };
    updateMutation.mutate(updated, {
      onError: () => {
        resizeInfo.revert();
      }
    });
  };

  // Salvar evento via dialog
  const handleSaveEvent = (event: CalendarEvent) => {
    if (selectedEvent?.id) {
      // Update
      updateMutation.mutate({ ...event, id: selectedEvent.id } as any, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      // Create
      createMutation.mutate(event, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  // Deletar evento via dialog
  const handleDeleteEvent = (eventId: string) => {
    deleteMutation.mutate(eventId, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  return (
    <TooltipProvider>
      <Card className="p-4">
        <Tabs defaultValue={initialView} className="w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-2">
            <TabsList>
              <TabsTrigger value="dayGridMonth">Mês</TabsTrigger>
              <TabsTrigger value="timeGridWeek">Semana</TabsTrigger>
              <TabsTrigger value="timeGridDay">Dia</TabsTrigger>
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
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventContent={(arg) => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate">
                      <span className="font-medium">{arg.event.title}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs text-sm">
                      {arg.event.extendedProps["description"] as string}
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
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={true}
              height="auto"
              events={fcEvents}
              selectable={true}
              editable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            />
          </TabsContent>

          <TabsContent value="timeGridDay">
            <FullCalendar
              ref={calendarRef as any}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridDay"
              headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              height="auto"
              events={fcEvents}
              selectable={true}
              editable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
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
              listDayFormat={{ weekday: "short", day: "2-digit", month: "2-digit" }}
              eventContent={(arg) => (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(var(--chart-1))` }} />
                  <span className="truncate">{arg.event.title}</span>
                </div>
              )}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialEvent={selectedEvent}
        initialDate={selectedDate}
        isCreating={createMutation.isPending}
        isDeleting={deleteMutation.isPending}
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
          --fc-event-bg-color: hsl(var(--primary));
          --fc-event-border-color: hsl(var(--primary));
          --fc-event-text-color: hsl(var(--primary-foreground));
        }
        .fc-event { cursor: pointer; }
        .fc-event:hover { opacity: 0.9; }
      `}</style>
    </TooltipProvider>
  );
};

export default GoogleLikeCalendar;
