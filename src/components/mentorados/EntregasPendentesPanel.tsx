import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntregasPendentes } from "@/hooks/useEntregas";
import { Mentorado } from "@/hooks/useMentorados";
import { DraggableEntregaCard } from "./DraggableEntregaCard";
import { InfoIcon } from "lucide-react";

interface EntregasPendentesPanelProps {
  mentorados: Mentorado[];
}

export function EntregasPendentesPanel({ mentorados }: EntregasPendentesPanelProps) {
  const { data: entregasPendentes = [], isLoading } = useEntregasPendentes();

  const entregasComMentorado = entregasPendentes
    .map((entrega) => {
      const mentorado = mentorados.find((m) => m.id === entrega.mentorado_id);
      return mentorado ? { entrega, mentorado } : null;
    })
    .filter(Boolean) as Array<{ entrega: any; mentorado: Mentorado }>;

  return (
    <Card className="p-4 h-fit sticky top-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Entregas Pendentes</h3>
          <Badge variant="secondary">
            {entregasComMentorado.length}
          </Badge>
        </div>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Arraste as entregas para o calendário para definir as datas
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </>
            ) : entregasComMentorado.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>Nenhuma entrega pendente</p>
                <p className="text-xs mt-1">
                  Todas as entregas têm datas definidas
                </p>
              </div>
            ) : (
              entregasComMentorado.map(({ entrega, mentorado }) => (
                <DraggableEntregaCard
                  key={entrega.id}
                  entregaId={entrega.id}
                  mentorado={mentorado}
                  numeroLeva={entrega.numero_leva}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
