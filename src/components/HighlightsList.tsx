import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Highlight {
  id: string;
  text: string;
  color: string;
  startPos: number;
  endPos: number;
  annotation?: string;
  annotations?: string[];
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

  const getAnnotationsDisplay = (highlight: Highlight) => {
    const annotations = highlight.annotations?.length 
      ? highlight.annotations 
      : (highlight.annotation ? [highlight.annotation] : []);
    return annotations;
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

      {/* Lista de highlights em layout horizontal */}
      <ScrollArea className="h-[300px] pr-3">
        {filteredHighlights.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma palavra grifada
            {filterColor !== "all" && " com esta cor"}
          </p>
        ) : (
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {filteredHighlights.map((highlight) => {
                const annotations = getAnnotationsDisplay(highlight);
                const truncatedText = highlight.text.length > 25 
                  ? `${highlight.text.slice(0, 25)}...` 
                  : highlight.text;
                
                return (
                  <Tooltip key={highlight.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="group relative bg-card border rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer max-w-[200px]"
                        onClick={() => onHighlightClick(highlight.id)}
                      >
                        <div className="flex items-center gap-1.5 pr-5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: highlight.color }}
                          />
                          <span className="text-xs truncate font-medium">
                            {truncatedText}
                          </span>
                        </div>
                        
                        {/* Badges de anotações */}
                        {annotations.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {annotations.slice(0, 2).map((ann, i) => (
                              <span 
                                key={i} 
                                className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[80px]"
                              >
                                {ann.length > 10 ? `${ann.slice(0, 10)}...` : ann}
                              </span>
                            ))}
                            {annotations.length > 2 && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                +{annotations.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Botão de excluir */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-0.5 right-0.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveHighlight(highlight.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px]">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">"{highlight.text}"</p>
                        <p className="text-xs text-muted-foreground">{getColorName(highlight.color)}</p>
                        {annotations.length > 0 && (
                          <div className="pt-1 border-t">
                            {annotations.map((ann, i) => (
                              <p key={i} className="text-xs italic">💬 {ann}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </ScrollArea>
    </div>
  );
};
