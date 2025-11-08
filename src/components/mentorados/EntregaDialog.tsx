import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useEntregas, useCreateEntrega, useUpdateEntrega } from "@/hooks/useEntregas";
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

  const { data: entregas } = useEntregas(mentorado?.id);
  const createEntrega = useCreateEntrega();
  const updateEntrega = useUpdateEntrega();

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
