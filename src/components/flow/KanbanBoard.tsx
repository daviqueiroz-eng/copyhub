import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
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
  { id: "todo", titulo: "A Fazer", cor: "bg-blue-50" },
  { id: "doing", titulo: "Em Progresso", cor: "bg-yellow-50" },
  { id: "done", titulo: "Concluído", cor: "bg-green-50" },
] as const;

const TarefaCard = ({ 
  tarefa, 
  onDelete, 
  onClick 
}: { 
  tarefa: FlowTarefa; 
  onDelete: () => void;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tarefa.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const prioridadeCor = {
    baixa: "bg-secondary text-secondary-foreground",
    media: "bg-primary/20 text-primary",
    alta: "bg-destructive/20 text-destructive",
  };

  const isAtividadeGeral = !!tarefa.atividade_geral_id;

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={cn(
          "p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer",
          isAtividadeGeral && "border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
        )}
        onClick={onClick}
      >
        {isAtividadeGeral && (
          <Badge variant="outline" className="mb-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
            <Megaphone className="h-3 w-3 mr-1" />
            Atividade Geral
          </Badge>
        )}

        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-sm flex-1">{tarefa.titulo}</h4>
          </div>
          {!isAtividadeGeral && (
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
          )}
        </div>
        {tarefa.descricao && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{tarefa.descricao}</p>
        )}
        <div className="flex gap-2 flex-wrap">
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

const DroppableColumn = ({ 
  id, 
  children, 
  titulo, 
  cor, 
  count 
}: { 
  id: string; 
  children: React.ReactNode; 
  titulo: string; 
  cor: string; 
  count: number;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`p-4 rounded-lg ${cor} ${isOver ? 'ring-2 ring-primary' : ''} transition-all`}
    >
      <h4 className="font-semibold mb-3 flex items-center justify-between">
        {titulo}
        <Badge variant="secondary">{count}</Badge>
      </h4>
      <div className="space-y-2 min-h-[400px]">
        {children}
      </div>
    </div>
  );
};

export const KanbanBoard = () => {
  const { data: tarefas = [], isLoading } = useFlowTarefas();
  const createTarefa = useCreateTarefa();
  const updateTarefa = useUpdateTarefa();
  const deleteTarefa = useDeleteTarefa();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<FlowTarefa | null>(null);

  // Form states
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
  const [status, setStatus] = useState<"todo" | "doing" | "done">("todo");
  const [dataLimite, setDataLimite] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Evita conflito com clicks
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const tarefaId = active.id as string;
    const novoStatus = over.id as string;

    // Verificar se é uma coluna válida
    const validStatuses = ["todo", "doing", "done"];
    if (validStatuses.includes(novoStatus)) {
      updateTarefa.mutate({ id: tarefaId, status: novoStatus as any });
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setPrioridade("media");
    setStatus("todo");
    setDataLimite("");
    setTarefaEditando(null);
  };

  const handleCreate = () => {
    if (!titulo.trim()) return;

    createTarefa.mutate({
      titulo,
      descricao: descricao || undefined,
      prioridade,
      data_limite: dataLimite || undefined,
    });

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = (tarefa: FlowTarefa) => {
    setTarefaEditando(tarefa);
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao || "");
    setPrioridade(tarefa.prioridade);
    setStatus(tarefa.status);
    setDataLimite(tarefa.data_limite || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!tarefaEditando || !titulo.trim()) return;

    // Se for atividade geral, só permitir alteração de status
    if (tarefaEditando.atividade_geral_id) {
      updateTarefa.mutate({
        id: tarefaEditando.id,
        atividade_geral_id: tarefaEditando.atividade_geral_id,
        status,
      });
    } else {
      updateTarefa.mutate({
        id: tarefaEditando.id,
        titulo,
        descricao: descricao || null,
        prioridade,
        status,
        data_limite: dataLimite || null,
      });
    }

    setIsEditDialogOpen(false);
    resetForm();
  };

  if (isLoading) return <div>Carregando tarefas...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📊 Quadro Kanban</h3>
        
        {/* Dialog de Criação */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
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
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Título da tarefa..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descrição..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div>
                <Label>Prioridade</Label>
                <div className="flex gap-2 mt-2">
                  {(["baixa", "media", "alta"] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={prioridade === p ? "default" : "outline"}
                      onClick={() => setPrioridade(p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="data-limite">Data Limite</Label>
                <Input
                  id="data-limite"
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-titulo">Título</Label>
                <Input
                  id="edit-titulo"
                  placeholder="Título da tarefa..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={!!tarefaEditando?.atividade_geral_id}
                />
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  placeholder="Descrição..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={!!tarefaEditando?.atividade_geral_id}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="doing">Em Progresso</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <div className="flex gap-2 mt-2">
                  {(["baixa", "media", "alta"] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={prioridade === p ? "default" : "outline"}
                      onClick={() => setPrioridade(p)}
                      disabled={!!tarefaEditando?.atividade_geral_id}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-data-limite">Data Limite</Label>
                <Input
                  id="edit-data-limite"
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  disabled={!!tarefaEditando?.atividade_geral_id}
                />
              </div>
              {tarefaEditando?.atividade_geral_id && (
                <p className="text-sm text-muted-foreground">
                  💡 Atividades gerais só permitem alteração de status
                </p>
              )}
              <Button onClick={handleUpdate} className="w-full">
                Salvar Alterações
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
              <DroppableColumn
                key={coluna.id}
                id={coluna.id}
                titulo={coluna.titulo}
                cor={coluna.cor}
                count={tarefasDaColuna.length}
              >
                <SortableContext
                  items={tarefasDaColuna.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {tarefasDaColuna.map((tarefa) => (
                    <TarefaCard
                      key={tarefa.id}
                      tarefa={tarefa}
                      onDelete={() => deleteTarefa.mutate(tarefa.id)}
                      onClick={() => handleEdit(tarefa)}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
