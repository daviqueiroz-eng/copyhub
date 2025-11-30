import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee } from "lucide-react";

interface PomodoroRestDialogProps {
  open: boolean;
  onClose: () => void;
  onStartRest: (minutos: number) => void;
  pausaCurtaCustomizada?: number | null;
}

export function PomodoroRestDialog({
  open,
  onClose,
  onStartRest,
  pausaCurtaCustomizada,
}: PomodoroRestDialogProps) {
  const tempoDescanso = pausaCurtaCustomizada ? Math.floor(pausaCurtaCustomizada / 60) : 5;
  const [customMinutes, setCustomMinutes] = useState<string>(String(tempoDescanso));

  const handleQuickRest = () => {
    onStartRest(tempoDescanso);
  };

  const handleCustomRest = () => {
    const minutos = parseInt(customMinutes);
    if (minutos > 0 && minutos <= 60) {
      onStartRest(minutos);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            <DialogTitle>Sessão Concluída!</DialogTitle>
          </div>
          <DialogDescription>
            Parabéns! Você completou uma sessão de foco. Quer fazer uma pausa?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            onClick={handleQuickRest}
            className="w-full"
            size="lg"
          >
            Descansar {tempoDescanso} minutos
          </Button>

          <div className="space-y-2">
            <Label htmlFor="custom-minutes">Ou escolha o tempo de descanso:</Label>
            <div className="flex gap-2">
              <Input
                id="custom-minutes"
                type="number"
                min="1"
                max="60"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="10"
              />
              <Button onClick={handleCustomRest} variant="secondary">
                Descansar {customMinutes} min
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Continuar trabalhando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
