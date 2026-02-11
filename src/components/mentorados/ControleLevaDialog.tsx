import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronRight, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { addBusinessDays } from "@/lib/dateUtils";
import { ControleLeva, useUpdateControleLeva, useCreateControleLeva, useDeleteControleLeva } from "@/hooks/useControleLevas";
import { Mentorado } from "@/hooks/useMentorados";
import { useAuth } from "@/contexts/AuthContext";

interface ControleLevaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leva: ControleLeva | null;
  mentorado: Mentorado | null;
  allLevas: ControleLeva[];
}

const DIAS_UTEIS_OPTIONS = [10, 15, 20];

export function ControleLevaDialog({ open, onOpenChange, leva, mentorado, allLevas }: ControleLevaDialogProps) {
  const [diasUteis, setDiasUteis] = useState<number>(10);
  const [customDias, setCustomDias] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [dataReal, setDataReal] = useState<string>("");

  const updateLeva = useUpdateControleLeva();
  const createLeva = useCreateControleLeva();
  const deleteLeva = useDeleteControleLeva();
  const { session } = useAuth();

  const mentoradoLevas = useMemo(() => {
    if (!leva) return [];
    return allLevas
      .filter(l => l.mentorado_id === leva.mentorado_id)
      .sort((a, b) => a.numero_leva - b.numero_leva);
  }, [allLevas, leva]);

  const totalLevas = mentoradoLevas.length;

  useEffect(() => {
    if (leva) {
      const dias = leva.dias_uteis || 10;
      if (DIAS_UTEIS_OPTIONS.includes(dias)) {
        setDiasUteis(dias);
        setIsCustom(false);
      } else {
        setIsCustom(true);
        setCustomDias(String(dias));
        setDiasUteis(dias);
      }
      setDataReal(leva.data_real || "");
    }
  }, [leva]);

  if (!leva || !mentorado) return null;

  const effectiveDias = isCustom ? (parseInt(customDias) || 0) : diasUteis;
  const dataPrevista = effectiveDias > 0
    ? addBusinessDays(parseISO(leva.data_inicio), effectiveDias)
    : null;

  const handleSave = async () => {
    await updateLeva.mutateAsync({
      id: leva.id,
      dias_uteis: effectiveDias,
      data_prevista: dataPrevista ? format(dataPrevista, "yyyy-MM-dd") : null,
      data_real: dataReal || null,
    });
    onOpenChange(false);
  };

  const handleProximo = async () => {
    if (!dataPrevista || !session?.user?.id) return;
    
    // Mark current as done
    await updateLeva.mutateAsync({
      id: leva.id,
      dias_uteis: effectiveDias,
      data_prevista: format(dataPrevista, "yyyy-MM-dd"),
      data_real: dataReal || format(new Date(), "yyyy-MM-dd"),
      concluida: true,
    });

    // Create next leva
    const nextDataInicio = format(dataPrevista, "yyyy-MM-dd");
    await createLeva.mutateAsync({
      user_id: session.user.id,
      mentorado_id: leva.mentorado_id,
      numero_leva: leva.numero_leva + 1,
      data_inicio: nextDataInicio,
      dias_uteis: effectiveDias,
      data_prevista: format(addBusinessDays(dataPrevista, effectiveDias), "yyyy-MM-dd"),
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteLeva.mutateAsync(leva.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {mentorado.iniciais}
            </div>
            <div>
              <div>{mentorado.nome}</div>
              <div className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                {mentorado.plano && <span>{mentorado.plano}</span>}
                <Badge variant="outline" className="text-xs">
                  Leva {leva.numero_leva}/{totalLevas}
                </Badge>
                {leva.concluida && <Badge variant="secondary" className="text-xs">Concluída</Badge>}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Data de início */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Início:</span>
            <span className="font-medium">
              {format(parseISO(leva.data_inicio), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
            </span>
          </div>

          {/* Dias úteis */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dias Úteis</Label>
            <div className="flex items-center gap-2">
              {DIAS_UTEIS_OPTIONS.map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={!isCustom && diasUteis === d ? "default" : "outline"}
                  onClick={() => { setDiasUteis(d); setIsCustom(false); }}
                >
                  {d}
                </Button>
              ))}
              <Button
                size="sm"
                variant={isCustom ? "default" : "outline"}
                onClick={() => setIsCustom(true)}
              >
                Custom
              </Button>
              {isCustom && (
                <Input
                  type="number"
                  value={customDias}
                  onChange={(e) => setCustomDias(e.target.value)}
                  className="w-20 h-9"
                  placeholder="Dias"
                  min={1}
                />
              )}
            </div>
          </div>

          {/* Data prevista */}
          {dataPrevista && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Data Prevista:</span>
              <Badge variant="secondary" className="font-medium">
                {format(dataPrevista, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
              </Badge>
            </div>
          )}

          {/* Data real */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data Real de Entrega</Label>
            <Input
              type="date"
              value={dataReal}
              onChange={(e) => setDataReal(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1" disabled={updateLeva.isPending}>
              Salvar
            </Button>
            {!leva.concluida && (
              <Button onClick={handleProximo} variant="secondary" className="flex-1 gap-1" disabled={updateLeva.isPending || createLeva.isPending || !dataPrevista}>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleDelete} variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={deleteLeva.isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
