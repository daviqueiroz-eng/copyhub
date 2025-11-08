import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useEntregas, useCreateEntrega, useUpdateEntrega } from "@/hooks/useEntregas";
import { useReplicateEntregas } from "@/hooks/useReplicateEntregas";
import { Mentorado } from "@/hooks/useMentorados";

interface EntregaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorado: Mentorado | null;
  numeroLeva: number;
}

export function EntregaDialog({
  open,
  onOpenChange,
  mentorado,
  numeroLeva,
}: EntregaDialogProps) {
  const [date, setDate] = useState<Date>();
  const [concluida, setConcluida] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [replicarParaTodasLevas, setReplicarParaTodasLevas] = useState(false);
  const [intervaloDias, setIntervaloDias] = useState(7);

  const { data: entregas } = useEntregas(mentorado?.id);
  const createEntrega = useCreateEntrega();
  const updateEntrega = useUpdateEntrega();
  const replicateEntregas = useReplicateEntregas();

  const entregaAtual = entregas?.find((e) => e.numero_leva === numeroLeva);

  useEffect(() => {
    if (entregaAtual) {
      setDate(entregaAtual.data_entrega ? new Date(entregaAtual.data_entrega) : undefined);
      setConcluida(entregaAtual.concluida);
      setObservacoes(entregaAtual.observacoes || "");
    } else {
      setDate(undefined);
      setConcluida(false);
      setObservacoes("");
    }
  }, [entregaAtual, open]);

  const handleSave = () => {
    if (!mentorado) return;

    // Se for 1ª leva e a opção de replicar estiver marcada
    if (numeroLeva === 1 && replicarParaTodasLevas && date) {
      replicateEntregas.mutate({
        mentoradoId: mentorado.id,
        dataInicial: date,
        intervaloDias,
      });
      onOpenChange(false);
      return;
    }

    // Caso contrário, salvar apenas a entrega atual
    const entregaData = {
      mentorado_id: mentorado.id,
      numero_leva: numeroLeva,
      data_entrega: date ? format(date, "yyyy-MM-dd") : null,
      concluida,
      observacoes: observacoes || null,
    };

    if (entregaAtual) {
      updateEntrega.mutate(
        { id: entregaAtual.id, ...entregaData },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createEntrega.mutate(entregaData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  // Calcular preview das datas
  const getPreviewDates = () => {
    if (!date || !replicarParaTodasLevas) return [];
    
    return [2, 3, 4, 5, 6].map((leva) => ({
      leva,
      data: addDays(date, intervaloDias * (leva - 1)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mentorado?.nome} - {numeroLeva}ª Leva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="concluida"
              checked={concluida}
              onCheckedChange={(checked) => setConcluida(checked as boolean)}
            />
            <Label
              htmlFor="concluida"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Marcar como concluída
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre esta entrega..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Opção de replicar para todas as levas (apenas na 1ª leva) */}
          {numeroLeva === 1 && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replicar"
                  checked={replicarParaTodasLevas}
                  onCheckedChange={(checked) => setReplicarParaTodasLevas(checked as boolean)}
                />
                <Label htmlFor="replicar" className="font-semibold cursor-pointer">
                  Definir prazo para todas as levas automaticamente
                </Label>
              </div>

              {replicarParaTodasLevas && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="intervalo">Dias entre cada leva</Label>
                    <Input
                      id="intervalo"
                      type="number"
                      min={1}
                      value={intervaloDias}
                      onChange={(e) => setIntervaloDias(Number(e.target.value))}
                      className="w-32"
                    />
                  </div>

                  {date && (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Preview das datas:</p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>1ª leva: {format(date, "dd/MM/yyyy", { locale: ptBR })}</p>
                        {getPreviewDates().map(({ leva, data }) => (
                          <p key={leva}>
                            {leva}ª leva: {format(data, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
