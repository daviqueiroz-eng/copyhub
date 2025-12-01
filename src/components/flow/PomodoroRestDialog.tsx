import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";

interface PomodoroRestDialogProps {
  open: boolean;
  onClose: () => void;
  onStartRest: (minutos: number) => void;
  onSkip: () => void;
  pausaCurtaCustomizada?: number | null;
}

export function PomodoroRestDialog({
  open,
  onClose,
  onStartRest,
  onSkip,
  pausaCurtaCustomizada,
}: PomodoroRestDialogProps) {
  const tempoDescanso = pausaCurtaCustomizada ? Math.floor(pausaCurtaCustomizada / 60) : 5;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Você completou um Pomo! 🍅
          </DialogTitle>
          <DialogDescription className="text-center text-lg pt-2">
            Descansar por {tempoDescanso} minutos?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-6">
          {/* Botão Relaxar (verde, principal) */}
          <Button
            onClick={() => onStartRest(tempoDescanso)}
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Coffee className="mr-2 h-5 w-5" />
            Relaxar
          </Button>

          {/* Botão Pular (secundário) */}
          <Button
            onClick={onSkip}
            variant="secondary"
            className="w-full h-12 text-lg"
            size="lg"
          >
            Pular
          </Button>

          {/* Botão Sair (outline) */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12 text-lg"
            size="lg"
          >
            Sair
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
