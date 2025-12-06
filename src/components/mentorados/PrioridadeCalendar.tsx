import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TrelloCard, getUrgencyLevel } from "@/hooks/useTrelloImport";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "date-fns/locale";

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
          overdue: { bg: "#ef4444", border: "#dc2626", text: "#ffffff" },
          today: { bg: "#f97316", border: "#ea580c", text: "#ffffff" },
          this_week: { bg: "#eab308", border: "#ca8a04", text: "#1a1a1a" },
          normal: { bg: "#22c55e", border: "#16a34a", text: "#ffffff" },
        };

        const colors = colorMap[urgency];

        // Extract mentee name (first part before " / " or full name)
        const menteeName = card.cardName.split(" / ")[0].trim();
        
        // Extract copywriter
        const copywriter = card.members?.split(",")[0]?.trim() || "";

        return {
          id: `${card.cardName}-${index}`,
          title: menteeName,
          start: card.prazoMaxRoteiros,
          allDay: true,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            card,
            copywriter,
            urgency,
            fullName: card.cardName,
            listName: card.listName,
            cardUrl: card.cardUrl,
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
      extendedProps: {
        copywriter: string;
        urgency: string;
      };
    };
  }) => {
    const { title, extendedProps } = eventInfo.event;
    const { copywriter } = extendedProps;

    return (
      <div className="px-1.5 py-0.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-1 text-xs font-medium truncate">
          {copywriter && (
            <span className="bg-black/20 px-1 rounded text-[10px] font-semibold shrink-0">
              {copywriter.split(" ")[0]}
            </span>
          )}
          <span className="truncate">{title}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Legenda de cores */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium text-muted-foreground">Legenda:</span>
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-[#ef4444] text-white hover:bg-[#dc2626]">
            Atrasado
          </Badge>
          <Badge className="bg-[#f97316] text-white hover:bg-[#ea580c]">
            Hoje
          </Badge>
          <Badge className="bg-[#eab308] text-[#1a1a1a] hover:bg-[#ca8a04]">
            Esta Semana
          </Badge>
          <Badge className="bg-[#22c55e] text-white hover:bg-[#16a34a]">
            No Prazo
          </Badge>
        </div>
      </div>

      {/* Calendário */}
      <div className="bg-card border rounded-lg p-4 min-h-[700px]">
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
          dayMaxEvents={4}
          moreLinkText={(num) => `+${num} mais`}
          moreLinkClick="popover"
          eventDisplay="block"
          displayEventEnd={false}
          firstDay={1}
          fixedWeekCount={false}
          showNonCurrentDates={true}
          eventClassNames="rounded-md shadow-sm"
          dayCellClassNames="hover:bg-muted/30 transition-colors"
          viewClassNames="fullcalendar-prioridade"
        />
      </div>
    </div>
  );
}
