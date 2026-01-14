import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, PartyPopper } from "lucide-react";
import { useCreateRoteiroFeedback } from "@/hooks/useRoteiroFeedback";
import { TimersRecord } from "./RoteiroChecklist";

interface RoteiroFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentoradoId: string;
  mentoradoNome: string;
  guiaNumero: number;
  timers: TimersRecord | null;
}

export const RoteiroFeedbackDialog = ({
  open,
  onOpenChange,
  mentoradoId,
  mentoradoNome,
  guiaNumero,
  timers,
}: RoteiroFeedbackDialogProps) => {
  const [tempoHeadlines, setTempoHeadlines] = useState(0);
  const [tempoRoteiros, setTempoRoteiros] = useState(0);
  const [tempoRevisao, setTempoRevisao] = useState(0);
  const [dificuldades, setDificuldades] = useState("");

  const createFeedback = useCreateRoteiroFeedback();

  // Preencher com valores dos timers (convertendo segundos para minutos)
  useEffect(() => {
    if (timers && open) {
      setTempoHeadlines(Math.round((timers.headlines?.segundos || 0) / 60));
      setTempoRoteiros(Math.round((timers.roteiros?.segundos || 0) / 60));
      setTempoRevisao(Math.round((timers.revisar?.segundos || 0) / 60));
      setDificuldades("");
    }
  }, [timers, open]);

  const handleSubmit = async () => {
    await createFeedback.mutateAsync({
      mentorado_id: mentoradoId,
      guia_numero: guiaNumero,
      tempo_headlines: tempoHeadlines,
      tempo_roteiros: tempoRoteiros,
      tempo_revisao: tempoRevisao,
      dificuldades: dificuldades.trim() || undefined,
    });
    onOpenChange(false);
  };

  const tempoTotal = tempoHeadlines + tempoRoteiros + tempoRevisao;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-yellow-500" />
            Parabéns! Checklist completo!
          </DialogTitle>
          <DialogDescription>
            Registre o tempo gasto em cada etapa para {mentoradoNome} - Guia {guiaNumero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Quanto tempo levou? (minutos)
            </Label>

            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm text-muted-foreground">Headlines:</Label>
                <Input
                  type="number"
                  min={0}
                  value={tempoHeadlines}
                  onChange={(e) => setTempoHeadlines(Number(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>

              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm text-muted-foreground">Roteiros:</Label>
                <Input
                  type="number"
                  min={0}
                  value={tempoRoteiros}
                  onChange={(e) => setTempoRoteiros(Number(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>

              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm text-muted-foreground">Revisão:</Label>
                <Input
                  type="number"
                  min={0}
                  value={tempoRevisao}
                  onChange={(e) => setTempoRevisao(Number(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>

              {tempoTotal > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Label className="w-24 text-sm font-medium">Total:</Label>
                  <span className="font-semibold text-primary">{tempoTotal} min</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Maiores dificuldades encontradas:</Label>
            <Textarea
              placeholder="Descreva as dificuldades encontradas durante o processo (opcional)"
              value={dificuldades}
              onChange={(e) => setDificuldades(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Pular
          </Button>
          <Button onClick={handleSubmit} disabled={createFeedback.isPending}>
            {createFeedback.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
