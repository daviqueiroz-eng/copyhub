import { useState, useMemo, useEffect } from "react";
import { Upload, Filter, AlertCircle, FileText, Check, ChevronsUpDown, Star, CalendarDays, LayoutGrid, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrelloUploadDialog } from "./TrelloUploadDialog";
import { PrioridadeCard } from "./PrioridadeCard";
import { PrioridadeCalendar } from "./PrioridadeCalendar";
import {
  useTrelloImport,
  extractUniqueCopywriters,
  filterAndSortCards,
  TrelloCard,
} from "@/hooks/useTrelloImport";
import { useUserRole, useProfile } from "@/hooks/useAuth";
import { format, startOfDay, endOfWeek, endOfMonth, isSameDay, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodFilter = "all" | "today" | "week" | "month";
type ViewMode = "grid" | "calendar";

const FAVORITE_COPYWRITER_KEY = "favorito_copywriter";

export function OrdemPrioridadeView() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCopywriter, setSelectedCopywriter] = useState<string>("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [favoriteCopywriter, setFavoriteCopywriter] = useState<string>(() => {
    return localStorage.getItem(FAVORITE_COPYWRITER_KEY) || "";
  });
  
  const { data: trelloImport, isLoading } = useTrelloImport();
  const { data: userRole } = useUserRole();
  const { data: profile } = useProfile();
  const isAdmin = userRole === "admin";

  const cards = useMemo(() => {
    if (!trelloImport?.dados) return [];
    return trelloImport.dados as unknown as TrelloCard[];
  }, [trelloImport]);

  const copywriters = useMemo(() => {
    return extractUniqueCopywriters(cards);
  }, [cards]);

  // Auto-detect user's name in copywriters list
  const matchedCopywriter = useMemo(() => {
    if (!profile?.nome) return null;
    const profileName = profile.nome.toLowerCase();
    return copywriters.find(cw => {
      const cwLower = cw.toLowerCase();
      return cwLower.includes(profileName) || profileName.includes(cwLower);
    });
  }, [copywriters, profile?.nome]);

  // Handle favoriting a copywriter
  const handleFavorite = (copywriter: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteCopywriter === copywriter) {
      // Remove favorite
      localStorage.removeItem(FAVORITE_COPYWRITER_KEY);
      setFavoriteCopywriter("");
    } else {
      // Set new favorite
      localStorage.setItem(FAVORITE_COPYWRITER_KEY, copywriter);
      setFavoriteCopywriter(copywriter);
    }
  };

  // Auto-select favorite or matched copywriter when loaded
  useEffect(() => {
    if (!selectedCopywriter) {
      if (favoriteCopywriter && copywriters.includes(favoriteCopywriter)) {
        setSelectedCopywriter(favoriteCopywriter);
      } else if (matchedCopywriter) {
        setSelectedCopywriter(matchedCopywriter);
      }
    }
  }, [favoriteCopywriter, matchedCopywriter, copywriters, selectedCopywriter]);

  // Filter by copywriter first
  const copywriterFilteredCards = useMemo(() => {
    return filterAndSortCards(cards, selectedCopywriter);
  }, [cards, selectedCopywriter]);

  // Filter by period
  const filterByPeriod = (cardsToFilter: TrelloCard[], period: PeriodFilter): TrelloCard[] => {
    if (period === "all") return cardsToFilter;
    
    const now = new Date();
    const today = startOfDay(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);

    return cardsToFilter.filter(card => {
      if (!card.prazoMaxRoteiros) return false;
      const prazo = new Date(card.prazoMaxRoteiros);
      
      switch (period) {
        case "today":
          return isSameDay(prazo, today) || isBefore(prazo, today);
        case "week":
          return isBefore(prazo, weekEnd) || isSameDay(prazo, weekEnd);
        case "month":
          return isBefore(prazo, monthEnd) || isSameDay(prazo, monthEnd);
        default:
          return true;
      }
    });
  };

  const filteredCards = useMemo(() => {
    return filterByPeriod(copywriterFilteredCards, periodFilter);
  }, [copywriterFilteredCards, periodFilter]);

  // Calculate period counts for admin view
  const periodCounts = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);

    const cardsToCount = isAdmin ? cards : copywriterFilteredCards;

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    cardsToCount.forEach(card => {
      if (!card.prazoMaxRoteiros) return;
      const prazo = new Date(card.prazoMaxRoteiros);
      
      if (isSameDay(prazo, today) || isBefore(prazo, today)) {
        todayCount++;
      }
      if (isBefore(prazo, weekEnd) || isSameDay(prazo, weekEnd)) {
        weekCount++;
      }
      if (isBefore(prazo, monthEnd) || isSameDay(prazo, monthEnd)) {
        monthCount++;
      }
    });

    return { today: todayCount, week: weekCount, month: monthCount, all: cardsToCount.length };
  }, [cards, copywriterFilteredCards, isAdmin]);

  const lastUpdate = trelloImport?.created_at
    ? format(new Date(trelloImport.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full sm:w-[280px] justify-between text-sm"
                >
                  {selectedCopywriter
                    ? (
                      <span className="flex items-center gap-2 truncate">
                        {favoriteCopywriter === selectedCopywriter && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                        <span className="truncate">{selectedCopywriter}</span>
                      </span>
                    )
                    : "Buscar copywriter..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] sm:w-[320px] p-0">
                <Command>
                  <CommandInput placeholder="Digite seu nome..." />
                  <CommandList>
                    <CommandEmpty>Nenhum copywriter encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedCopywriter("");
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !selectedCopywriter ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Todos os copywriters
                      </CommandItem>
                      {copywriters.map((cw) => (
                        <CommandItem
                          key={cw}
                          value={cw}
                          onSelect={(currentValue) => {
                            setSelectedCopywriter(currentValue === selectedCopywriter ? "" : currentValue);
                            setComboboxOpen(false);
                          }}
                          className="flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedCopywriter === cw ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cw}
                            {cw === matchedCopywriter && (
                              <Badge variant="secondary" className="text-xs">Você</Badge>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleFavorite(cw, e)}
                            className="p-1 rounded hover:bg-accent transition-colors"
                            title={favoriteCopywriter === cw ? "Remover favorito" : "Favoritar para filtrar automaticamente"}
                          >
                            <Star 
                              className={cn(
                                "h-4 w-4 transition-colors",
                                favoriteCopywriter === cw 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : "text-muted-foreground hover:text-yellow-500"
                              )} 
                            />
                          </button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {isAdmin && (
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2 w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              <span className="sm:inline">Importar CSV</span>
            </Button>
          )}
        </div>

        {/* Filtro por período e toggle de visualização */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <ToggleGroup 
              type="single" 
              value={periodFilter} 
              onValueChange={(value) => value && setPeriodFilter(value as PeriodFilter)}
              className="justify-start flex-nowrap"
            >
              <ToggleGroupItem value="all" aria-label="Todos" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Todos
                <Badge variant="secondary" className="ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                  {periodCounts.all}
                </Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="today" aria-label="Hoje" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Hoje
                <Badge variant={periodCounts.today > 0 ? "destructive" : "secondary"} className="ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                  {periodCounts.today}
                </Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Semana" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Semana
                <Badge variant={periodCounts.week > 0 ? "default" : "secondary"} className="ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                  {periodCounts.week}
                </Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Mês" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                Mês
                <Badge variant="secondary" className="ml-1 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                  {periodCounts.month}
                </Badge>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Toggle Grid/Calendário */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="border rounded-lg p-1 bg-muted/50 self-start sm:self-auto"
          >
            <ToggleGroupItem value="grid" aria-label="Visualização em grade" className="gap-1 sm:gap-1.5 data-[state=on]:bg-background px-2 sm:px-3">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Grid</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Visualização em calendário" className="gap-1 sm:gap-1.5 data-[state=on]:bg-background px-2 sm:px-3">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Calendário</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Info do último import */}
      {lastUpdate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            Arquivo: <strong>{trelloImport?.nome_arquivo}</strong> • Importado em {lastUpdate}
          </span>
        </div>
      )}

      {/* Contador */}
      {selectedCopywriter && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">
                Você tem <Badge variant="secondary" className="mx-1">{filteredCards.length}</Badge> 
                {filteredCards.length === 1 ? " entrega pendente" : " entregas pendentes"}
                {periodFilter !== "all" && ` (${periodFilter === "today" ? "hoje" : periodFilter === "week" ? "esta semana" : "este mês"})`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cards ou estado vazio */}
      {!trelloImport ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum arquivo importado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAdmin 
                ? "Faça upload de um arquivo CSV do Trello para começar"
                : "Aguarde o administrador importar os dados do Trello"
              }
            </p>
            {isAdmin && (
              <Button onClick={() => setIsUploadOpen(true)} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredCards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCopywriter
                ? "Não há entregas pendentes para este copywriter com prazo definido"
                : "Selecione um copywriter para ver suas entregas"
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "calendar" ? (
        <PrioridadeCalendar cards={filteredCards} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {filteredCards.map((card, index) => (
            <PrioridadeCard key={`${card.cardName}-${index}`} card={card} />
          ))}
        </div>
      )}

      {/* Dialog de upload */}
      <TrelloUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
