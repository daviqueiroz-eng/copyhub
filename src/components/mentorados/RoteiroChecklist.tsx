import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
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
  onTimersChange: (timers: TimersRecord | ((prev: TimersRecord) => TimersRecord)) => void;
  activeTimerId: string | null;
  onActiveTimerChange: (id: string | null) => void;
  timersLoaded: boolean;
  onComplete?: (timers: TimersRecord) => void;
}

export const RoteiroChecklist = ({ 
  mentoradoId, 
  guiaNumero,
  timers,
  onTimersChange,
  activeTimerId,
  onActiveTimerChange,
  timersLoaded,
  onComplete,
}: RoteiroChecklistProps) => {
  const checklistStorageKey = `roteiro-checklist-${mentoradoId}-${guiaNumero}`;
  
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [checklistLoaded, setChecklistLoaded] = useState(false);
  const intervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({});
  const prevGuiaRef = useRef<number | null>(null);

  // Carregar checklist quando mudar de guia
  useEffect(() => {
    setChecklistLoaded(false); // Indicar que está carregando
    
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
    
    // Atualizar referência da guia atual APÓS carregar
    prevGuiaRef.current = guiaNumero;
    setChecklistLoaded(true); // Carregamento concluído
  }, [checklistStorageKey, guiaNumero]);

  // Salvar checklist - SÓ quando já carregou
  useEffect(() => {
    if (!checklistLoaded) return; // Não salvar enquanto não carregou
    
    localStorage.setItem(checklistStorageKey, JSON.stringify(items));
  }, [items, checklistStorageKey, checklistLoaded]);

  // Salvar timers no localStorage - SÓ quando já carregou E guia está sincronizada
  useEffect(() => {
    // Não salvar se:
    // 1. Os timers ainda não foram carregados
    // 2. O guiaNumero mudou mas os dados ainda não foram carregados (dessincronizado)
    if (!timersLoaded) return;
    if (prevGuiaRef.current !== guiaNumero) return;
    
    Object.entries(timers).forEach(([id, timer]) => {
      const timerKey = `roteiro-timer-${mentoradoId}-${guiaNumero}-${id}`;
      localStorage.setItem(timerKey, JSON.stringify({
        segundos: timer.segundos,
        finalizado: timer.finalizado,
      }));
    });
  }, [timers, mentoradoId, guiaNumero, timersLoaded]);

  // Gerenciar intervals dos timers - usando functional update para evitar stale closures
  useEffect(() => {
    Object.entries(timers).forEach(([id, timer]) => {
      if (timer.isRunning && !timer.finalizado) {
        if (!intervalsRef.current[id]) {
          intervalsRef.current[id] = setInterval(() => {
            onTimersChange(prevTimers => ({
              ...prevTimers,
              [id]: { ...prevTimers[id], segundos: prevTimers[id].segundos + 1 }
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
    // NÃO limpar no cleanup - apenas no unmount final
  }, [timers, onTimersChange]);

  // Cleanup separado para unmount do componente
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      intervalsRef.current = {};
    };
  }, []);

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
    setItems(prev => {
      const newItems = prev.map(item => {
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
      });
      
      // APÓS atualizar items, verificar se TODOS estão marcados
      const allCompleted = newItems.every(item => item.checked);
      if (allCompleted) {
        // Usar setTimeout para garantir que o estado foi atualizado
        setTimeout(() => {
          const celebratedKey = `checklist-completed-${mentoradoId}-${guiaNumero}`;
          const alreadyCelebrated = localStorage.getItem(celebratedKey);
          
          if (!alreadyCelebrated) {
            localStorage.setItem(celebratedKey, "true");
            const randomMsg = mensagensConclusao[Math.floor(Math.random() * mensagensConclusao.length)];
            toast({ title: randomMsg });
            
            // Chamar callback para abrir dialog de feedback
            onComplete?.(timers);
          }
        }, 0);
      }
      
      return newItems;
    });
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

  const handleTimerFinalize = (id: string) => {
    const timer = timers[id];
    if (!timer) return;
    
    onTimersChange({
      ...timers,
      [id]: { ...timer, isRunning: false, finalizado: true }
    });
    
    if (activeTimerId === id) {
      onActiveTimerChange(null);
    }
    
    // Marcar checkbox como concluído e verificar se todos estão completos
    setItems(prevItems => {
      const newItems = prevItems.map(item => 
        item.id === id ? { ...item, checked: true } : item
      );
      
      // Verificar se todos estão completos APÓS esta marcação
      const allCompleted = newItems.every(item => item.checked);
      if (allCompleted) {
        setTimeout(() => {
          const celebratedKey = `checklist-completed-${mentoradoId}-${guiaNumero}`;
          const alreadyCelebrated = localStorage.getItem(celebratedKey);
          
          if (!alreadyCelebrated) {
            localStorage.setItem(celebratedKey, "true");
            const randomMsg = mensagensConclusao[Math.floor(Math.random() * mensagensConclusao.length)];
            toast({ title: randomMsg });
            onComplete?.(timers);
          }
        }, 0);
      }
      
      return newItems;
    });
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
                
                {/* Timer controls inline para itens com timing */}
                {item.hasTiming && timer && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Play/Pause */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        timer.isRunning && "text-primary"
                      )}
                      onClick={() => handleTimerToggle(item.id)}
                      title={timer.finalizado ? "Retomar" : timer.isRunning ? "Pausar" : "Iniciar"}
                    >
                      {timer.isRunning ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    
                    {/* Finalizar - mostra quando tem tempo e não está finalizado */}
                    {timer.segundos > 0 && !timer.finalizado && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        onClick={() => handleTimerFinalize(item.id)}
                        title="Finalizar"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    
                    {/* Reiniciar - mostra quando tem tempo */}
                    {timer.segundos > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={() => handleTimerReset(item.id)}
                        title="Reiniciar"
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