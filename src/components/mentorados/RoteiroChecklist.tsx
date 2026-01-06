import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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

export interface TimerState {
  segundos: number;
  isRunning: boolean;
  finalizado: boolean;
}

export type TimersRecord = Record<string, TimerState>;

interface RoteiroChecklistProps {
  mentoradoId: string;
  guiaNumero: number;
  timers: TimersRecord;
  onTimersChange: (timers: TimersRecord) => void;
  activeTimerId: string | null;
  onActiveTimerChange: (id: string | null) => void;
}

export const RoteiroChecklist = ({ 
  mentoradoId, 
  guiaNumero,
  timers,
  onTimersChange,
  activeTimerId,
  onActiveTimerChange,
}: RoteiroChecklistProps) => {
  const checklistStorageKey = `roteiro-checklist-${mentoradoId}-${guiaNumero}`;
  
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
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

  // Salvar checklist
  useEffect(() => {
    localStorage.setItem(checklistStorageKey, JSON.stringify(items));
  }, [items, checklistStorageKey]);

  // Salvar timers no localStorage
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
            onTimersChange({
              ...timers,
              [id]: { ...timers[id], segundos: timers[id].segundos + 1 }
            });
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
  }, [timers, onTimersChange]);

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
          if (newChecked && item.hasTiming && timers[id]) {
            onTimersChange({
              ...timers,
              [id]: { ...timers[id], isRunning: false, finalizado: true }
            });
            if (activeTimerId === id) {
              onActiveTimerChange(null);
            }
          }
          
          return { ...item, checked: newChecked };
        }
        return item;
      })
    );
  };

  const handleTimerToggle = (id: string) => {
    const timer = timers[id];
    if (!timer) return;

    if (timer.finalizado) {
      // Retomar - pausar outros e ativar este
      const newTimers = { ...timers };
      Object.keys(newTimers).forEach(key => {
        if (key !== id && newTimers[key].isRunning) {
          newTimers[key] = { ...newTimers[key], isRunning: false };
        }
      });
      newTimers[id] = { ...timer, finalizado: false, isRunning: true };
      onTimersChange(newTimers);
      onActiveTimerChange(id);
    } else if (timer.isRunning) {
      // Pausar
      onTimersChange({
        ...timers,
        [id]: { ...timer, isRunning: false }
      });
      onActiveTimerChange(null);
    } else {
      // Iniciar - pausar outros primeiro
      const newTimers = { ...timers };
      Object.keys(newTimers).forEach(key => {
        if (key !== id && newTimers[key].isRunning) {
          newTimers[key] = { ...newTimers[key], isRunning: false };
        }
      });
      newTimers[id] = { ...timer, isRunning: true };
      onTimersChange(newTimers);
      onActiveTimerChange(id);
    }
  };

  const handleTimerReset = (id: string) => {
    onTimersChange({
      ...timers,
      [id]: { segundos: 0, isRunning: false, finalizado: false }
    });
    if (activeTimerId === id) {
      onActiveTimerChange(null);
    }
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

  // Mensagens de conclusão do checklist
  const mensagensConclusao = [
    "🎉 Checklist completo! Parabéns pelo trabalho!",
    "🏆 Todos os itens concluídos! Excelente trabalho!",
    "✨ Missão cumprida! Você finalizou tudo!",
    "🚀 100% do checklist! Você arrasou!",
  ];

  // Efeito para mensagem de conclusão do checklist
  useEffect(() => {
    if (completedCount !== items.length) return;
    
    const celebratedKey = `checklist-completed-${mentoradoId}-${guiaNumero}`;
    const alreadyCelebrated = localStorage.getItem(celebratedKey);
    
    if (!alreadyCelebrated) {
      localStorage.setItem(celebratedKey, "true");
      const randomMsg = mensagensConclusao[Math.floor(Math.random() * mensagensConclusao.length)];
      toast({ title: randomMsg });
    }
  }, [completedCount, items.length, mentoradoId, guiaNumero]);

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
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={() => handleToggle(item.id)}
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
                
                {/* Play/Pause button inline para itens com timing */}
                {item.hasTiming && timer && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 shrink-0",
                      timer.isRunning && "text-primary"
                    )}
                    onClick={() => handleTimerToggle(item.id)}
                    title={timer.finalizado ? "Retomar" : timer.isRunning ? "Pausar" : "Iniciar"}
                  >
                    {timer.isRunning ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Tempos individuais e total */}
        {totalSegundos > 0 && (
          <div className="mt-4 pt-3 border-t space-y-1.5">
            {Object.entries(timers).map(([id, timer]) => {
              if (timer.segundos === 0) return null;
              const label = id === "headlines" ? "Headlines" : id === "roteiros" ? "Roteiros" : "Revisar";
              return (
                <div key={id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}:</span>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "font-mono",
                      timer.finalizado && "text-green-600 dark:text-green-400"
                    )}>
                      {formatTime(timer.segundos)}
                    </span>
                    {timer.segundos > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleTimerReset(id)}
                        title="Resetar"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-sm font-medium pt-1 border-t">
              <span>Total:</span>
              <span className="font-mono">{formatTime(totalSegundos)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};