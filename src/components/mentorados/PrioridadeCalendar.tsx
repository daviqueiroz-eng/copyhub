import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TrelloCard, getUrgencyLevel } from "@/hooks/useTrelloImport";
import { ExternalLink, User, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrioridadeCalendarProps {
  cards: TrelloCard[];
}

export function PrioridadeCalendar({ cards }: PrioridadeCalendarProps) {
  const events = useMemo(() => {
    return cards
      .filter((card) => card.prazoMaxRoteiros)
      .map((card, index) => {
        const urgency = getUrgencyLevel(card.prazoMaxRoteiros);
        
        const colorMap = {
          overdue: { bg: "#dc2626", border: "#b91c1c", text: "#ffffff", label: "Atrasado" },
          today: { bg: "#ea580c", border: "#c2410c", text: "#ffffff", label: "Hoje" },
          this_week: { bg: "#ca8a04", border: "#a16207", text: "#ffffff", label: "Esta Semana" },
          normal: { bg: "#16a34a", border: "#15803d", text: "#ffffff", label: "No Prazo" },
        };

        const colors = colorMap[urgency];

        // Extract client/mentee name - the full card name is the client
        const clientName = card.cardName;
        
        // Extract copywriter (first member)
        const copywriter = card.members?.split(",")[0]?.trim() || "";

        return {
          id: `${card.cardName}-${index}`,
          title: clientName,
          start: card.prazoMaxRoteiros,
          allDay: true,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            card,
            copywriter,
            urgency,
            urgencyLabel: colors.label,
            clientName,
            listName: card.listName,
            cardUrl: card.cardUrl,
            prazoMaxRoteiros: card.prazoMaxRoteiros,
          },
        };
      });
  }, [cards]);

  const handleEventClick = (info: { event: { extendedProps: { cardUrl?: string } } }) => {
    const url = info.event.extendedProps.cardUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderEventContent = (eventInfo: {
    event: {
      title: string;
      backgroundColor: string;
      extendedProps: {
        copywriter: string;
        urgency: string;
        urgencyLabel: string;
        clientName: string;
        listName: string;
        cardUrl: string;
        prazoMaxRoteiros: string;
      };
    };
  }) => {
    const { extendedProps, backgroundColor } = eventInfo.event;
    const { copywriter, clientName, listName, prazoMaxRoteiros, urgencyLabel } = extendedProps;

    const formattedDate = prazoMaxRoteiros 
      ? format(parseISO(prazoMaxRoteiros), "dd 'de' MMMM", { locale: ptBR })
      : "";

    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div 
              className="px-2.5 py-2 overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg rounded-md"
              style={{ backgroundColor }}
            >
              {/* Client Name - Main Focus */}
              <div className="flex items-start gap-1.5">
                <User className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80" />
                <span className="font-semibold text-sm leading-tight line-clamp-2">
                  {clientName}
                </span>
              </div>
              
              {/* Copywriter Badge */}
              {copywriter && (
                <div className="flex items-center gap-1 mt-1.5">
                  <FileText className="w-3 h-3 opacity-70" />
                  <span className="text-[11px] opacity-90 font-medium truncate">
                    {copywriter}
                  </span>
                </div>
              )}
              
              {/* External Link Indicator */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs p-3 space-y-2 bg-popover border shadow-xl"
          >
            <div className="space-y-1.5">
              <p className="font-bold text-sm text-foreground">{clientName}</p>
              {copywriter && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Copywriter: <span className="font-medium text-foreground">{copywriter}</span>
                </p>
              )}
              {listName && (
                <p className="text-xs text-muted-foreground">
                  Etapa: <span className="font-medium text-foreground">{listName}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Prazo: <span className="font-medium text-foreground">{formattedDate}</span>
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  style={{ 
                    backgroundColor: eventInfo.event.backgroundColor,
                    color: '#ffffff'
                  }}
                >
                  {urgencyLabel}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1 border-t flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Clique para abrir no Trello
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Legend */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-card border rounded-xl shadow-sm">
        <span className="text-sm font-semibold text-foreground">Legenda de Status:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#dc2626] shadow-sm" />
            <span className="text-sm font-medium">Atrasado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#ea580c] shadow-sm" />
            <span className="text-sm font-medium">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#ca8a04] shadow-sm" />
            <span className="text-sm font-medium">Esta Semana</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#16a34a] shadow-sm" />
            <span className="text-sm font-medium">No Prazo</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[800px]">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          locale="pt-br"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          buttonText={{
            today: "Hoje",
            month: "Mês",
            week: "Semana",
          }}
          height="auto"
          dayMaxEvents={5}
          moreLinkText={(num) => `+${num} mais`}
          moreLinkClick="popover"
          eventDisplay="block"
          displayEventEnd={false}
          firstDay={1}
          fixedWeekCount={false}
          showNonCurrentDates={true}
          eventClassNames="!rounded-lg !shadow-md !border-0 !p-0 overflow-hidden"
          dayCellClassNames="hover:bg-muted/30 transition-colors"
          viewClassNames="fullcalendar-prioridade"
        />
      </div>
    </div>
  );
}
