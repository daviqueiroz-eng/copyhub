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
      className={`relative flex flex-col bg-card border rounded-lg overflow-hidden transition-all hover:shadow-lg ${card.cardUrl ? "cursor-pointer hover:scale-[1.02]" : ""}`}
      onClick={handleClick}
    >
      {/* Badge de urgência no topo - estilo da imagem */}
      <div className={`w-full py-2 px-3 text-center text-xs font-bold uppercase tracking-wider ${urgencyStyles[urgency]}`}>
        {urgencyLabels[urgency]}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Nome do card */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">
          {card.cardName}
        </h3>
        
        {/* Instagram */}
        {instagram && (
          <p className="text-xs text-muted-foreground mb-2">{instagram}</p>
        )}

        {/* Etapa/Lista */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Tag className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{card.listName}</span>
        </div>

        {/* Prazo */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>Prazo: {formatDate(card.prazoMaxRoteiros)}</span>
        </div>

        {/* Copywriter */}
        {card.members && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{card.members}</span>
          </div>
        )}

        {/* Plano */}
        {card.planoMentoria && (
          <p className="text-xs text-muted-foreground truncate">
            {card.planoMentoria}
          </p>
        )}

        {/* Indicador de link */}
        {card.cardUrl && (
          <div className="mt-auto pt-3 flex items-center justify-end text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
