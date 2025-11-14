import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useFlowTarefas,
  useCreateTarefa,
  useUpdateTarefa,
  useDeleteTarefa,
  FlowTarefa,
} from "@/hooks/useFlowTarefas";

const COLUNAS = [
  { id: "todo", titulo: "A Fazer", cor: "bg-blue-100" },
  { id: "doing", titulo: "Em Progresso", cor: "bg-yellow-100" },
  { id: "done", titulo: "Concluído", cor: "bg-green-100" },
] as const;

const TarefaCard = ({ tarefa, onDelete }: { tarefa: FlowTarefa; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tarefa.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prioridadeCor = {
    baixa: "bg-gray-200",
    media: "bg-blue-200",
    alta: "bg-red-200",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-3 mb-2 cursor-move hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">{tarefa.titulo}</h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {tarefa.descricao && (
          <p className="text-xs text-muted-foreground mb-2">{tarefa.descricao}</p>
        )}
        <div className="flex gap-2">
          <Badge className={prioridadeCor[tarefa.prioridade]} variant="secondary">
            {tarefa.prioridade}
          </Badge>
          {tarefa.data_limite && (
            <Badge variant="outline" className="text-xs">
              {new Date(tarefa.data_limite).toLocaleDateString("pt-BR")}
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
};

export const KanbanBoard = () => {
  const { data: tarefas = [], isLoading } = useFlowTarefas();
  const createTarefa = useCreateTarefa();
  const updateTarefa = useUpdateTarefa();
  const deleteTarefa = useDeleteTarefa();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const tarefaId = active.id as string;
    const overContainer = over.id as string;
    
    const validStatuses = ["todo", "doing", "done"];
    const isColumn = validStatuses.includes(overContainer);
    
    if (isColumn) {
      updateTarefa.mutate({ id: tarefaId, status: overContainer as "todo" | "doing" | "done" });
    }
  };

  const handleSubmit = () => {
    if (!titulo.trim()) return;

    createTarefa.mutate({
      titulo,
      descricao,
      prioridade,
    });

    setIsDialogOpen(false);
    setTitulo("");
    setDescricao("");
    setPrioridade("media");
  };

  if (isLoading) return <div>Carregando tarefas...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📊 Quadro Kanban</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título da tarefa..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <Textarea
                placeholder="Descrição..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
              <div className="flex gap-2">
                {(["baixa", "media", "alta"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={prioridade === p ? "default" : "outline"}
                    onClick={() => setPrioridade(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUNAS.map((coluna) => {
            const tarefasDaColuna = tarefas.filter((t) => t.status === coluna.id);

            return (
              <div key={coluna.id} className={`p-4 rounded-lg ${coluna.cor}`}>
                <h4 className="font-semibold mb-3 flex items-center justify-between">
                  {coluna.titulo}
                  <Badge variant="secondary">{tarefasDaColuna.length}</Badge>
                </h4>
                <SortableContext
                  items={tarefasDaColuna.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[200px]">
                    {tarefasDaColuna.map((tarefa) => (
                      <TarefaCard
                        key={tarefa.id}
                        tarefa={tarefa}
                        onDelete={() => deleteTarefa.mutate(tarefa.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
