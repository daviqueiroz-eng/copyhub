import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, isBefore, startOfDay, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBussolaCopy, BussolaEntry } from "@/hooks/useBussolaCopy";
import { ChevronLeft, ChevronRight, Star, Search, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

function getColorForCopy(copy: string, index: number): string {
  return COLORS[index % COLORS.length];
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // Try DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return null;
}

export const BussolaCopyView = () => {
  const { data: entries = [], isLoading, refetch, isFetching } = useBussolaCopy();
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bussola-favorites") || "[]");
    } catch { return []; }
  });
  const [selectedEntry, setSelectedEntry] = useState<BussolaEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const calendarRef = useRef<any>(null);
  const today = startOfDay(new Date());

  // Unique copy names for filter
  const copyNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach(e => { if (e.copy) names.add(e.copy.trim()); });
    return Array.from(names).sort();
  }, [entries]);

  // Copy color map
  const copyColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    copyNames.forEach((name, i) => { map[name] = getColorForCopy(name, i); });
    return map;
  }, [copyNames]);

  const toggleFavorite = (name: string) => {
    setFavorites(prev => {
      const next = prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name];
      localStorage.setItem("bussola-favorites", JSON.stringify(next));
      return next;
    });
  };

  // Filter entries
  const filtered = useMemo(() => {
    let result = entries.filter(e => {
      const date = parseDate(e.prazo_atual);
      return date !== null;
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e =>
        e.cliente.toLowerCase().includes(term) ||
        e.copy.toLowerCase().includes(term) ||
        e.mentor.toLowerCase().includes(term)
      );
    }

    // Sort: favorites first
    result.sort((a, b) => {
      const aFav = favorites.includes(a.copy.trim()) ? 0 : 1;
      const bFav = favorites.includes(b.copy.trim()) ? 0 : 1;
      return aFav - bFav;
    });

    return result;
  }, [entries, searchTerm, favorites]);

  const events = useMemo(() => {
    return filtered.map((e, i) => {
      const date = parseDate(e.prazo_atual)!;
      const prazoDate = new Date(date + "T12:00:00");
      const isOverdue = isBefore(prazoDate, today);
      const cor = copyColorMap[e.copy.trim()] || "#3B82F6";

      return {
        id: `bussola-${i}`,
        title: e.cliente,
        start: date,
        allDay: true,
        backgroundColor: "transparent",
        borderColor: "transparent",
        extendedProps: {
          entry: e,
          isOverdue,
          cor,
          prazoFormatted: format(prazoDate, "dd/MM"),
        },
      };
    });
  }, [filtered, today, copyColorMap]);

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      setCurrentTitle(format(api.getDate(), "MMMM yyyy", { locale: ptBR }));
    }
  }, []);

  useEffect(() => { updateTitle(); }, [updateTitle]);

  const handlePrev = () => { calendarRef.current?.getApi()?.prev(); updateTitle(); };
  const handleNext = () => { calendarRef.current?.getApi()?.next(); updateTitle(); };
  const handleToday = () => { calendarRef.current?.getApi()?.today(); updateTitle(); };
  const handlePrevDay = () => { calendarRef.current?.getApi()?.incrementDate({ days: -1 }); updateTitle(); };
  const handleNextDay = () => { calendarRef.current?.getApi()?.incrementDate({ days: 1 }); updateTitle(); };

  const switchView = (view: "dayGridMonth" | "dayGridWeek") => {
    setCurrentView(view);
    calendarRef.current?.getApi()?.changeView(view);
    updateTitle();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando dados da planilha...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bussola-calendar">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-3 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {copyNames.map((name) => (
            <button
              key={name}
              onClick={() => toggleFavorite(name)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80"
              style={{
                borderColor: copyColorMap[name],
                backgroundColor: favorites.includes(name) ? copyColorMap[name] + "20" : "transparent",
                color: copyColorMap[name],
              }}
            >
              <Star className={`h-3 w-3 ${favorites.includes(name) ? "fill-current" : ""}`} />
              {name}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 h-8"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
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
          <Badge variant="secondary" className="text-xs">
            {filtered.length} entregas
          </Badge>
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
          editable={false}
          height="100%"
          dayMaxEvents={4}
          fixedWeekCount={false}
          eventClick={(info) => {
            const entry = info.event.extendedProps.entry as BussolaEntry;
            setSelectedEntry(entry);
            setDetailOpen(true);
          }}
          dayCellContent={(arg) => (
            <div className="flex items-center gap-1 w-full">
              <span className="font-semibold text-sm text-foreground">
                {arg.dayNumberText.replace("日", "")}
              </span>
            </div>
          )}
          eventContent={(arg) => {
            const { isOverdue, cor, prazoFormatted } = arg.event.extendedProps;

            return (
              <div
                className="flex items-start gap-1.5 px-1.5 py-1 rounded-md bg-card border border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow w-full overflow-hidden"
                style={{ borderLeft: `3px solid ${isOverdue ? "hsl(0 72% 51%)" : cor}` }}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {arg.event.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Entrega: {prazoFormatted}
                  </span>
                </div>
              </div>
            );
          }}
          datesSet={() => updateTitle()}
        />
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEntry?.cliente}</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Copy:</span>
                  <p className="font-medium">{selectedEntry.copy || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mentor:</span>
                  <p className="font-medium">{selectedEntry.mentor || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plano:</span>
                  <p className="font-medium">{selectedEntry.plano || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Leva Atual:</span>
                  <p className="font-medium">{selectedEntry.leva_atual || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prazo Atual:</span>
                  <p className="font-medium">{selectedEntry.prazo_atual || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Levas no Total:</span>
                  <p className="font-medium">{selectedEntry.levas_no_total || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Roteiros/Leva:</span>
                  <p className="font-medium">{selectedEntry.roteiros_por_leva || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{selectedEntry.status || "—"}</p>
                </div>
              </div>
              {selectedEntry.observacao && (
                <div>
                  <span className="text-muted-foreground">Observação:</span>
                  <p className="font-medium">{selectedEntry.observacao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        .bussola-calendar .fc {
          --fc-border-color: hsl(var(--border));
          --fc-today-bg-color: hsl(var(--accent) / 0.3);
          --fc-neutral-bg-color: transparent;
          --fc-page-bg-color: transparent;
          font-family: inherit;
        }
        .bussola-calendar .fc .fc-scrollgrid { border: none; }
        .bussola-calendar .fc .fc-scrollgrid td,
        .bussola-calendar .fc .fc-scrollgrid th {
          border-color: hsl(var(--border) / 0.5);
        }
        .bussola-calendar .fc .fc-col-header-cell {
          background: hsl(var(--muted));
          padding: 8px 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          border: none;
        }
        .bussola-calendar .fc .fc-daygrid-day {
          min-height: 100px;
          transition: background-color 0.15s;
        }
        .bussola-calendar .fc .fc-daygrid-day:hover {
          background-color: hsl(var(--accent) / 0.15);
        }
        .bussola-calendar .fc .fc-daygrid-day-top { padding: 4px 6px 2px; }
        .bussola-calendar .fc .fc-daygrid-day-events { padding: 0 4px 4px; }
        .bussola-calendar .fc .fc-event {
          margin-bottom: 2px;
          border: none;
          background: transparent;
        }
        .bussola-calendar .fc .fc-daygrid-event-harness { margin-bottom: 2px; }
        .bussola-calendar .fc .fc-day-today { background-color: transparent !important; }
        .bussola-calendar .fc .fc-day-today .fc-daygrid-day-top span:first-child {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .bussola-calendar .fc .fc-more-link {
          font-size: 0.7rem;
          color: hsl(var(--primary));
          font-weight: 600;
          padding: 2px 4px;
        }
        .bussola-calendar .fc .fc-daygrid-day-frame { min-height: 100%; }
        .bussola-calendar .fc .fc-scrollgrid-section > td { border: none; }
        .bussola-calendar .fc th { border-left: none; border-right: none; }
      `}</style>
    </div>
  );
};
