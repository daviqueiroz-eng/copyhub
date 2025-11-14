import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PRESETS = {
  trabalho: 25 * 60,
  pausaCurta: 5 * 60,
  pausaLonga: 15 * 60,
};

export const PomodoroTimer = () => {
  const [modo, setModo] = useState<"trabalho" | "pausaCurta" | "pausaLonga">("trabalho");
  const [segundosRestantes, setSegundosRestantes] = useState(PRESETS.trabalho);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSegundos = PRESETS[modo];
  const progresso = ((totalSegundos - segundosRestantes) / totalSegundos) * 100;

  useEffect(() => {
    if (isRunning && segundosRestantes > 0) {
      intervalRef.current = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Pomodoro concluído!", {
                body: `Sessão de ${modo === "trabalho" ? "trabalho" : modo === "pausaCurta" ? "pausa curta" : "pausa longa"} finalizada!`,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, segundosRestantes, modo]);

  const formatTime = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleModoChange = (novoModo: typeof modo) => {
    setModo(novoModo);
    setSegundosRestantes(PRESETS[novoModo]);
    setIsRunning(false);
  };

  const handleReset = () => {
    setSegundosRestantes(PRESETS[modo]);
    setIsRunning(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={modo === "trabalho" ? "default" : "outline"}
            onClick={() => handleModoChange("trabalho")}
          >
            Trabalho
          </Button>
          <Button
            size="sm"
            variant={modo === "pausaCurta" ? "default" : "outline"}
            onClick={() => handleModoChange("pausaCurta")}
          >
            Pausa Curta
          </Button>
          <Button
            size="sm"
            variant={modo === "pausaLonga" ? "default" : "outline"}
            onClick={() => handleModoChange("pausaLonga")}
          >
            Pausa Longa
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="text-6xl font-bold font-mono">
            {formatTime(segundosRestantes)}
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        <div className="flex justify-center gap-3">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className="w-32"
          >
            {isRunning ? (
              <>
                <Pause className="mr-2 h-5 w-5" /> Pausar
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> Iniciar
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
