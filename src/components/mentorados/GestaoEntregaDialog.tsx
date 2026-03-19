import { useState, useEffect } from "react";
import { format, addDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GestaoEntrega, useCreateGestaoEntrega, useUpdateGestaoEntrega } from "@/hooks/useGestaoEntregas";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorados } from "@/hooks/useMentorados";
import { addBusinessDays } from "@/lib/dateUtils";

const STATUS_OPTIONS = ["Em andamento", "Finalizado", "Atrasado", "Pausado"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega?: GestaoEntrega | null;
  onFinalize?: (entrega: GestaoEntrega) => void;
}

export const GestaoEntregaDialog = ({ open, onOpenChange, entrega, onFinalize }: Props) => {
  const { user } = useAuth();
  const { data: mentorados = [] } = useMentorados();
  const createEntrega = useCreateGestaoEntrega();
  const updateEntrega = useUpdateGestaoEntrega();

  const [mentoradoId, setMentoradoId] = useState("");
  const [leva, setLeva] = useState("");
  const [prazo, setPrazo] = useState<Date | undefined>();
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>();
  const [diasUteis, setDiasUteis] = useState("10");
  const [status, setStatus] = useState("Em andamento");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (entrega) {
      setMentoradoId(entrega.mentorado_id);
      setLeva(entrega.leva?.toString() || "");
      setPrazo(entrega.prazo ? new Date(entrega.prazo + "T12:00:00") : undefined);
      setDataEntrega(entrega.data_entrega ? new Date(entrega.data_entrega + "T12:00:00") : undefined);
      setDiasUteis(entrega.dias_uteis?.toString() || "10");
      setStatus(entrega.status);
      setObservacao(entrega.observacao || "");
    } else {
      setMentoradoId("");
      setLeva("");
      setPrazo(undefined);
      setDataEntrega(undefined);
      setDiasUteis("10");
      setStatus("Em andamento");
      setObservacao("");
    }
  }, [entrega, open]);

  const handleSave = () => {
    if (!user || !prazo || !mentoradoId) return;

    const payload = {
      mentorado_id: mentoradoId,
      user_id: user.id,
      leva: leva ? parseInt(leva) : null,
      prazo: format(prazo, "yyyy-MM-dd"),
      data_entrega: dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : null,
      dias_uteis: parseInt(diasUteis) || 10,
      status,
      observacao: observacao || null,
    };

    if (entrega) {
      updateEntrega.mutate({ id: entrega.id, ...payload }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createEntrega.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const handleFinalize = () => {
    if (!entrega || !user) return;
    const today = new Date();
    const nextPrazo = addBusinessDays(today, parseInt(diasUteis) || 10);

    updateEntrega.mutate({
      id: entrega.id,
      status: "Finalizado",
      data_entrega: format(today, "yyyy-MM-dd"),
    }, {
      onSuccess: () => {
        // Create next entrega
        createEntrega.mutate({
          mentorado_id: entrega.mentorado_id,
          user_id: user.id,
          leva: (entrega.leva || 0) + 1,
          prazo: format(nextPrazo, "yyyy-MM-dd"),
          dias_uteis: parseInt(diasUteis) || 10,
          status: "Em andamento",
          responsavel_id: entrega.responsavel_id,
        });
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entrega ? "Editar Entrega" : "Nova Entrega"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Mentorado</Label>
            <Select value={mentoradoId} onValueChange={setMentoradoId} disabled={!!entrega}>
              <SelectTrigger><SelectValue placeholder="Selecionar mentorado" /></SelectTrigger>
              <SelectContent>
                {mentorados.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Leva</Label>
              <Input type="number" value={leva} onChange={(e) => setLeva(e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label>Dias Úteis</Label>
              <Input type="number" value={diasUteis} onChange={(e) => setDiasUteis(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !prazo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prazo ? format(prazo, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={prazo} onSelect={setPrazo} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataEntrega && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataEntrega ? format(dataEntrega, "dd/MM/yyyy") : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataEntrega} onSelect={setDataEntrega} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Notas..." rows={2} />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {entrega && entrega.status !== "Finalizado" && (
            <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={handleFinalize}>
              <Check className="h-4 w-4 mr-1" /> Finalizar + Próxima
            </Button>
          )}
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
