import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Archive, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SprintIniciativa,
  useSprintsIniciativas,
  useUpdateIniciativa,
  useProfiles,
} from "@/hooks/useSprints";
import { SprintIniciativaCard } from "./SprintIniciativaCard";
import { SprintIniciativaDialog } from "./SprintIniciativaDialog";
import { SprintDetalheDialog } from "./SprintDetalheDialog";
import { toast } from "sonner";

type StatusColumn = "backlog" | "sprint" | "finalizado";

const columns: { id: StatusColumn; title: string; color: string }[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted" },
  { id: "sprint", title: "Sprint", color: "bg-primary/10" },
  { id: "finalizado", title: "Finalizado", color: "bg-green-500/10" },
];

export const SprintsBoard = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [filterDono, setFilterDono] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIniciativa, setSelectedIniciativa] =
    useState<SprintIniciativa | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: iniciativas = [], isLoading } =
    useSprintsIniciativas(showArchived);
  const { data: profiles = [] } = useProfiles();
  const updateIniciativa = useUpdateIniciativa();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredIniciativas = useMemo(() => {
    if (filterDono === "all") return iniciativas;
    return iniciativas.filter((i) => i.dono_id === filterDono);
  }, [iniciativas, filterDono]);

  const getIniciativasByStatus = (status: StatusColumn) => {
    return filteredIniciativas.filter((i) => i.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIniciativa = iniciativas.find((i) => i.id === active.id);
    if (!activeIniciativa) return;

    // Check if dropped on a column
    const targetColumn = columns.find((c) => c.id === over.id);
    const newStatus = targetColumn?.id;

    // Or if dropped on another card, get that card's status
    const targetIniciativa = iniciativas.find((i) => i.id === over.id);
    const targetStatus = targetIniciativa?.status || newStatus;

    if (targetStatus && targetStatus !== activeIniciativa.status) {
      try {
        await updateIniciativa.mutateAsync({
          id: activeIniciativa.id,
          status: targetStatus,
        });
        toast.success(`Movido para ${columns.find((c) => c.id === targetStatus)?.title}`);
      } catch (error) {
        toast.error("Erro ao mover iniciativa");
      }
    }
  };

  const activeIniciativa = activeId
    ? iniciativas.find((i) => i.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="h-4 w-4 mr-2" />
          {showArchived ? "Ver Ativas" : "Arquivadas"}
        </Button>

        <div className="flex items-center gap-2">
          <Select value={filterDono} onValueChange={setFilterDono}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por dono" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profiles.map((profile) => (
                <SelectItem key={profile.user_id} value={profile.user_id}>
                  {profile.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Iniciativa
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => {
            const columnIniciativas = getIniciativasByStatus(column.id);

            return (
              <div key={column.id} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      column.id === "backlog" && "bg-muted-foreground",
                      column.id === "sprint" && "bg-primary",
                      column.id === "finalizado" && "bg-green-500"
                    )}
                  />
                  <h3 className="font-medium">
                    {column.title} ({columnIniciativas.length})
                  </h3>
                </div>

                <Card
                  className={cn(
                    "flex-1 min-h-[400px] p-3 space-y-3",
                    column.color
                  )}
                >
                  <SortableContext
                    items={columnIniciativas.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                    id={column.id}
                  >
                    {columnIniciativas.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Nenhuma iniciativa
                      </div>
                    ) : (
                      columnIniciativas.map((iniciativa) => (
                        <SprintIniciativaCard
                          key={iniciativa.id}
                          iniciativa={iniciativa}
                          onClick={() => setSelectedIniciativa(iniciativa)}
                        />
                      ))
                    )}
                  </SortableContext>
                </Card>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeIniciativa && (
            <SprintIniciativaCard
              iniciativa={activeIniciativa}
              onClick={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <SprintIniciativaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <SprintDetalheDialog
        iniciativa={selectedIniciativa}
        open={!!selectedIniciativa}
        onOpenChange={(open) => !open && setSelectedIniciativa(null)}
      />
    </div>
  );
};
