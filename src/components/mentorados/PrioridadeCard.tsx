import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, User, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrelloCard, getUrgencyLevel } from "@/hooks/useTrelloImport";

interface PrioridadeCardProps {
  card: TrelloCard;
}

export function PrioridadeCard({ card }: PrioridadeCardProps) {
  const urgency = getUrgencyLevel(card.prazoMaxRoteiros);

  const urgencyStyles = {
    overdue: "bg-destructive text-destructive-foreground",
    today: "bg-orange-500 text-white",
    this_week: "bg-yellow-500 text-yellow-950",
    normal: "bg-green-500 text-white",
  };

  const urgencyLabels = {
    overdue: "ATRASADO",
    today: "HOJE",
    this_week: "ESTA SEMANA",
    normal: "NO PRAZO",
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Sem data";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  // Extrair Instagram da descrição
  const extractInstagram = (description: string): string | null => {
    const match = description.match(/Instagram:\s*@?(\S+)/i);
    if (match) {
      const handle = match[1].replace(/^@/, "");
      return `@${handle}`;
    }
    return null;
  };

  const instagram = extractInstagram(card.cardDescription);

  const handleClick = () => {
    if (card.cardUrl) {
      window.open(card.cardUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div 
      className={`relative flex flex-col bg-card border rounded-lg overflow-hidden transition-all hover:shadow-md ${card.cardUrl ? "cursor-pointer hover:scale-[1.01]" : ""}`}
      onClick={handleClick}
    >
      {/* Badge de urgência no topo - compacto */}
      <div className={`w-full py-1 px-2 text-center text-[10px] font-bold uppercase tracking-wider ${urgencyStyles[urgency]}`}>
        {urgencyLabels[urgency]}
      </div>

      <div className="p-2 flex flex-col flex-1">
        {/* Nome do card */}
        <h3 className="font-semibold text-xs leading-tight line-clamp-2 mb-1">
          {card.cardName}
        </h3>
        
        {/* Instagram */}
        {instagram && (
          <p className="text-[10px] text-muted-foreground mb-1">{instagram}</p>
        )}

        {/* Etapa/Lista */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
          <Tag className="h-2.5 w-2.5 flex-shrink-0" />
          <span className="truncate">{card.listName}</span>
        </div>

        {/* Prazo */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
          <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
          <span>{formatDate(card.prazoMaxRoteiros)}</span>
        </div>

        {/* Copywriter */}
        {card.members && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <User className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">{card.members}</span>
          </div>
        )}

        {/* Indicador de link */}
        {card.cardUrl && (
          <div className="mt-auto pt-1 flex items-center justify-end text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
}
