import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { LevaCircle } from "./LevaCircle";
import { Entrega } from "@/hooks/useEntregas";
import { Mentorado } from "@/hooks/useMentorados";

interface LevaColumnProps {
  numeroLeva: number;
  mentorados: Mentorado[];
  entregas: Entrega[];
  onCircleClick: (mentoradoId: string, numeroLeva: number) => void;
}

export function LevaColumn({
  numeroLeva,
  mentorados,
  entregas,
  onCircleClick,
}: LevaColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `leva-${numeroLeva}`,
    data: { numeroLeva },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[80px] border-r border-border p-2 space-y-2 transition-colors",
        isOver && "bg-accent/30"
      )}
    >
      <h3 className="text-xs font-semibold text-center mb-3 sticky top-0 bg-background py-2">
        {numeroLeva}ª Leva
      </h3>
      <div className="space-y-3">
        {mentorados.map((mentorado) => {
          const entrega = entregas.find(
            (e) => e.mentorado_id === mentorado.id && e.numero_leva === numeroLeva
          );

          return (
            <div key={mentorado.id} className="flex justify-center">
              <LevaCircle
                mentoradoId={mentorado.id}
                numeroLeva={numeroLeva}
                dataEntrega={entrega?.data_entrega}
                concluida={entrega?.concluida}
                onClick={() => onCircleClick(mentorado.id, numeroLeva)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
