import { useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GestaoEntregaConfig } from "@/hooks/useGestaoEntregasConfig";
import { useGestaoEntregasStatus, useCreateGestaoEntregaStatus } from "@/hooks/useGestaoEntregasStatus";
import { useProfile } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentoradoNome: string;
  existingConfig: GestaoEntregaConfig | null;
  prazoDate: string; // yyyy-MM-dd
  onConfirm: (config: {
    mentor: string;
    leva_atual: number;
    dias_uteis: number;
    roteiros_por_leva: number;
    levas_totais: number;
    status: string;
    observacao: string;
  }) => void;
}

export const FirstEntregaConfigDialog = ({
  open, onOpenChange, mentoradoNome, existingConfig, prazoDate, onConfirm,
}: Props) => {
  const { data: profile } = useProfile();
  const { data: statusOptions = [] } = useGestaoEntregasStatus();
  const createStatus = useCreateGestaoEntregaStatus();

  const [mentor, setMentor] = useState("");
  const [levaAtual, setLevaAtual] = useState("1");
  const [diasUteis, setDiasUteis] = useState("10");
  const [roteirosPorLeva, setRoteirosPorLeva] = useState("25");
  const [levasTotais, setLevasTotais] = useState("6");
  const [status, setStatus] = useState("Em andamento");
  const [observacao, setObservacao] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showNewStatus, setShowNewStatus] = useState(false);

  useEffect(() => {
    if (existingConfig) {
      setMentor(existingConfig.mentor || "");
      setLevaAtual(String((existingConfig.leva_atual || 0) + 1));
      setDiasUteis(String(existingConfig.dias_uteis || 10));
      setRoteirosPorLeva(String(existingConfig.roteiros_por_leva || 25));
      setLevasTotais(String(existingConfig.levas_totais || 6));
      setStatus(existingConfig.status || "Em andamento");
    } else {
      setMentor("");
      setLevaAtual("1");
      setDiasUteis("10");
      setRoteirosPorLeva("25");
      setLevasTotais("6");
      setStatus("Em andamento");
    }
    setObservacao("");
  }, [existingConfig, open]);

  const handleAddStatus = () => {
    const trimmed = newStatus.trim();
    if (trimmed && !statusOptions.includes(trimmed)) {
      createStatus.mutate(trimmed);
      setStatus(trimmed);
      setNewStatus("");
      setShowNewStatus(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      mentor,
      leva_atual: parseInt(levaAtual) || 1,
      dias_uteis: parseInt(diasUteis) || 10,
      roteiros_por_leva: parseInt(roteirosPorLeva) || 25,
      levas_totais: parseInt(levasTotais) || 6,
      status,
      observacao,
    });
  };

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
              <Input
                value={prazoDate.split("-").reverse().join("/")}
                disabled
                className="bg-muted"
              />
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-1.5">
            <Check className="h-4 w-4" /> Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
