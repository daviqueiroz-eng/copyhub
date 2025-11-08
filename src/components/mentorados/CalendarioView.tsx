import { Mentorado } from "@/hooks/useMentorados";
import { EntregasCalendar } from "./EntregasCalendar";
import { EntregasPendentesPanel } from "./EntregasPendentesPanel";

interface CalendarioViewProps {
  mentorados: Mentorado[];
}

export function CalendarioView({ mentorados }: CalendarioViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* Calendário principal à esquerda */}
      <div className="min-w-0">
        <EntregasCalendar mentorados={mentorados} />
      </div>

      {/* Painel de entregas pendentes à direita */}
      <div className="lg:sticky lg:top-4 h-fit">
        <EntregasPendentesPanel mentorados={mentorados} />
      </div>
    </div>
  );
}
