import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  SprintIniciativa,
  useSprintsTarefas,
  useCreateTarefa,
  useUpdateTarefa,
  useDeleteTarefa,
  useUpdateIniciativa,
  useDeleteIniciativa,
} from "@/hooks/useSprints";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SprintDetalheDialogProps {
  iniciativa: SprintIniciativa | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabel = {
  backlog: "Não iniciada",
  sprint: "Em andamento",
  finalizado: "Finalizada",
};

const impactoBadgeVariant = {
  baixo: "secondary",
  medio: "default",
  alto: "destructive",
} as const;

const impactoLabel = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

export const SprintDetalheDialog = ({
  iniciativa,
  open,
  onOpenChange,
}: SprintDetalheDialogProps) => {
  const [novaTarefa, setNovaTarefa] = useState("");
  const { user } = useAuth();

  const { data: tarefas = [] } = useSprintsTarefas(iniciativa?.id || "");
  const createTarefa = useCreateTarefa();
  const updateTarefa = useUpdateTarefa();
  const deleteTarefa = useDeleteTarefa();
  const updateIniciativa = useUpdateIniciativa();
  const deleteIniciativa = useDeleteIniciativa();

  if (!iniciativa) return null;

  const tarefasConcluidas = tarefas.filter((t) => t.concluida).length;
  const totalTarefas = tarefas.length;
  const progresso =
    totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;

  const handleAddTarefa = async () => {
    if (!novaTarefa.trim()) return;

    try {
      await createTarefa.mutateAsync({
        iniciativa_id: iniciativa.id,
        texto: novaTarefa.trim(),
      });
      setNovaTarefa("");
    } catch (error) {
      toast.error("Erro ao adicionar tarefa");
    }
  };

  const handleToggleTarefa = async (tarefaId: string, concluida: boolean) => {
    try {
      await updateTarefa.mutateAsync({
        id: tarefaId,
        iniciativa_id: iniciativa.id,
        concluida: !concluida,
      });
    } catch (error) {
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDeleteTarefa = async (tarefaId: string) => {
    try {
      await deleteTarefa.mutateAsync({
        id: tarefaId,
        iniciativa_id: iniciativa.id,
      });
    } catch (error) {
      toast.error("Erro ao remover tarefa");
    }
  };

  const handleArchive = async () => {
    try {
      await updateIniciativa.mutateAsync({
        id: iniciativa.id,
        arquivada: !iniciativa.arquivada,
      });
      toast.success(
        iniciativa.arquivada
          ? "Iniciativa desarquivada"
          : "Iniciativa arquivada"
      );
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao arquivar iniciativa");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIniciativa.mutateAsync(iniciativa.id);
      toast.success("Iniciativa excluída");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao excluir iniciativa");
    }
  };

  const canDelete = user?.id === iniciativa.created_by;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{iniciativa.titulo}</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">{statusLabel[iniciativa.status]}</Badge>
            <Badge variant={impactoBadgeVariant[iniciativa.impacto]}>
              {impactoLabel[iniciativa.impacto]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
            {iniciativa.dono && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={iniciativa.dono.avatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {iniciativa.dono.nome?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>Dono: {iniciativa.dono.nome}</span>
              </div>
            )}
            {iniciativa.prazo_entrega && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Prazo:{" "}
                  {format(new Date(iniciativa.prazo_entrega), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {iniciativa.descricao && (
            <div>
              <h4 className="font-medium mb-2">Descrição</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {iniciativa.descricao}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Progresso</h4>
              <span className="text-sm text-muted-foreground">
                {Math.round(progresso)}%
              </span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>

          {iniciativa.criterio_conclusao && (
            <div>
              <h4 className="font-medium mb-2">Critério de conclusão</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {iniciativa.criterio_conclusao}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-3">
              Tarefas ({tarefasConcluidas}/{totalTarefas})
            </h4>
            <div className="space-y-2">
              {tarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className="flex items-center gap-2 group"
                >
                  <Checkbox
                    checked={tarefa.concluida}
                    onCheckedChange={() =>
                      handleToggleTarefa(tarefa.id, tarefa.concluida)
                    }
                  />
                  <span
                    className={`flex-1 text-sm ${
                      tarefa.concluida
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {tarefa.texto}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteTarefa(tarefa.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <Input
                  value={novaTarefa}
                  onChange={(e) => setNovaTarefa(e.target.value)}
                  placeholder="Nova tarefa..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTarefa();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddTarefa}
                  disabled={!novaTarefa.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleArchive}>
              {iniciativa.arquivada ? "Desarquivar" : "Arquivar"}
            </Button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir iniciativa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A iniciativa e todas as
                      suas tarefas serão removidas permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
