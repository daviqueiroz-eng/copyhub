import { Mentorado } from "@/hooks/useMentorados";
import { EntregasCalendar } from "./EntregasCalendar";

interface CalendarioViewProps {
  mentorados: Mentorado[];
}

export function CalendarioView({ mentorados }: CalendarioViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
      {/* Calendário principal à esquerda */}
      <div className="min-w-0">
        <EntregasCalendar mentorados={mentorados} />
      </div>

      {/* Controle de Produção embutido à direita */}
      <div className="lg:sticky lg:top-4 h-[calc(100vh-6rem)] rounded-lg border border-border overflow-hidden bg-card">
        <iframe
          src="https://controleproducao.desorcompany.com/"
          title="Controle de Produção"
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
