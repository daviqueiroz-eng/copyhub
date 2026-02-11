import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Users, GripVertical } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mentorado } from "@/hooks/useMentorados";
import { useControleLevas, useCreateControleLeva, ControleLeva } from "@/hooks/useControleLevas";
import { ControleLevaDialog } from "./ControleLevaDialog";
import { useAuth } from "@/contexts/AuthContext";
import { addBusinessDays } from "@/lib/dateUtils";

interface ControleViewProps {
  mentorados: Mentorado[];
}

type CalendarMode = "week" | "month";

export function ControleView({ mentorados }: ControleViewProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLeva, setSelectedLeva] = useState<ControleLeva | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const calendarRef = useRef<FullCalendar>(null);
  const draggableContainerRef = useRef<HTMLDivElement>(null);
  const draggableInstanceRef = useRef<Draggable | null>(null);

  const { data: levas = [] } = useControleLevas();
  const createLeva = useCreateControleLeva();
  const { session } = useAuth();

  // Init draggable
  useEffect(() => {
    if (draggableContainerRef.current) {
      // Destroy previous instance
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.destroy();
      }
      draggableInstanceRef.current = new Draggable(draggableContainerRef.current, {
        itemSelector: "[data-mentorado-id]",
        eventData: (eventEl) => {
          const id = eventEl.getAttribute("data-mentorado-id") || "";
          const nome = eventEl.getAttribute("data-mentorado-nome") || "";
          return {
            title: nome,
            extendedProps: { mentoradoId: id },
            allDay: true,
          };
        },
      });
    }
    return () => {
      if (draggableInstanceRef.current) {
        draggableInstanceRef.current.destroy();
      }
    };
  }, [mentorados]);

  // Sync calendar API with state
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.gotoDate(currentDate);
      calendarApi.changeView(calendarMode === "week" ? "dayGridWeek" : "dayGridMonth");
    }
  }, [currentDate, calendarMode]);

  const handlePrev = () => {
    setCurrentDate(prev => calendarMode === "week" ? subWeeks(prev, 1) : subMonths(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => calendarMode === "week" ? addWeeks(prev, 1) : addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventReceive = useCallback(async (info: any) => {
    // Remove the element added by FullCalendar (we'll render from data)
    info.event.remove();

    if (!session?.user?.id) return;

    const mentoradoId = info.event.extendedProps.mentoradoId;
    const dataInicio = format(info.event.start, "yyyy-MM-dd");

    // Check existing levas for this mentorado
    const existingLevas = levas.filter(l => l.mentorado_id === mentoradoId);
    const nextLevaNumber = existingLevas.length > 0
      ? Math.max(...existingLevas.map(l => l.numero_leva)) + 1
      : 1;

    const defaultDias = 10;
    const dataPrevista = addBusinessDays(info.event.start, defaultDias);

    await createLeva.mutateAsync({
      user_id: session.user.id,
      mentorado_id: mentoradoId,
      numero_leva: nextLevaNumber,
      data_inicio: dataInicio,
      dias_uteis: defaultDias,
      data_prevista: format(dataPrevista, "yyyy-MM-dd"),
    });
  }, [session?.user?.id, levas, createLeva]);

  // Build calendar events from levas
  const events = useMemo(() => {
    return levas.map(leva => {
      const mentorado = mentorados.find(m => m.id === leva.mentorado_id);
      const nome = mentorado?.nome || "Mentorado";
      const firstName = nome.split(" ")[0];

      return {
        id: leva.id,
        title: `${firstName} - Leva ${leva.numero_leva}`,
        start: leva.data_inicio,
        end: leva.data_prevista || undefined,
        allDay: true,
        backgroundColor: leva.concluida ? "hsl(var(--muted))" : "hsl(var(--primary))",
        borderColor: leva.concluida ? "hsl(var(--muted))" : "hsl(var(--primary))",
        textColor: leva.concluida ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
        extendedProps: { levaId: leva.id },
      };
    });
  }, [levas, mentorados]);

  const handleEventClick = (info: any) => {
    const levaId = info.event.extendedProps.levaId;
    const leva = levas.find(l => l.id === levaId);
    if (leva) {
      setSelectedLeva(leva);
      setDialogOpen(true);
    }
  };

  const selectedMentorado = selectedLeva
    ? mentorados.find(m => m.id === selectedLeva.mentorado_id) || null
    : null;

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Left: Mentorados list */}
      <Card className="w-72 shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
            <Badge variant="secondary" className="ml-auto">{mentorados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3 pt-0" ref={draggableContainerRef}>
          <div className="space-y-2">
            {mentorados.map(m => {
              const mentoradoLevas = levas.filter(l => l.mentorado_id === m.id && !l.concluida);
              return (
                <div
                  key={m.id}
                  data-mentorado-id={m.id}
                  data-mentorado-nome={m.nome}
                  className="flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.nome} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {m.iniciais}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.nome}</div>
                    {m.plano && (
                      <div className="text-xs text-muted-foreground truncate">{m.plano}</div>
                    )}
                  </div>
                  {mentoradoLevas.length > 0 && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {mentoradoLevas.length}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right: Calendar */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-base font-semibold ml-2 capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <ToggleGroup
            type="single"
            value={calendarMode}
            onValueChange={(v) => v && setCalendarMode(v as CalendarMode)}
            className="border rounded-lg p-0.5 bg-muted/50"
          >
            <ToggleGroupItem value="week" className="text-xs px-3 data-[state=on]:bg-background">
              Semana
            </ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs px-3 data-[state=on]:bg-background">
              Mês
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-3 pt-0">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarMode === "week" ? "dayGridWeek" : "dayGridMonth"}
            initialDate={currentDate}
            headerToolbar={false}
            locale="pt-br"
            height="100%"
            editable={false}
            droppable={true}
            eventReceive={handleEventReceive}
            eventClick={handleEventClick}
            events={events}
            dayMaxEvents={4}
            firstDay={1}
            eventDisplay="block"
            eventClassNames="cursor-pointer text-xs rounded-md"
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <ControleLevaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leva={selectedLeva}
        mentorado={selectedMentorado}
        allLevas={levas}
      />
    </div>
  );
}
