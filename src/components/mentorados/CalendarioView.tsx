import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntregas } from "@/hooks/useEntregas";
import { Mentorado } from "@/hooks/useMentorados";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DistribuicaoSemanal } from "./DistribuicaoSemanal";
import { MentoradoEntregaCard } from "./MentoradoEntregaCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CalendarioViewProps {
  mentorados: Mentorado[];
}

export function CalendarioView({ mentorados }: CalendarioViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: entregas = [] } = useEntregas();

  // Filtrar entregas com data
  const entregasComData = entregas.filter((e) => e.data_entrega);

  // Entregas da data selecionada
  const entregasDoDia = selectedDate
    ? entregasComData.filter((e) =>
        isSameDay(new Date(e.data_entrega!), selectedDate)
      )
    : [];

  // Função para customizar dias com entregas
  const modifiers = {
    hasEntrega: entregasComData.map((e) => new Date(e.data_entrega!)),
  };

  const modifiersStyles = {
    hasEntrega: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      fontWeight: "bold",
    },
  };

  // Renderizar conteúdo customizado dos dias
  const DayContent = (day: Date) => {
    const entregasDia = entregasComData.filter((e) =>
      isSameDay(new Date(e.data_entrega!), day)
    );

    if (entregasDia.length === 0) {
      return <div className="text-center">{format(day, "d")}</div>;
    }

    const mentoradosUnicos = Array.from(
      new Set(entregasDia.map((e) => e.mentorado_id))
    ).slice(0, 2);

    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="text-sm font-medium">{format(day, "d")}</div>
        <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
          {mentoradosUnicos.map((mentoradoId) => {
            const mentorado = mentorados.find((m) => m.id === mentoradoId);
            const entrega = entregasDia.find((e) => e.mentorado_id === mentoradoId);
            if (!mentorado || !entrega) return null;
            return (
              <span
                key={mentoradoId}
                className="text-[9px] font-semibold px-1 rounded"
                style={{
                  backgroundColor: getLevaColor(entrega.numero_leva),
                  color: "white",
                }}
              >
                {mentorado.iniciais}
              </span>
            );
          })}
          {entregasDia.length > 2 && (
            <span className="text-[9px] font-semibold">+{entregasDia.length - 2}</span>
          )}
        </div>
      </div>
    );
  };

  const getLevaColor = (numeroLeva: number) => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
      "hsl(var(--primary))",
    ];
    return colors[numeroLeva - 1] || "hsl(var(--primary))";
  };

  return (
    <Tabs defaultValue="limites" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
        <TabsTrigger value="limites">Datas Limite</TabsTrigger>
        <TabsTrigger value="distribuicao">Distribuição Semanal</TabsTrigger>
      </TabsList>

      <TabsContent value="limites">
        {/* Legenda de cores */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <span className="font-medium">Legenda:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Entregas agendadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Em dia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Atenção</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Atrasado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1.2fr,500px] gap-6">
          {/* Calendário */}
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Entregas</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border pointer-events-auto calendar-enlarged"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                locale={ptBR}
                components={{
                  DayContent: ({ date }) => DayContent(date),
                }}
              />
            </CardContent>
          </Card>

          {/* Painel de Detalhes */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "Selecione uma data"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entregasDoDia.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma entrega agendada para esta data
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  {entregasDoDia.length === 1 ? (
                    <div className="space-y-4">
                      {entregasDoDia.map((entrega) => {
                        const mentorado = mentorados.find(
                          (m) => m.id === entrega.mentorado_id
                        );
                        if (!mentorado) return null;

                        const todasEntregasMentorado = entregas.filter(
                          (e) => e.mentorado_id === mentorado.id
                        );

                        return (
                          <MentoradoEntregaCard
                            key={entrega.id}
                            mentorado={mentorado}
                            entregaDia={entrega}
                            todasEntregas={todasEntregasMentorado}
                            getLevaColor={getLevaColor}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                      {entregasDoDia.map((entrega, index) => {
                        const mentorado = mentorados.find(
                          (m) => m.id === entrega.mentorado_id
                        );
                        if (!mentorado) return null;

                        const todasEntregasMentorado = entregas.filter(
                          (e) => e.mentorado_id === mentorado.id
                        );

                        return (
                          <AccordionItem key={entrega.id} value={`item-${index}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: getLevaColor(entrega.numero_leva),
                                  }}
                                />
                                <span className="font-medium">{mentorado.nome}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({entrega.numero_leva}ª Leva)
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <MentoradoEntregaCard
                                mentorado={mentorado}
                                entregaDia={entrega}
                                todasEntregas={todasEntregasMentorado}
                                getLevaColor={getLevaColor}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="distribuicao">
        <DistribuicaoSemanal mentorados={mentorados} />
      </TabsContent>
    </Tabs>
  );
}
