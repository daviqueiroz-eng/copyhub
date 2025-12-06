import { useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { MentoradoCard } from "./MentoradoCard";
import { LevaCircle } from "./LevaCircle";
import { EntregaDialog } from "./EntregaDialog";
import { Mentorado } from "@/hooks/useMentorados";
import { useEntregas, useMoveEntrega } from "@/hooks/useEntregas";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeralViewProps {
  mentorados: Mentorado[];
  searchTerm: string;
  onMentoradoClick: (mentorado: Mentorado) => void;
}

export function GeralView({ mentorados, searchTerm, onMentoradoClick }: GeralViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [selectedLeva, setSelectedLeva] = useState(1);
  const { toast } = useToast();

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

  const mentoradosWithInstagram = filteredMentorados.filter(m => m.instagram);

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

  const handleOpenAllInstagrams = () => {
    if (mentoradosWithInstagram.length === 0) {
      toast({
        title: "Nenhum Instagram cadastrado",
        description: "Não há mentorados com Instagram cadastrado.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `Abrindo ${mentoradosWithInstagram.length} perfis`,
      description: "Permita pop-ups se necessário.",
    });

    mentoradosWithInstagram.forEach((m, index) => {
      const handle = m.instagram?.replace(/^@/, "");
      if (handle) {
        setTimeout(() => {
          window.open(`https://instagram.com/${handle}`, "_blank", "noopener,noreferrer");
        }, index * 300); // Delay to avoid popup blockers
      }
    });
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="min-w-max">
            {/* Header */}
            <div className="grid grid-cols-[300px_repeat(6,120px)] gap-4 mb-4 pb-2 border-b sticky top-0 bg-background z-10">
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>Mentorado</span>
                {mentoradosWithInstagram.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={handleOpenAllInstagrams}
                  >
                    <Instagram className="h-3.5 w-3.5 text-pink-500" />
                    Abrir todos ({mentoradosWithInstagram.length})
                  </Button>
                )}
              </div>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} className="text-center font-semibold text-sm">
                  {num}ª Leva
                </div>
              ))}
            </div>

            {/* Grid de Mentorados e Levas */}
            <div className="space-y-3">
              {filteredMentorados.map((mentorado) => {
                const entregasMentorado = entregas.filter(
                  (e) => e.mentorado_id === mentorado.id
                );

                return (
                  <div
                    key={mentorado.id}
                    className="grid grid-cols-[300px_repeat(6,120px)] gap-4 items-center"
                  >
                    {/* Card do Mentorado */}
                    <div>
                      <MentoradoCard
                        mentorado={mentorado}
                        onClick={() => onMentoradoClick(mentorado)}
                      />
                    </div>

                    {/* Círculos das Levas */}
                    {[1, 2, 3, 4, 5, 6].map((numeroLeva) => {
                      const entrega = entregasMentorado.find(
                        (e) => e.numero_leva === numeroLeva
                      );

                      return (
                        <div key={numeroLeva} className="flex justify-center">
                          <LevaCircle
                            mentoradoId={mentorado.id}
                            numeroLeva={numeroLeva}
                            dataEntrega={entrega?.data_entrega}
                            concluida={entrega?.concluida}
                            onClick={() => handleCircleClick(mentorado.id, numeroLeva)}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
