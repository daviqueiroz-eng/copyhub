import { Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LevaCircleProps {
  mentoradoId: string;
  numeroLeva: number;
  dataEntrega?: string | null;
  concluida?: boolean;
  onClick: () => void;
}

export function LevaCircle({
  mentoradoId,
  numeroLeva,
  dataEntrega,
  concluida,
  onClick,
}: LevaCircleProps) {
  const getStatus = () => {
    if (concluida) return "concluida";
    if (dataEntrega) return "agendada";
    return "nao-iniciada";
  };

  const status = getStatus();

  const statusStyles = {
    "nao-iniciada": "bg-muted border-border",
    agendada: "bg-blue-100 border-blue-500",
    concluida: "bg-green-100 border-green-500",
  };

  const tooltipContent = () => {
    if (concluida && dataEntrega) {
      return `Concluída em ${format(new Date(dataEntrega), "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (dataEntrega) {
      return `Agendada para ${format(new Date(dataEntrega), "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "Clique para agendar";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110",
              statusStyles[status]
            )}
          >
            {concluida && <Check className="w-5 h-5 text-green-600" />}
            {!concluida && dataEntrega && <Calendar className="w-4 h-4 text-blue-600" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
