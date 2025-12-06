import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrelloCard, getUrgencyLevel } from "@/hooks/useTrelloImport";

interface PrioridadeCardProps {
  card: TrelloCard;
}

export function PrioridadeCard({ card }: PrioridadeCardProps) {
  const urgency = getUrgencyLevel(card.prazoMaxRoteiros);

  const urgencyStyles = {
    overdue: "border-l-4 border-l-destructive bg-destructive/5",
    today: "border-l-4 border-l-orange-500 bg-orange-500/5",
    this_week: "border-l-4 border-l-yellow-500 bg-yellow-500/5",
    normal: "border-l-4 border-l-green-500 bg-green-500/5",
  };

  const urgencyLabels = {
    overdue: { text: "ATRASADO", className: "bg-destructive text-destructive-foreground" },
    today: { text: "HOJE", className: "bg-orange-500 text-white" },
    this_week: { text: "ESTA SEMANA", className: "bg-yellow-500 text-black" },
    normal: { text: "NO PRAZO", className: "bg-green-500 text-white" },
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

  return (
    <Card className={`${urgencyStyles[urgency]} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={urgencyLabels[urgency].className}>
                {urgencyLabels[urgency].text}
              </Badge>
            </div>

            <h3 className="font-semibold text-lg truncate">{card.cardName}</h3>
            
            {instagram && (
              <p className="text-sm text-muted-foreground mt-1">{instagram}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(card.prazoMaxRoteiros)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{card.listName}</span>
              </div>

              {card.members && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{card.members}</span>
                </div>
              )}
            </div>

            {card.planoMentoria && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                Plano: {card.planoMentoria}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
