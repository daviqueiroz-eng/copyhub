import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBussolaCopy, BussolaEntry } from "@/hooks/useBussolaCopy";
import { ChevronLeft, ChevronRight, Star, Search, Loader2, Check, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return null;
}

const STORAGE_KEY_FAV = "bussola-favorites";
const STORAGE_KEY_SELECTED = "bussola-selected-copy";

export const BussolaCopyView = () => {
  const { data: entries = [], isLoading } = useBussolaCopy();
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentView, setCurrentView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY_SELECTED) || null; } catch { return null; }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_FAV) || "[]"); } catch { return []; }
  });
  const [selectedEntry, setSelectedEntry] = useState<BussolaEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const STORAGE_KEY_OVERRIDES = "bussola-overrides";

  // Local overrides for dragged events, persisted in localStorage
  const [localOverrides, setLocalOverrides] = useState<Record<string, { date: string; originalDate: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_OVERRIDES) || "{}"); } catch { return {}; }
  });
  const calendarRef = useRef<any>(null);
  const today = startOfDay(new Date());

  // When source data changes, clear overrides whose original date changed (spreadsheet updated)
  const prevEntriesRef = useRef<string>("");
  useEffect(() => {
    const entriesKey = entries.map(e => `${e.cliente}|${e.prazo_atual}`).join(";;");
    if (prevEntriesRef.current && entriesKey !== prevEntriesRef.current) {
      // Data changed — clean overrides where the original date no longer matches
      setLocalOverrides(prev => {
        const next: Record<string, { date: string; originalDate: string }> = {};
        Object.entries(prev).forEach(([id, val]) => {
          // Extract index from id
          const idx = parseInt(id.replace("bussola-", ""), 10);
          const filtered = entries.filter(e => parseDate(e.prazo_atual) !== null);
          const entry = filtered[idx];
          if (entry) {
            const currentOriginal = parseDate(entry.prazo_atual);
            if (currentOriginal === val.originalDate) {
              next[id] = val; // keep override, original unchanged
            }
            // else: original changed, discard override
          }
        });
        localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(next));
        return next;
      });
    }
    prevEntriesRef.current = entriesKey;
  }, [entries]);

  // Unique copy names - always dynamic from data
  const copyNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach(e => { if (e.copy?.trim()) names.add(e.copy.trim()); });
    return Array.from(names);
  }, [entries]);

  // Sorted: favorites first, then alphabetical
  const sortedCopyNames = useMemo(() => {
    return [...copyNames].sort((a, b) => {
      const aFav = favorites.includes(a) ? 0 : 1;
      const bFav = favorites.includes(b) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.localeCompare(b);
    });
  }, [copyNames, favorites]);

  // Auto-select on load
  useEffect(() => {
    if (copyNames.length === 0) return;
    if (selectedCopy && copyNames.includes(selectedCopy)) return;
    const firstFav = favorites.find(f => copyNames.includes(f));
    if (firstFav) {
      setSelectedCopy(firstFav);
      localStorage.setItem(STORAGE_KEY_SELECTED, firstFav);
    }
  }, [copyNames, favorites, selectedCopy]);

  const copyColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    copyNames.forEach((name, i) => { map[name] = COLORS[i % COLORS.length]; });
    return map;
  }, [copyNames]);

  const toggleFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(next));
      return next;
    });
  };

  const selectCopy = (name: string) => {
    const newVal = selectedCopy === name ? null : name;
    setSelectedCopy(newVal);
    if (newVal) {
      localStorage.setItem(STORAGE_KEY_SELECTED, newVal);
    } else {
      localStorage.removeItem(STORAGE_KEY_SELECTED);
    }
    setDropdownOpen(false);
  };

  const filtered = useMemo(() => {
    let result = entries.filter(e => parseDate(e.prazo_atual) !== null);
    if (selectedCopy) {
      result = result.filter(e => e.copy.trim() === selectedCopy);
    }
    return result;
  }, [entries, selectedCopy]);

  const filteredNames = useMemo(() => {
    if (!searchTerm) return sortedCopyNames;
    const term = searchTerm.toLowerCase();
    return sortedCopyNames.filter(n => n.toLowerCase().includes(term));
  }, [sortedCopyNames, searchTerm]);

  const events = useMemo(() => {
    return filtered.map((e, i) => {
      const originalDate = parseDate(e.prazo_atual)!;
      const eventId = `bussola-${i}`;
      const override = localOverrides[eventId];
      const displayDate = override?.date || originalDate;
      const isMoved = !!override;
      const prazoDate = new Date(originalDate + "T12:00:00");
      const isOverdue = !isMoved && isBefore(prazoDate, today);
      const cor = copyColorMap[e.copy.trim()] || "#3B82F6";
      return {
        id: eventId,
        title: e.cliente,
        start: displayDate,
        allDay: true,
        backgroundColor: "transparent",
        borderColor: "transparent",
        extendedProps: {
          entry: e,
          isOverdue,
          cor,
          isMoved,
          prazoFormatted: format(prazoDate, "dd/MM"),
          originalDate,
        },
      };
    });
  }, [filtered, today, copyColorMap, localOverrides]);

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) setCurrentTitle(format(api.getDate(), "MMMM yyyy", { locale: ptBR }));
  }, []);

  useEffect(() => { updateTitle(); }, [updateTitle]);

  const handlePrev = () => { calendarRef.current?.getApi()?.prev(); updateTitle(); };
  const handleNext = () => { calendarRef.current?.getApi()?.next(); updateTitle(); };
  const handleToday = () => { calendarRef.current?.getApi()?.today(); updateTitle(); };

  const switchView = (view: "dayGridMonth" | "dayGridWeek") => {
    setCurrentView(view);
    calendarRef.current?.getApi()?.changeView(view);
    updateTitle();
  };

  const handleEventDrop = (info: any) => {
    const eventId = info.event.id;
    const newDate = format(info.event.start, "yyyy-MM-dd");
    const originalDate = info.event.extendedProps.originalDate;
    setLocalOverrides(prev => {
      const next = { ...prev, [eventId]: { date: newDate, originalDate } };
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(next));
      return next;
    });
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
    <div className="h-full flex flex-col bussola-calendar mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-0 shrink-0">
        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 text-sm min-w-[180px] justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={selectedCopy ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {selectedCopy || "Filtrar por nome..."}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start">
              <div className="p-2 border-b border-border">
                <Input
                  placeholder="Buscar nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <ScrollArea className="max-h-[280px]">
                <div className="flex flex-col py-1">
                  {filteredNames.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum nome encontrado</p>
                  )}
                  {filteredNames.map((name) => {
                    const isSelected = selectedCopy === name;
                    const isFav = favorites.includes(name);
                    return (
                      <div
                        key={name}
                        onClick={() => selectCopy(name)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left w-full cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary border-primary" : "border-border"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="flex-1 truncate">{name}</span>
                        <span
                          onClick={(e) => toggleFavorite(name, e)}
                          className="shrink-0 p-0.5 rounded hover:bg-muted cursor-pointer"
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40 hover:text-muted-foreground"}`} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <h2 className="text-xl font-bold capitalize text-foreground">{currentTitle}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} entregas
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://docs.google.com/spreadsheets/d/1NFx4lDqYh5dxejV-uZEFqjuVHGXHe7z3zfh5FV1h1n8/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary/80 italic flex items-center gap-1 transition-colors"
          >
            Acessar planilha <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => switchView("dayGridWeek")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                currentView === "dayGridWeek"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => switchView("dayGridMonth")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                currentView === "dayGridMonth"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mês
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleToday} className="h-7 px-3 text-xs">
            Hoje
          </Button>
        </div>
      </div>

      {/* Calendar - full width, max height */}
      <div className="flex-1 min-h-0">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale="pt-br"
          events={events}
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={false}
          droppable={false}
          eventDrop={handleEventDrop}
          height="100%"
          dayMaxEvents={4}
          fixedWeekCount={false}
          eventClick={(info) => {
            const entry = info.event.extendedProps.entry as BussolaEntry;
            setSelectedEntry(entry);
            setDetailOpen(true);
          }}
          dayCellContent={(arg) => (
            <span className="font-semibold text-sm text-foreground">
              {arg.dayNumberText.replace("日", "")}
            </span>
          )}
          eventContent={(arg) => {
            const { isOverdue, cor, prazoFormatted, isMoved } = arg.event.extendedProps;
            const borderColor = isMoved ? "#22c55e" : (isOverdue ? "hsl(0 72% 51%)" : cor);
            return (
              <div
                className="flex items-start gap-1.5 px-1.5 py-1 rounded-md bg-card border border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow w-full overflow-hidden"
                style={{ borderLeft: `3px solid ${borderColor}` }}
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
          padding: 4px 0;
          font-size: 0.7rem;
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
        .bussola-calendar .fc .fc-daygrid-day-top { padding: 2px 4px 1px; }
        .bussola-calendar .fc .fc-daygrid-day-events { padding: 0 3px 3px; }
        .bussola-calendar .fc .fc-event {
          margin-bottom: 1px;
          border: none;
          background: transparent;
        }
        .bussola-calendar .fc .fc-daygrid-event-harness { margin-bottom: 1px; }
        .bussola-calendar .fc .fc-day-today { background-color: transparent !important; }
        .bussola-calendar .fc .fc-day-today .fc-daygrid-day-top span:first-child {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .bussola-calendar .fc .fc-more-link {
          font-size: 0.7rem;
          color: hsl(var(--primary));
          font-weight: 600;
          padding: 1px 3px;
        }
        .bussola-calendar .fc .fc-daygrid-day-frame { min-height: 100%; }
        .bussola-calendar .fc .fc-scrollgrid-section > td { border: none; }
        .bussola-calendar .fc th { border-left: none; border-right: none; }
      `}</style>
    </div>
  );
};
