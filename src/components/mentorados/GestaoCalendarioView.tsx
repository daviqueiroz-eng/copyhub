import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GestaoEntrega, useUpdateGestaoEntrega, useCreateGestaoEntrega } from "@/hooks/useGestaoEntregas";
import { useGestaoEntregasConfig, useUpsertGestaoEntregaConfig } from "@/hooks/useGestaoEntregasConfig";
import { GestaoEntregaDialog } from "./GestaoEntregaDialog";
import { FirstEntregaConfigDialog } from "./FirstEntregaConfigDialog";
import { ChevronLeft, ChevronRight, AlertTriangle, AlertOctagon, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorados } from "@/hooks/useMentorados";

interface Props {
  entregas: GestaoEntrega[];
}

export const GestaoCalendarioView = ({ entregas }: Props) => {
  const [selectedEntrega, setSelectedEntrega] = useState<GestaoEntrega | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");
  const calendarRef = useRef<any>(null);
  const updateEntrega = useUpdateGestaoEntrega();
  const createEntrega = useCreateGestaoEntrega();
  const upsertConfig = useUpsertGestaoEntregaConfig();
  const { user } = useAuth();
  const { data: mentorados = [] } = useMentorados();
  const { data: configs = [] } = useGestaoEntregasConfig();

  // First-drag config dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ mentoradoId: string; date: string } | null>(null);

  const today = startOfDay(new Date());

  const conflictMap = useMemo(() => {
    const map: Record<string, number> = {};
    entregas.forEach((e) => {
      if (e.status !== "Finalizado") {
        map[e.prazo] = (map[e.prazo] || 0) + 1;
      }
    });
    return map;
  }, [entregas]);

  const conflictDates = useMemo(() => {
    return Object.entries(conflictMap)
      .filter(([, count]) => count >= 2)
      .map(([date]) => date)
      .sort();
  }, [conflictMap]);

  const [conflictIndex, setConflictIndex] = useState(0);

  const events = useMemo(() => {
    return entregas.map((e) => {
      const prazoDate = new Date(e.prazo + "T12:00:00");
      const isOverdue = isBefore(prazoDate, today) && e.status !== "Finalizado";
      const isFinished = e.status === "Finalizado";
      const cor = e.mentorado?.cor || "#3B82F6";

      return {
        id: e.id,
        title: e.mentorado?.nome || "?",
        start: e.prazo,
        allDay: true,
        backgroundColor: "transparent",
        borderColor: "transparent",
        extendedProps: {
          entrega: e,
          isOverdue,
          isFinished,
          cor,
          prazoFormatted: format(prazoDate, "dd/MM"),
        },
      };
    });
  }, [entregas, today]);

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

  // Handle external drop from mentorado cards — show config dialog
  const handleReceive = (info: any) => {
    if (!user) return;
    const mentoradoId = info.event.extendedProps?.mentoradoId;
    const date = format(info.event.start, "yyyy-MM-dd");

    if (mentoradoId) {
      info.event.remove();
      setPendingDrop({ mentoradoId, date });
      setConfigDialogOpen(true);
    }
  };

  const pendingMentorado = mentorados.find((m) => m.id === pendingDrop?.mentoradoId);
  const pendingConfig = configs.find((c) => c.mentorado_id === pendingDrop?.mentoradoId) || null;

  const handleConfigConfirm = (configData: {
    mentor: string;
    leva_atual: number;
    dias_uteis: number;
    roteiros_por_leva: number;
    levas_totais: number;
    status: string;
    observacao: string;
  }) => {
    if (!user || !pendingDrop) return;

    // Save config for future drags
    upsertConfig.mutate({
      user_id: user.id,
      mentorado_id: pendingDrop.mentoradoId,
      mentor: configData.mentor,
      dias_uteis: configData.dias_uteis,
      roteiros_por_leva: configData.roteiros_por_leva,
      levas_totais: configData.levas_totais,
      status: configData.status,
      leva_atual: configData.leva_atual,
    });

    // Create the entrega
    createEntrega.mutate({
      mentorado_id: pendingDrop.mentoradoId,
      user_id: user.id,
      prazo: pendingDrop.date,
      leva: configData.leva_atual,
      dias_uteis: configData.dias_uteis,
      status: configData.status,
      observacao: configData.observacao || null,
      roteiros_por_leva: configData.roteiros_por_leva,
      levas_totais: configData.levas_totais,
      mentor: configData.mentor || null,
    } as any);

    setConfigDialogOpen(false);
    setPendingDrop(null);
  };
  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const date = api.getDate();
      setCurrentTitle(format(date, "MMMM yyyy", { locale: ptBR }));
    }
  }, []);

  const navigateToConflict = useCallback((index: number) => {
    if (conflictDates.length === 0) return;
    const safeIndex = ((index % conflictDates.length) + conflictDates.length) % conflictDates.length;
    setConflictIndex(safeIndex);
    const dateStr = conflictDates[safeIndex];
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(dateStr);
      updateTitle();
      setTimeout(() => {
        const cells = document.querySelectorAll<HTMLElement>(".gestao-calendar .fc-daygrid-day");
        cells.forEach((cell) => {
          const cellDate = cell.getAttribute("data-date");
          if (cellDate === dateStr) {
            cell.classList.add("conflict-flash");
            setTimeout(() => cell.classList.remove("conflict-flash"), 2000);
          }
        });
      }, 100);
    }
  }, [conflictDates, updateTitle]);

  useEffect(() => {
    updateTitle();
  }, [updateTitle]);

  const handlePrev = () => { calendarRef.current?.getApi()?.prev(); updateTitle(); };
  const handleNext = () => { calendarRef.current?.getApi()?.next(); updateTitle(); };
  const handleToday = () => { calendarRef.current?.getApi()?.today(); updateTitle(); };
  const handlePrevDay = () => {
    const api = calendarRef.current?.getApi();
    if (api) { api.incrementDate({ days: -1 }); updateTitle(); }
  };
  const handleNextDay = () => {
    const api = calendarRef.current?.getApi();
    if (api) { api.incrementDate({ days: 1 }); updateTitle(); }
  };

  const switchView = (view: "dayGridMonth" | "dayGridWeek") => {
    setCurrentView(view);
    calendarRef.current?.getApi()?.changeView(view);
    updateTitle();
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 gestao-calendar">
      <div className="h-full flex flex-col min-w-0">
      {/* Custom Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold capitalize text-foreground">{currentTitle}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {conflictDates.length > 0 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateToConflict(conflictIndex - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="destructive" className="gap-1.5 text-xs px-3 py-1 cursor-pointer" onClick={() => navigateToConflict(conflictIndex)}>
                🚨 Atenção ({conflictIndex + 1}/{conflictDates.length})
              </Badge>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateToConflict(conflictIndex + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => switchView("dayGridWeek")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === "dayGridWeek"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => switchView("dayGridMonth")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === "dayGridMonth"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mês
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3 text-sm">
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale="pt-br"
          events={events}
          editable={true}
          droppable={true}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventReceive={handleReceive}
          height="100%"
          dayMaxEvents={4}
          fixedWeekCount={false}
          dayCellDidMount={(arg) => {
            const dateStr = format(arg.date, "yyyy-MM-dd");
            const count = conflictMap[dateStr] || 0;
            if (count >= 3) {
              arg.el.style.outline = "2px solid hsl(0 72% 51%)";
              arg.el.style.outlineOffset = "-2px";
              arg.el.style.borderRadius = "8px";
            } else if (count === 2) {
              arg.el.style.outline = "2px solid hsl(0 72% 51% / 0.4)";
              arg.el.style.outlineOffset = "-2px";
              arg.el.style.borderRadius = "8px";
            }
          }}
          dayCellContent={(arg) => {
            const dateStr = format(arg.date, "yyyy-MM-dd");
            const count = conflictMap[dateStr] || 0;
            return (
              <div className="flex items-center gap-1 w-full">
                <span className="font-semibold text-sm text-foreground">{arg.dayNumberText.replace("日", "")}</span>
                {count >= 3 && <AlertOctagon className="h-3.5 w-3.5 text-destructive" />}
                {count === 2 && <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
              </div>
            );
          }}
          eventContent={(arg) => {
            const { isOverdue, isFinished, cor, prazoFormatted } = arg.event.extendedProps;
            const opacity = isFinished ? "opacity-50" : "";

            return (
              <div
                className={`flex items-start gap-1.5 px-1.5 py-1 rounded-md bg-card border border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow w-full overflow-hidden ${opacity}`}
                style={{ borderLeft: `3px solid ${isOverdue ? "hsl(0 72% 51%)" : cor}` }}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5 cursor-grab" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {arg.event.title}
                  </span>
                  {isFinished ? (
                    <span className="text-[10px] text-muted-foreground">Entregue</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      Entrega: {prazoFormatted}
                    </span>
                  )}
                </div>
              </div>
            );
          }}
          datesSet={() => updateTitle()}
        />
      </div>

      <GestaoEntregaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entrega={selectedEntrega}
      />

      {pendingDrop && pendingMentorado && (
        <FirstEntregaConfigDialog
          open={configDialogOpen}
          onOpenChange={(open) => {
            setConfigDialogOpen(open);
            if (!open) setPendingDrop(null);
          }}
          mentoradoNome={pendingMentorado.nome}
          existingConfig={pendingConfig}
          prazoDate={pendingDrop.date}
          onConfirm={handleConfigConfirm}
        />
      )}

      <style>{`
        .gestao-calendar .fc {
          --fc-border-color: hsl(var(--border));
          --fc-today-bg-color: hsl(var(--accent) / 0.3);
          --fc-neutral-bg-color: transparent;
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        .gestao-calendar .fc .fc-scrollgrid {
          border: none;
        }
        .gestao-calendar .fc .fc-scrollgrid td,
        .gestao-calendar .fc .fc-scrollgrid th {
          border-color: hsl(var(--border) / 0.5);
        }
        .gestao-calendar .fc .fc-col-header-cell {
          background: hsl(var(--muted));
          padding: 8px 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          border: none;
        }
        .gestao-calendar .fc .fc-daygrid-day {
          min-height: 100px;
          transition: background-color 0.15s;
        }
        .gestao-calendar .fc .fc-daygrid-day:hover {
          background-color: hsl(var(--accent) / 0.15);
        }
        .gestao-calendar .fc .fc-daygrid-day-top {
          padding: 4px 6px 2px;
        }
        .gestao-calendar .fc .fc-daygrid-day-events {
          padding: 0 4px 4px;
        }
        .gestao-calendar .fc .fc-event {
          margin-bottom: 2px;
          border: none;
          background: transparent;
        }
        .gestao-calendar .fc .fc-daygrid-event-harness {
          margin-bottom: 2px;
        }
        .gestao-calendar .fc .fc-day-today {
          background-color: transparent !important;
        }
        .gestao-calendar .fc .fc-day-today .fc-daygrid-day-top span:first-child {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .gestao-calendar .fc .fc-more-link {
          font-size: 0.7rem;
          color: hsl(var(--primary));
          font-weight: 600;
          padding: 2px 4px;
        }
        .gestao-calendar .fc .fc-daygrid-day-frame {
          min-height: 100%;
        }
        .gestao-calendar .fc .fc-scrollgrid-section > td {
          border: none;
        }
        .gestao-calendar .fc th {
          border-left: none;
          border-right: none;
        }
        @keyframes conflict-pulse {
          0%, 100% { box-shadow: inset 0 0 0 3px hsl(var(--destructive)); }
          50% { box-shadow: inset 0 0 20px 3px hsl(var(--destructive) / 0.4); }
        }
        .gestao-calendar .conflict-flash {
          animation: conflict-pulse 0.6s ease-in-out 3;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};
