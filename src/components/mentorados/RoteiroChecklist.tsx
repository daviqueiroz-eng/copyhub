import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  hasTiming: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "headlines", label: "Selecionar headlines", checked: false, hasTiming: true },
  { id: "roteiros", label: "Escrever roteiros", checked: false, hasTiming: true },
  { id: "revisar", label: "Revisar", checked: false, hasTiming: true },
  { id: "docs", label: "Adicionar no docs", checked: false, hasTiming: false },
  { id: "avisar", label: "Avisar mentor no trello e no google chat", checked: false, hasTiming: false },
  { id: "datas", label: "Atualizar datas", checked: false, hasTiming: false },
];

interface TimerState {
  segundos: number;
  isRunning: boolean;
  finalizado: boolean;
}

interface RoteiroChecklistProps {
  mentoradoId: string;
  guiaNumero: number;
}

export const RoteiroChecklist = ({ mentoradoId, guiaNumero }: RoteiroChecklistProps) => {
  const checklistStorageKey = `roteiro-checklist-${mentoradoId}-${guiaNumero}`;
  
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  
  // Timers separados para cada fase
  const [timers, setTimers] = useState<Record<string, TimerState>>({
    headlines: { segundos: 0, isRunning: false, finalizado: false },
    roteiros: { segundos: 0, isRunning: false, finalizado: false },
    revisar: { segundos: 0, isRunning: false, finalizado: false },
  });
  
  const intervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Carregar checklist quando mudar de guia
  useEffect(() => {
    const saved = localStorage.getItem(checklistStorageKey);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems(DEFAULT_ITEMS.map(i => ({ ...i, checked: false })));
      }
    } else {
      setItems(DEFAULT_ITEMS.map(i => ({ ...i, checked: false })));
    }
  }, [checklistStorageKey]);

  // Carregar timers quando mudar de guia
  useEffect(() => {
    const timerIds = ["headlines", "roteiros", "revisar"];
    const loadedTimers: Record<string, TimerState> = {};
    
    timerIds.forEach(id => {
      const timerKey = `roteiro-timer-${mentoradoId}-${guiaNumero}-${id}`;
      const saved = localStorage.getItem(timerKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          loadedTimers[id] = {
            segundos: data.segundos || 0,
            isRunning: false, // Sempre pausado ao carregar
            finalizado: data.finalizado || false,
          };
        } catch {
          loadedTimers[id] = { segundos: 0, isRunning: false, finalizado: false };
        }
      } else {
        loadedTimers[id] = { segundos: 0, isRunning: false, finalizado: false };
      }
    });
    
    setTimers(loadedTimers);
  }, [mentoradoId, guiaNumero]);

  // Salvar checklist
  useEffect(() => {
    localStorage.setItem(checklistStorageKey, JSON.stringify(items));
  }, [items, checklistStorageKey]);

  // Salvar timers
  useEffect(() => {
    Object.entries(timers).forEach(([id, timer]) => {
      const timerKey = `roteiro-timer-${mentoradoId}-${guiaNumero}-${id}`;
      localStorage.setItem(timerKey, JSON.stringify({
        segundos: timer.segundos,
        finalizado: timer.finalizado,
      }));
    });
  }, [timers, mentoradoId, guiaNumero]);

  // Gerenciar intervals dos timers
  useEffect(() => {
    Object.entries(timers).forEach(([id, timer]) => {
      if (timer.isRunning && !timer.finalizado) {
        if (!intervalsRef.current[id]) {
          intervalsRef.current[id] = setInterval(() => {
            setTimers(prev => ({
              ...prev,
              [id]: { ...prev[id], segundos: prev[id].segundos + 1 }
            }));
          }, 1000);
        }
      } else {
        if (intervalsRef.current[id]) {
          clearInterval(intervalsRef.current[id]!);
          intervalsRef.current[id] = null;
        }
      }
    });

    return () => {
      Object.values(intervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [timers]);

  const formatTime = (totalSegundos: number) => {
    const hrs = Math.floor(totalSegundos / 3600);
    const mins = Math.floor((totalSegundos % 3600) / 60);
    const secs = totalSegundos % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleToggle = (id: string) => {
    setItems(prev => 
      prev.map(item => {
        if (item.id === id) {
          const newChecked = !item.checked;
          
          // Se marcar como concluído e tem timer, finalizar o timer
          if (newChecked && item.hasTiming) {
            setTimers(prevTimers => ({
              ...prevTimers,
              [id]: { ...prevTimers[id], isRunning: false, finalizado: true }
            }));
          }
          
          return { ...item, checked: newChecked };
        }
        return item;
      })
    );
  };

  const handleTimerToggle = (id: string) => {
    setTimers(prev => {
      const timer = prev[id];
      if (timer.finalizado) {
        // Retomar
        return { ...prev, [id]: { ...timer, finalizado: false, isRunning: true } };
      }
      return { ...prev, [id]: { ...timer, isRunning: !timer.isRunning } };
    });
  };

  const handleTimerReset = (id: string) => {
    setTimers(prev => ({
      ...prev,
      [id]: { segundos: 0, isRunning: false, finalizado: false }
    }));
    // Desmarcar o checkbox também
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, checked: false } : item
      )
    );
  };

  const completedCount = items.filter(i => i.checked).length;
  
  // Calcular tempo total
  const totalSegundos = Object.values(timers).reduce((acc, t) => acc + t.segundos, 0);

  return (
    <div className="w-72 shrink-0">
      <div className="sticky top-8 bg-background border rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Checklist</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </div>
        
        <div className="space-y-3">
          {items.map((item) => {
            const timer = timers[item.id];
            
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => handleToggle(item.id)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={item.id}
                    className={cn(
                      "text-sm cursor-pointer leading-tight flex-1",
                      item.checked && "line-through text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </Label>
                </div>
                
                {/* Timer inline para itens com timing */}
                {item.hasTiming && timer && (
                  <div className="flex items-center gap-1 ml-6">
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border transition-colors",
                        timer.finalizado
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                          : timer.isRunning
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      <span className="min-w-[40px] text-center">{formatTime(timer.segundos)}</span>
                      {timer.finalizado && <span className="text-[10px]">✓</span>}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleTimerToggle(item.id)}
                      title={timer.finalizado ? "Retomar" : timer.isRunning ? "Pausar" : "Iniciar"}
                    >
                      {timer.isRunning ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    
                    {(timer.segundos > 0 || timer.finalizado) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleTimerReset(item.id)}
                        title="Resetar"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Total time */}
        {totalSegundos > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tempo total:</span>
              <span className="font-mono font-medium">{formatTime(totalSegundos)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
