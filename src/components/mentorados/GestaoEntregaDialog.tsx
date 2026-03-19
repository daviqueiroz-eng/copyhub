import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { GestaoEntrega, useUpdateGestaoEntrega } from "@/hooks/useGestaoEntregas";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useAuth";
import { useGestaoEntregasStatus, useCreateGestaoEntregaStatus } from "@/hooks/useGestaoEntregasStatus";
import { useGestaoEntregasConfig, useUpsertGestaoEntregaConfig } from "@/hooks/useGestaoEntregasConfig";
import { addBusinessDays } from "@/lib/dateUtils";
import { useCreateGestaoEntrega } from "@/hooks/useGestaoEntregas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega?: GestaoEntrega | null;
}

export const GestaoEntregaDialog = ({ open, onOpenChange, entrega }: Props) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: statusOptions = [] } = useGestaoEntregasStatus();
  const createStatus = useCreateGestaoEntregaStatus();
  const updateEntrega = useUpdateGestaoEntrega();
  const createEntrega = useCreateGestaoEntrega();
  const { data: configs = [] } = useGestaoEntregasConfig();
  const upsertConfig = useUpsertGestaoEntregaConfig();

  const [mentor, setMentor] = useState("");
  const [levaAtual, setLevaAtual] = useState("1");
  const [prazo, setPrazo] = useState<Date | undefined>();
  const [diasUteis, setDiasUteis] = useState("10");
  const [roteirosPorLeva, setRoteirosPorLeva] = useState("25");
  const [levasTotais, setLevasTotais] = useState("6");
  const [status, setStatus] = useState("Em andamento");
  const [observacao, setObservacao] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showNewStatus, setShowNewStatus] = useState(false);

  useEffect(() => {
    if (entrega) {
      setMentor(entrega.mentor || entrega.mentorado?.mentor || "");
      setLevaAtual(String(entrega.leva || 1));
      setPrazo(entrega.prazo ? new Date(entrega.prazo + "T12:00:00") : undefined);
      setDiasUteis(String(entrega.dias_uteis || 10));
      setRoteirosPorLeva(String(entrega.roteiros_por_leva || 25));
      setLevasTotais(String(entrega.levas_totais || 6));
      setStatus(entrega.status || "Em andamento");
      setObservacao(entrega.observacao || "");
    }
  }, [entrega, open]);

  const handleAddStatus = () => {
    const trimmed = newStatus.trim();
    if (trimmed && !statusOptions.includes(trimmed)) {
      createStatus.mutate(trimmed);
      setStatus(trimmed);
      setNewStatus("");
      setShowNewStatus(false);
    }
  };

  const handleSave = () => {
    if (!user || !prazo || !entrega) return;

    updateEntrega.mutate({
      id: entrega.id,
      mentor: mentor || null,
      leva: parseInt(levaAtual) || 1,
      prazo: format(prazo, "yyyy-MM-dd"),
      dias_uteis: parseInt(diasUteis) || 10,
      roteiros_por_leva: parseInt(roteirosPorLeva) || 25,
      levas_totais: parseInt(levasTotais) || 6,
      status,
      observacao: observacao || null,
    }, {
      onSuccess: () => {
        // Update config too
        upsertConfig.mutate({
          user_id: user.id,
          mentorado_id: entrega.mentorado_id,
          mentor: mentor || null,
          dias_uteis: parseInt(diasUteis) || 10,
          roteiros_por_leva: parseInt(roteirosPorLeva) || 25,
          levas_totais: parseInt(levasTotais) || 6,
          status,
          leva_atual: parseInt(levaAtual) || 1,
        });
        onOpenChange(false);
      },
    });
  };

  const handleFinalize = () => {
    if (!entrega || !user) return;
    const today = new Date();
    const nextPrazo = addBusinessDays(today, parseInt(diasUteis) || 10);
    const nextLeva = (parseInt(levaAtual) || 1) + 1;

    updateEntrega.mutate({
      id: entrega.id,
      status: "Finalizado",
      data_entrega: format(today, "yyyy-MM-dd"),
    }, {
      onSuccess: () => {
        createEntrega.mutate({
          mentorado_id: entrega.mentorado_id,
          user_id: user.id,
          leva: nextLeva,
          prazo: format(nextPrazo, "yyyy-MM-dd"),
          dias_uteis: parseInt(diasUteis) || 10,
          status: "Em andamento",
          responsavel_id: entrega.responsavel_id,
          mentor: mentor || null,
          roteiros_por_leva: parseInt(roteirosPorLeva) || null,
          levas_totais: parseInt(levasTotais) || null,
        });
        upsertConfig.mutate({
          user_id: user.id,
          mentorado_id: entrega.mentorado_id,
          mentor: mentor || null,
          dias_uteis: parseInt(diasUteis) || 10,
          roteiros_por_leva: parseInt(roteirosPorLeva) || 25,
          levas_totais: parseInt(levasTotais) || 6,
          status: "Em andamento",
          leva_atual: nextLeva,
        });
        onOpenChange(false);
      },
    });
  };

  const mentoradoNome = entrega?.mentorado?.nome || "—";
  const copyName = profile?.nome || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Entrega — {mentoradoNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Copy (logged-in user) + Mentor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Copy</Label>
              <Input value={copyName} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Mentor</Label>
              <Input
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
                placeholder="Nome do mentor"
              />
            </div>
          </div>

          {/* Leva + Entrega + Dias úteis */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Leva atual</Label>
              <Input
                type="number"
                value={levaAtual}
                onChange={(e) => setLevaAtual(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Entrega</Label>
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
              <Label>Dias úteis</Label>
              <Input
                type="number"
                value={diasUteis}
                onChange={(e) => setDiasUteis(e.target.value)}
                min={1}
              />
            </div>
          </div>

          {/* Roteiros/leva + Levas totais + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Roteiros/leva</Label>
              <Input
                type="number"
                value={roteirosPorLeva}
                onChange={(e) => setRoteirosPorLeva(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Levas totais</Label>
              <Input
                type="number"
                value={levasTotais}
                onChange={(e) => setLevasTotais(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-1">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowNewStatus(!showNewStatus)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showNewStatus && (
                <div className="flex gap-1 mt-1">
                  <Input
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="Novo status..."
                    className="text-xs h-8"
                    onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
                  />
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddStatus}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Notas..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {entrega && entrega.status !== "Finalizado" && (
            <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={handleFinalize}>
              <Check className="h-4 w-4 mr-1" /> Finalizar + Próxima
            </Button>
          )}
          <Button onClick={handleSave} className="gap-1.5">
            <Check className="h-4 w-4" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
