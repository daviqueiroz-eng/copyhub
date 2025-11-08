import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntregas } from "@/hooks/useEntregas";
import { Mentorado } from "@/hooks/useMentorados";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <div className="grid md:grid-cols-[1fr,400px] gap-6">
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
            className="rounded-md border pointer-events-auto"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            locale={ptBR}
          />
        </CardContent>
      </Card>

      {/* Lista de Entregas do Dia */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
              : "Selecione uma data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entregasDoDia.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma entrega agendada para esta data
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {entregasDoDia.map((entrega) => {
                  const mentorado = mentorados.find(
                    (m) => m.id === entrega.mentorado_id
                  );

                  if (!mentorado) return null;

                  return (
                    <Card key={entrega.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{mentorado.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {entrega.numero_leva}ª Leva
                            </p>
                            {entrega.observacoes && (
                              <p className="text-sm mt-2 text-muted-foreground">
                                {entrega.observacoes}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={entrega.concluida ? "default" : "secondary"}
                          >
                            {entrega.concluida ? "Concluída" : "Pendente"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
