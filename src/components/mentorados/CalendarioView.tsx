import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mentorado } from "@/hooks/useMentorados";
import { DistribuicaoSemanal } from "./DistribuicaoSemanal";
import { EntregasCalendar } from "./EntregasCalendar";

interface CalendarioViewProps {
  mentorados: Mentorado[];
}

export function CalendarioView({ mentorados }: CalendarioViewProps) {
  return (
    <Tabs defaultValue="calendario" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
        <TabsTrigger value="calendario">Calendário</TabsTrigger>
        <TabsTrigger value="distribuicao">Distribuição Semanal</TabsTrigger>
      </TabsList>

      <TabsContent value="calendario">
        <EntregasCalendar mentorados={mentorados} />
      </TabsContent>

      <TabsContent value="distribuicao">
        <DistribuicaoSemanal mentorados={mentorados} />
      </TabsContent>
    </Tabs>
  );
}
