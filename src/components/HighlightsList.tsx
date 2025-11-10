import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Highlight {
  id: string;
  text: string;
  color: string;
  startPos: number;
  endPos: number;
  annotation?: string;
}

interface CorAnalise {
  id: string;
  nome: string;
  cor: string;
}

interface HighlightsListProps {
  highlights: Highlight[];
  cores: CorAnalise[];
  filterColor: string;
  onFilterChange: (color: string) => void;
  onHighlightClick: (highlightId: string) => void;
  onRemoveHighlight: (highlightId: string) => void;
}

export const HighlightsList = ({
  highlights,
  cores,
  filterColor,
  onFilterChange,
  onHighlightClick,
  onRemoveHighlight,
}: HighlightsListProps) => {
  const filteredHighlights = filterColor === "all" 
    ? highlights 
    : highlights.filter(h => h.color === filterColor);

  const getColorName = (color: string) => {
    return cores.find(c => c.cor === color)?.nome || "Sem cor";
  };

  const getHighlightCountByColor = (color: string) => {
    return highlights.filter(h => h.color === color).length;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Palavras Grifadas</h3>
      
      {/* Filtro por cor */}
      <Select value={filterColor} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filtrar por cor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Todas as cores ({highlights.length})
          </SelectItem>
          {cores.map((cor) => {
            const count = getHighlightCountByColor(cor.cor);
            return (
              <SelectItem key={cor.id} value={cor.cor}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: cor.cor }}
                  />
                  {cor.nome} ({count})
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Lista de highlights */}
      <ScrollArea className="h-[400px] pr-3">
        <div className="space-y-2">
          {filteredHighlights.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma palavra grifada
              {filterColor !== "all" && " com esta cor"}
            </p>
          ) : (
            filteredHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className="group relative bg-card border rounded-lg p-2 hover:bg-accent transition-colors"
              >
                <button
                  onClick={() => onHighlightClick(highlight.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded-full border flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium break-words">
                        "{highlight.text}"
                      </p>
                      {highlight.annotation && (
                        <div className="mt-1 flex items-start gap-1">
                          <span className="text-xs">💬</span>
                          <p className="text-xs text-muted-foreground italic break-words">
                            {highlight.annotation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHighlight(highlight.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
