import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addBusinessDays } from "@/lib/dateUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentoradoNome: string;
  diasUteis: number;
  nextLeva: number;
  onConfirm: (date: Date) => void;
}

export function ProximaEntregaPreviewDialog({
  open, onOpenChange, mentoradoNome, diasUteis, nextLeva, onConfirm,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open) {
      const previewDate = addBusinessDays(new Date(), diasUteis);
      setSelectedDate(previewDate);
    }
  }, [open, diasUteis]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Próxima entrega — {mentoradoNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            A leva <strong>{nextLeva}</strong> será criada para a data abaixo.
            Ajuste se necessário:
          </p>

          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => selectedDate && onConfirm(selectedDate)}
            disabled={!selectedDate}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" /> Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
