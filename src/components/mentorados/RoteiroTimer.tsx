import { Play, Pause, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimersRecord } from "./RoteiroChecklist";

interface RoteiroTimerProps {
  className?: string;
  timers: TimersRecord;
  activeTimerId: string | null;
  onPlayPause: () => void;
}

export const RoteiroTimer = ({ 
  className, 
  timers, 
  activeTimerId,
  onPlayPause,
}: RoteiroTimerProps) => {
  // Soma total de todos os timers
  const totalSegundos = Object.values(timers).reduce((acc, t) => acc + t.segundos, 0);
  
  // Verificar se algum timer está rodando
  const isAnyRunning = Object.values(timers).some(t => t.isRunning);
  
  // Verificar se todos estão finalizados
  const allFinalized = Object.values(timers).every(t => t.finalizado);

  const formatTime = (totalSegundos: number) => {
    const hrs = Math.floor(totalSegundos / 3600);
    const mins = Math.floor((totalSegundos % 3600) / 60);
    const secs = totalSegundos % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Timer display */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-mono border transition-colors",
          allFinalized
            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
            : isAnyRunning
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-background text-muted-foreground border-border"
        )}
      >
        <Clock className="h-4 w-4" />
        <span className="min-w-[52px] text-center">{formatTime(totalSegundos)}</span>
        {allFinalized && <span className="text-xs">✓</span>}
      </div>

      {/* Play/Pause */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={onPlayPause}
        title={isAnyRunning ? "Pausar" : "Iniciar"}
      >
        {isAnyRunning ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
