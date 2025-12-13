import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Grupo, useUpdateGrupo } from "@/hooks/useGrupos";
import { Calendar, Target, Clock, Pencil, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GrupoMetaHeaderProps {
  grupo: Grupo;
  isOwner: boolean;
}

export function GrupoMetaHeader({ grupo, isOwner }: GrupoMetaHeaderProps) {
  const updateGrupo = useUpdateGrupo();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    descricao_meta: grupo.descricao_meta || "",
    data_inicio_meta: grupo.data_inicio_meta || "",
    data_fim_meta: grupo.data_fim_meta || "",
  });

  const diasRestantes = grupo.data_fim_meta 
    ? differenceInDays(parseISO(grupo.data_fim_meta), new Date())
    : null;

  const handleSave = async () => {
    try {
      await updateGrupo.mutateAsync({
        id: grupo.id,
        descricao_meta: editForm.descricao_meta || null,
        data_inicio_meta: editForm.data_inicio_meta || null,
        data_fim_meta: editForm.data_fim_meta || null,
      });
      toast({ title: "Meta atualizada!" });
      setShowEditDialog(false);
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              {grupo.data_inicio_meta && grupo.data_fim_meta && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Período: {format(parseISO(grupo.data_inicio_meta), "dd/MM", { locale: ptBR })} - {format(parseISO(grupo.data_fim_meta), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              
              {grupo.descricao_meta ? (
                <div className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <span className="font-medium text-lg">{grupo.descricao_meta}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-5 w-5" />
                  <span>Nenhuma meta definida</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {diasRestantes !== null && (
                <div className="flex items-center gap-2 bg-background/80 rounded-lg px-4 py-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${diasRestantes <= 7 ? 'text-destructive' : diasRestantes <= 14 ? 'text-yellow-500' : 'text-primary'}`}>
                      {diasRestantes > 0 ? diasRestantes : 0}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      {diasRestantes === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                </div>
              )}

              {isOwner && (
                <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
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
