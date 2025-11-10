import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useEntregasPendentes } from "@/hooks/useEntregas";
import { Mentorado } from "@/hooks/useMentorados";
import { DraggableEntregaCard } from "./DraggableEntregaCard";
import { InfoIcon, Flame, AlertCircle, Circle } from "lucide-react";

const getPriorityConfig = (numeroLeva: number) => {
  if (numeroLeva === 1) {
    return { 
      icon: Flame, 
      color: "text-red-500 dark:text-red-400", 
      bgColor: "bg-red-500/10",
      label: "URGENTE" 
    };
  }
  if (numeroLeva === 2 || numeroLeva === 3) {
    return { 
      icon: AlertCircle, 
      color: "text-yellow-500 dark:text-yellow-400", 
      bgColor: "bg-yellow-500/10",
      label: "IMPORTANTE" 
    };
  }
  return { 
    icon: Circle, 
    color: "text-blue-500 dark:text-blue-400", 
    bgColor: "bg-blue-500/10",
    label: "NORMAL" 
  };
};

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

  // Agrupar entregas por numero_leva
  const entregasPorLeva = entregasComMentorado.reduce((acc, item) => {
    const leva = item.entrega.numero_leva;
    if (!acc[leva]) acc[leva] = [];
    acc[leva].push(item);
    return acc;
  }, {} as Record<number, typeof entregasComMentorado>);

  const levasOrdenadas = Object.keys(entregasPorLeva)
    .map(Number)
    .sort((a, b) => a - b);

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
            Entregas ordenadas por prioridade (Leva 1 primeiro). Arraste para o calendário para definir as datas limites.
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3 pr-2">
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
              levasOrdenadas.map((numeroLeva, index) => {
                const entregas = entregasPorLeva[numeroLeva];
                const prioridade = getPriorityConfig(numeroLeva);
                const Icon = prioridade.icon;

                return (
                  <div key={numeroLeva}>
                    {/* Separador entre levas */}
                    {index > 0 && <Separator className="my-3" />}
                    
                    {/* Cabeçalho da Leva */}
                    <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md ${prioridade.bgColor}`}>
                      <Icon className={`h-4 w-4 ${prioridade.color}`} />
                      <span className={`font-semibold text-xs uppercase ${prioridade.color}`}>
                        Leva {numeroLeva}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {entregas.length}
                      </Badge>
                    </div>

                    {/* Entregas da Leva */}
                    <div className="space-y-2">
                      {entregas.map(({ entrega, mentorado }) => (
                        <DraggableEntregaCard
                          key={entrega.id}
                          entregaId={entrega.id}
                          mentorado={mentorado}
                          numeroLeva={entrega.numero_leva}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
