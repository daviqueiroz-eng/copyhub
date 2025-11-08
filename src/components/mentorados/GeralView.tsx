import { useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { MentoradoCard } from "./MentoradoCard";
import { LevaColumn } from "./LevaColumn";
import { EntregaDialog } from "./EntregaDialog";
import { Mentorado } from "@/hooks/useMentorados";
import { useEntregas, useMoveEntrega } from "@/hooks/useEntregas";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GeralViewProps {
  mentorados: Mentorado[];
  searchTerm: string;
  onMentoradoClick: (mentorado: Mentorado) => void;
}

export function GeralView({ mentorados, searchTerm, onMentoradoClick }: GeralViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [selectedLeva, setSelectedLeva] = useState(1);

  const { data: entregas = [] } = useEntregas();
  const moveEntrega = useMoveEntrega();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredMentorados = mentorados.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const mentoradoId = active.id as string;
    const overData = over.data.current as { numeroLeva: number } | undefined;

    if (overData?.numeroLeva) {
      moveEntrega.mutate({
        mentoradoId,
        novaLeva: overData.numeroLeva,
      });
    }
  };

  const handleCircleClick = (mentoradoId: string, numeroLeva: number) => {
    const mentorado = mentorados.find((m) => m.id === mentoradoId);
    if (mentorado) {
      setSelectedMentorado(mentorado);
      setSelectedLeva(numeroLeva);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Coluna de Mentorados */}
          <div className="w-64 flex-shrink-0">
            <h2 className="text-sm font-semibold mb-3 sticky top-0 bg-background py-2">
              Mentorados
            </h2>
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {filteredMentorados.map((mentorado) => (
                  <MentoradoCard
                    key={mentorado.id}
                    mentorado={mentorado}
                    onClick={() => onMentoradoClick(mentorado)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Colunas de Levas */}
          <ScrollArea className="flex-1">
            <div className="flex h-full">
              {[1, 2, 3, 4, 5, 6].map((numeroLeva) => (
                <LevaColumn
                  key={numeroLeva}
                  numeroLeva={numeroLeva}
                  mentorados={filteredMentorados}
                  entregas={entregas}
                  onCircleClick={handleCircleClick}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </DndContext>

      <EntregaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mentorado={selectedMentorado}
        numeroLeva={selectedLeva}
      />
    </>
  );
}
