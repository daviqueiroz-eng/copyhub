import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, isBefore, startOfDay, addDays } from "date-fns";
import { GestaoEntrega, useUpdateGestaoEntrega } from "@/hooks/useGestaoEntregas";
import { GestaoEntregaDialog } from "./GestaoEntregaDialog";
import { Badge } from "@/components/ui/badge";

interface Props {
  entregas: GestaoEntrega[];
}

export const GestaoCalendarioView = ({ entregas }: Props) => {
  const [selectedEntrega, setSelectedEntrega] = useState<GestaoEntrega | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const updateEntrega = useUpdateGestaoEntrega();

  const today = startOfDay(new Date());

  const events = useMemo(() => {
    return entregas.map((e) => {
      const prazoDate = new Date(e.prazo + "T12:00:00");
      const isOverdue = isBefore(prazoDate, today) && e.status !== "Finalizado";
      const cor = e.mentorado?.cor || "#3B82F6";

      return {
        id: e.id,
        title: `${e.mentorado?.nome || "?"} - L${e.leva || "?"}`,
        start: e.prazo,
        allDay: true,
        backgroundColor: isOverdue ? "#EF4444" : e.status === "Finalizado" ? "#9CA3AF" : cor,
        borderColor: isOverdue ? "#DC2626" : e.status === "Finalizado" ? "#6B7280" : cor,
        textColor: "#FFFFFF",
        extendedProps: { entrega: e, isOverdue },
      };
    });
  }, [entregas, today]);

  // Conflict detection
  const conflictMap = useMemo(() => {
    const map: Record<string, number> = {};
    entregas.forEach((e) => {
      map[e.prazo] = (map[e.prazo] || 0) + 1;
    });
    return map;
  }, [entregas]);

  const handleEventClick = (info: any) => {
    const entrega = info.event.extendedProps.entrega as GestaoEntrega;
    setSelectedEntrega(entrega);
    setDialogOpen(true);
  };

  const handleEventDrop = (info: any) => {
    const entregaId = info.event.id;
    const newDate = format(info.event.start, "yyyy-MM-dd");
    updateEntrega.mutate({ id: entregaId, prazo: newDate });
  };

  const handleDateClick = (info: any) => {
    setSelectedEntrega(null);
    setDialogOpen(true);
  };

  return (
    <div className="h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        locale="pt-br"
        events={events}
        editable={true}
        droppable={true}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        dateClick={handleDateClick}
        height="100%"
        dayMaxEvents={3}
        eventContent={(arg) => {
          const count = conflictMap[arg.event.startStr] || 0;
          return (
            <div className="px-1 py-0.5 text-xs truncate flex items-center gap-1">
              <span className="truncate">{arg.event.title}</span>
              {count >= 3 && <span className="bg-red-700 text-white rounded px-1 text-[10px]">!</span>}
              {count === 2 && <span className="bg-yellow-600 text-white rounded px-1 text-[10px]">⚠</span>}
            </div>
          );
        }}
      />

      <GestaoEntregaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entrega={selectedEntrega}
      />
    </div>
  );
};
