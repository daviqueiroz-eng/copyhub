import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Grupo, useUpdateGrupo } from "@/hooks/useGrupos";
import { Clock, Pencil, Loader2, Lightbulb, Flame, Zap, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { differenceInMilliseconds, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GrupoMetaHeaderProps {
  grupo: Grupo & { meta_primeira_viral?: number; meta_viral_constante?: number };
  isOwner: boolean;
  totalPrimeiraViral?: number;
  totalViralConstante?: number;
}

export function GrupoMetaHeader({ grupo, isOwner, totalPrimeiraViral = 0, totalViralConstante = 0 }: GrupoMetaHeaderProps) {
  const updateGrupo = useUpdateGrupo();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    descricao_meta: grupo.descricao_meta || "",
    data_inicio_meta: grupo.data_inicio_meta || "",
    data_fim_meta: grupo.data_fim_meta || "",
    meta_primeira_viral: (grupo as any).meta_primeira_viral || 0,
    meta_viral_constante: (grupo as any).meta_viral_constante || 0,
  });

  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0 });
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    if (!grupo.data_inicio_meta || !grupo.data_fim_meta) return;

    const calcular = () => {
      const agora = new Date();
      const inicio = parseISO(grupo.data_inicio_meta!);
      const fim = parseISO(grupo.data_fim_meta!);
      
      // Calculate progress
      const totalMs = differenceInMilliseconds(fim, inicio);
      const passadoMs = differenceInMilliseconds(agora, inicio);
      const progressoCalc = Math.min(100, Math.max(0, (passadoMs / totalMs) * 100));
      setProgresso(progressoCalc);

      // Calculate remaining time
      const diffMs = fim.getTime() - agora.getTime();
      if (diffMs <= 0) {
        setTempoRestante({ dias: 0, horas: 0, minutos: 0 });
        return;
      }

      const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTempoRestante({ dias, horas, minutos });
    };

    calcular();
    const interval = setInterval(calcular, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [grupo.data_inicio_meta, grupo.data_fim_meta]);

  const getMotivationalMessage = () => {
    const { dias } = tempoRestante;
    if (dias > 20) return "Tempo suficiente para acelerar e bater a meta!";
    if (dias > 10) return "Momento de intensificar o ritmo!";
    if (dias > 5) return "Reta final chegando, foco total!";
    if (dias > 0) return "Últimos dias! Dê o seu máximo!";
    return "Prazo encerrado!";
  };

  const handleSave = async () => {
    try {
      await updateGrupo.mutateAsync({
        id: grupo.id,
        descricao_meta: editForm.descricao_meta || null,
        data_inicio_meta: editForm.data_inicio_meta || null,
        data_fim_meta: editForm.data_fim_meta || null,
        meta_primeira_viral: editForm.meta_primeira_viral,
        meta_viral_constante: editForm.meta_viral_constante,
      } as any);
      toast({ title: "Meta atualizada!" });
      setShowEditDialog(false);
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const metaPrimeiraViral = (grupo as any).meta_primeira_viral || 0;
  const metaViralConstante = (grupo as any).meta_viral_constante || 0;
  const faltaPrimeiraViral = Math.max(0, metaPrimeiraViral - totalPrimeiraViral);
  const faltaViralConstante = Math.max(0, metaViralConstante - totalViralConstante);

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white overflow-hidden">
        <CardContent className="pt-6 space-y-4">
          {/* Header with title and edit button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-pink-400" />
              <span className="font-semibold text-lg">Temporizador da Meta</span>
            </div>
            {isOwner && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Meta description */}
          {grupo.descricao_meta && (
            <div className="flex items-start gap-2 text-slate-300">
              <Target className="h-4 w-4 mt-0.5 text-pink-400" />
              <span className="text-sm">{grupo.descricao_meta}</span>
            </div>
          )}

          {grupo.data_inicio_meta && grupo.data_fim_meta ? (
            <>
              {/* Motivational message and progress */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <span className="text-slate-300">{getMotivationalMessage()}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Progresso do mês</span>
                  <span className="text-pink-400 font-bold">{Math.round(progresso)}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative">
                <Progress 
                  value={progresso} 
                  className="h-3 bg-slate-700"
                />
                <div 
                  className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-pink-500 to-pink-400"
                  style={{ width: `${progresso}%` }}
                />
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-1 py-2">
                <div className="text-center px-4">
                  <span className="text-4xl md:text-5xl font-bold text-pink-400">{tempoRestante.dias}</span>
                  <span className="text-xs text-slate-400 block mt-1">dias</span>
                </div>
                <span className="text-3xl text-pink-400 font-light">:</span>
                <div className="text-center px-4">
                  <span className="text-4xl md:text-5xl font-bold text-pink-400">{tempoRestante.horas}</span>
                  <span className="text-xs text-slate-400 block mt-1">horas</span>
                </div>
                <span className="text-3xl text-pink-400 font-light">:</span>
                <div className="text-center px-4">
                  <span className="text-4xl md:text-5xl font-bold text-pink-400">{tempoRestante.minutos}</span>
                  <span className="text-xs text-slate-400 block mt-1">min</span>
                </div>
              </div>

              {/* Period info */}
              <div className="text-center text-sm text-slate-400">
                {format(parseISO(grupo.data_inicio_meta), "dd/MM", { locale: ptBR })} - {format(parseISO(grupo.data_fim_meta), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Configure as datas da meta para ver o temporizador</p>
            </div>
          )}

          {/* Viral goals progress */}
          {(metaPrimeiraViral > 0 || metaViralConstante > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              {metaPrimeiraViral > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-5 w-5 text-orange-400" />
                    <span className="font-medium">Primeira Viral</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-orange-400">{totalPrimeiraViral}</span>
                    <span className="text-slate-400">/ {metaPrimeiraViral}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {faltaPrimeiraViral > 0 
                      ? `Faltam ${faltaPrimeiraViral} para a meta` 
                      : "✓ Meta atingida!"}
                  </p>
                  <Progress 
                    value={Math.min(100, (totalPrimeiraViral / metaPrimeiraViral) * 100)} 
                    className="h-2 mt-2 bg-slate-700"
                  />
                </div>
              )}
              
              {metaViralConstante > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Viral Constante</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-400">{totalViralConstante}</span>
                    <span className="text-slate-400">/ {metaViralConstante}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {faltaViralConstante > 0 
                      ? `Faltam ${faltaViralConstante} para a meta` 
                      : "✓ Meta atingida!"}
                  </p>
                  <Progress 
                    value={Math.min(100, (totalViralConstante / metaViralConstante) * 100)} 
                    className="h-2 mt-2 bg-slate-700"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Descrição da Meta</label>
              <Textarea
                value={editForm.descricao_meta}
                onChange={(e) => setEditForm(f => ({ ...f, descricao_meta: e.target.value }))}
                placeholder="Ex: 25 constantes / 3 primeiros virais / 90% de alinhamento"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={editForm.data_inicio_meta}
                  onChange={(e) => setEditForm(f => ({ ...f, data_inicio_meta: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={editForm.data_fim_meta}
                  onChange={(e) => setEditForm(f => ({ ...f, data_fim_meta: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Metas de Virais
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-400" />
                    Meta Primeira Viral
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.meta_primeira_viral}
                    onChange={(e) => setEditForm(f => ({ ...f, meta_primeira_viral: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3 text-blue-400" />
                    Meta Viral Constante
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.meta_viral_constante}
                    onChange={(e) => setEditForm(f => ({ ...f, meta_viral_constante: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={updateGrupo.isPending}
            >
              {updateGrupo.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
