import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoteiroTimerProps {
  className?: string;
}

export const RoteiroTimer = ({ className }: RoteiroTimerProps) => {
  const [segundos, setSegundos] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinalizado, setIsFinalizado] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("roteiro_timer");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSegundos(data.segundos || 0);
        setIsFinalizado(data.finalizado || false);
      } catch {
        // ignore
      }
    }
  }, []);

  // Salvar no localStorage quando muda
  useEffect(() => {
    localStorage.setItem("roteiro_timer", JSON.stringify({
      segundos,
      finalizado: isFinalizado,
    }));
  }, [segundos, isFinalizado]);

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
    setIsRunning(!isRunning);
  };

  const handleFinalizar = () => {
    setIsRunning(false);
    setIsFinalizado(true);
  };

  const handleResetar = () => {
    setIsRunning(false);
    setIsFinalizado(false);
    setSegundos(0);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Timer display */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-mono border transition-colors",
          isFinalizado
            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
            : isRunning
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-background text-muted-foreground border-border"
        )}
      >
        <Clock className="h-4 w-4" />
        <span className="min-w-[52px] text-center">{formatTime(segundos)}</span>
        {isFinalizado && <span className="text-xs">✓</span>}
      </div>

      {/* Play/Pause */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={handlePlayPause}
        disabled={isFinalizado}
        title={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Finalizar */}
      {segundos > 0 && !isFinalizado && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleFinalizar}
          title="Finalizar"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}

      {/* Resetar */}
      {(segundos > 0 || isFinalizado) && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleResetar}
          title="Resetar"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
