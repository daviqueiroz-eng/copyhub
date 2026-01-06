import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoteiroTempo, useUpsertRoteiroTempo } from "@/hooks/useRoteiroTempo";
import { cn } from "@/lib/utils";

interface RoteiroTimerProps {
  roteiroId: string | null;
}

export const RoteiroTimer = ({ roteiroId }: RoteiroTimerProps) => {
  const [segundos, setSegundos] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinalizado, setIsFinalizado] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  const { data: tempoSalvo, isLoading } = useRoteiroTempo(roteiroId);
  const upsertTempo = useUpsertRoteiroTempo();

  // Carregar tempo salvo
  useEffect(() => {
    if (tempoSalvo) {
      setSegundos(tempoSalvo.tempo_segundos);
      setIsFinalizado(tempoSalvo.finalizado);
    } else {
      setSegundos(0);
      setIsFinalizado(false);
    }
    setIsRunning(false);
  }, [tempoSalvo]);

  // Timer interval
  useEffect(() => {
    if (isRunning && !isFinalizado) {
      intervalRef.current = setInterval(() => {
        setSegundos((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isFinalizado]);

  // Auto-save a cada 30 segundos enquanto roda
  useEffect(() => {
    if (isRunning && roteiroId && segundos - lastSaveRef.current >= 30) {
      lastSaveRef.current = segundos;
      upsertTempo.mutate({
        roteiroId,
        tempoSegundos: segundos,
        finalizado: false,
      });
    }
  }, [segundos, isRunning, roteiroId, upsertTempo]);

  const formatTime = (totalSegundos: number) => {
    const hrs = Math.floor(totalSegundos / 3600);
    const mins = Math.floor((totalSegundos % 3600) / 60);
    const secs = totalSegundos % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (isFinalizado) return;
    
    if (isRunning && roteiroId) {
      // Pausando - salvar tempo atual
      upsertTempo.mutate({
        roteiroId,
        tempoSegundos: segundos,
        finalizado: false,
      });
    }
    
    setIsRunning(!isRunning);
  };

  const handleFinalizar = () => {
    if (!roteiroId) return;
    
    setIsRunning(false);
    setIsFinalizado(true);
    
    upsertTempo.mutate({
      roteiroId,
      tempoSegundos: segundos,
      finalizado: true,
    });
  };

  if (!roteiroId) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="h-4 w-4" />
        <span className="font-mono">--:--</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="font-mono">--:--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Timer display */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-mono transition-colors",
          isFinalizado
            ? "bg-green-500/10 text-green-600 dark:text-green-400"
            : isRunning
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>{formatTime(segundos)}</span>
      </div>

      {/* Controls */}
      {!isFinalizado && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePlayPause}
          >
            {isRunning ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>

          {segundos > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleFinalizar}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}

      {isFinalizado && (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          ✓
        </span>
      )}
    </div>
  );
};
