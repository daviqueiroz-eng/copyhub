import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Settings, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePomodoro } from "@/contexts/PomodoroContext";

type Modo = "pomodoro" | "cronometro" | "temporizador";

const STORAGE_KEY = "top-clock-widget-state";

const formatHMS = (totalSeg: number) => {
  const s = Math.max(0, Math.floor(totalSeg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export const TopClockWidget = () => {
  const pomodoro = usePomodoro();

  const [modo, setModo] = useState<Modo>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return (JSON.parse(raw).modo as Modo) || "pomodoro";
    } catch {}
    return "pomodoro";
  });

  // ===== Cronômetro (contagem progressiva) =====
  const [croRunning, setCroRunning] = useState(false);
  const [croSegundos, setCroSegundos] = useState(0);
  const croStartRef = useRef<number | null>(null);
  const croBaseRef = useRef<number>(0);

  // ===== Temporizador (contagem regressiva) =====
  const [tempTotal, setTempTotal] = useState(5 * 60); // minutos default
  const [tempRestante, setTempRestante] = useState(5 * 60);
  const [tempRunning, setTempRunning] = useState(false);
  const tempEndRef = useRef<number | null>(null);
  const [tempConfigOpen, setTempConfigOpen] = useState(false);
  const [tempMinInput, setTempMinInput] = useState("5");

  // Restaurar estado salvo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.croSegundos === "number") {
        croBaseRef.current = s.croSegundos;
        setCroSegundos(s.croSegundos);
      }
      if (typeof s.tempTotal === "number") {
        setTempTotal(s.tempTotal);
        setTempMinInput(String(Math.round(s.tempTotal / 60)));
      }
      if (typeof s.tempRestante === "number") setTempRestante(s.tempRestante);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir
  useEffect(() => {
    const data = { modo, croSegundos, tempTotal, tempRestante };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [modo, croSegundos, tempTotal, tempRestante]);

  // Cronômetro tick
  useEffect(() => {
    if (!croRunning) return;
    croStartRef.current = Date.now();
    const id = setInterval(() => {
      if (croStartRef.current == null) return;
      const delta = (Date.now() - croStartRef.current) / 1000;
      setCroSegundos(croBaseRef.current + delta);
    }, 100);
    return () => {
      clearInterval(id);
      if (croStartRef.current != null) {
        croBaseRef.current = croBaseRef.current + (Date.now() - croStartRef.current) / 1000;
        croStartRef.current = null;
      }
    };
  }, [croRunning]);

  // Temporizador tick
  useEffect(() => {
    if (!tempRunning) return;
    if (tempEndRef.current == null) tempEndRef.current = Date.now() + tempRestante * 1000;
    const id = setInterval(() => {
      if (tempEndRef.current == null) return;
      const restante = Math.max(0, (tempEndRef.current - Date.now()) / 1000);
      setTempRestante(restante);
      if (restante <= 0) {
        setTempRunning(false);
        tempEndRef.current = null;
        try {
          new Audio("/sounds/bell.mp3").play().catch(() => {});
        } catch {}
      }
    }, 250);
    return () => clearInterval(id);
  }, [tempRunning]);

  // Display + controle por modo
  let display = "00:00";
  let isRunning = false;
  let onToggle: () => void = () => {};
  let onReset: () => void = () => {};
  let total = 0;
  let atual = 0;

  if (modo === "pomodoro") {
    display = formatHMS(pomodoro.segundosRestantes);
    isRunning = pomodoro.isRunning;
    onToggle = () => pomodoro.toggleTimer();
    onReset = () => pomodoro.resetTimer();
    total = pomodoro.tempoCustomizado ?? pomodoro.PRESETS[pomodoro.modo];
    atual = total - pomodoro.segundosRestantes;
  } else if (modo === "cronometro") {
    display = formatHMS(croSegundos);
    isRunning = croRunning;
    onToggle = () => setCroRunning((v) => !v);
    onReset = () => {
      setCroRunning(false);
      croBaseRef.current = 0;
      croStartRef.current = null;
      setCroSegundos(0);
    };
    total = 60;
    atual = (croSegundos % 60);
  } else {
    display = formatHMS(tempRestante);
    isRunning = tempRunning;
    onToggle = () => {
      if (tempRunning) {
        // pausar: salva restante
        if (tempEndRef.current != null) {
          setTempRestante(Math.max(0, (tempEndRef.current - Date.now()) / 1000));
        }
        tempEndRef.current = null;
        setTempRunning(false);
      } else {
        if (tempRestante <= 0) setTempRestante(tempTotal);
        setTempRunning(true);
      }
    };
    onReset = () => {
      setTempRunning(false);
      tempEndRef.current = null;
      setTempRestante(tempTotal);
    };
    total = tempTotal;
    atual = tempTotal - tempRestante;
  }

  const modoLabel = modo === "cronometro" ? "Cronômetro" : modo === "temporizador" ? "Temporizador" : "Pomodoro";

  const progressPct = total > 0 ? Math.min(100, Math.max(0, (atual / total) * 100)) : 0;

  return (
    <div className="relative flex items-center gap-1 h-8 px-2 rounded-md border bg-muted/30 overflow-hidden min-w-[220px]">
      {/* Barra de progresso de fundo */}
      <div
        className="absolute inset-y-0 left-0 bg-orange-500/15 dark:bg-orange-400/15 transition-all duration-300 pointer-events-none"
        style={{ width: `${progressPct}%` }}
      />
      <div className="relative flex items-center gap-1 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            title="Trocar modo"
          >
            {modoLabel}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          <DropdownMenuItem onClick={() => setModo("pomodoro")}>Pomodoro</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModo("cronometro")}>Cronômetro</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModo("temporizador")}>Temporizador</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span
        className={cn(
          "font-mono text-sm font-semibold tabular-nums min-w-[52px] text-center",
          isRunning ? "text-orange-600 dark:text-orange-400" : "text-foreground"
        )}
      >
        {display}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onToggle}
        title={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onReset}
        title="Resetar"
      >
        <RotateCcw className="h-3 w-3" />
      </Button>

      {modo === "temporizador" && (
        <Popover open={tempConfigOpen} onOpenChange={setTempConfigOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Configurar minutos">
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Minutos
              </label>
              <Input
                type="number"
                min={1}
                value={tempMinInput}
                onChange={(e) => setTempMinInput(e.target.value)}
                className="h-8"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  const mins = Math.max(1, parseInt(tempMinInput) || 1);
                  const segs = mins * 60;
                  setTempTotal(segs);
                  setTempRestante(segs);
                  setTempRunning(false);
                  tempEndRef.current = null;
                  setTempConfigOpen(false);
                }}
              >
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
      </div>
    </div>
  );
};
