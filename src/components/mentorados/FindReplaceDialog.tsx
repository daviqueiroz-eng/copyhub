import { useState, useEffect, useCallback } from "react";
import { Search, Replace, ChevronUp, ChevronDown, X, CaseSensitive, Regex } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "@/hooks/use-toast";

interface RoteiroLocal {
  headline: string;
  estrutura: string;
}

interface Match {
  guiaNumero: number;
  ordem: number;
  field: "headline" | "estrutura";
  startIndex: number;
  endIndex: number;
  text: string;
}

interface FindReplaceDialogProps {
  open: boolean;
  onClose: () => void;
  roteirosLocais: Map<string, RoteiroLocal>;
  guias: { numero: number; quantidade: number }[];
  onReplace: (guiaNumero: number, ordem: number, field: "headline" | "estrutura", newValue: string) => void;
  onHighlightMatch: (match: Match | null) => void;
}

export const FindReplaceDialog = ({
  open,
  onClose,
  roteirosLocais,
  guias,
  onReplace,
  onHighlightMatch,
}: FindReplaceDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Find all matches
  const findMatches = useCallback(() => {
    if (!searchTerm.trim()) {
      setMatches([]);
      onHighlightMatch(null);
      return;
    }

    const newMatches: Match[] = [];
    
    try {
      const regex = useRegex
        ? new RegExp(searchTerm, caseSensitive ? "g" : "gi")
        : new RegExp(escapeRegex(searchTerm), caseSensitive ? "g" : "gi");

      guias.forEach((guia) => {
        for (let ordem = 1; ordem <= guia.quantidade; ordem++) {
          const key = `${guia.numero}-${ordem}`;
          const roteiro = roteirosLocais.get(key);
          
          if (roteiro) {
            // Search in headline
            let match;
            while ((match = regex.exec(roteiro.headline)) !== null) {
              newMatches.push({
                guiaNumero: guia.numero,
                ordem,
                field: "headline",
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                text: match[0],
              });
            }
            regex.lastIndex = 0;

            // Search in estrutura
            while ((match = regex.exec(roteiro.estrutura)) !== null) {
              newMatches.push({
                guiaNumero: guia.numero,
                ordem,
                field: "estrutura",
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                text: match[0],
              });
            }
            regex.lastIndex = 0;
          }
        }
      });
    } catch (e) {
      // Invalid regex
    }

    setMatches(newMatches);
    setCurrentMatchIndex(0);
    
    if (newMatches.length > 0) {
      onHighlightMatch(newMatches[0]);
    } else {
      onHighlightMatch(null);
    }
  }, [searchTerm, caseSensitive, useRegex, roteirosLocais, guias, onHighlightMatch]);

  useEffect(() => {
    if (open) {
      findMatches();
    }
  }, [open, searchTerm, caseSensitive, useRegex, roteirosLocais, findMatches]);

  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const goToNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    onHighlightMatch(matches[nextIndex]);
  };

  const goToPrevious = () => {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    onHighlightMatch(matches[prevIndex]);
  };

  const handleReplaceCurrent = () => {
    if (matches.length === 0 || !matches[currentMatchIndex]) return;

    const match = matches[currentMatchIndex];
    const key = `${match.guiaNumero}-${match.ordem}`;
    const roteiro = roteirosLocais.get(key);
    
    if (!roteiro) return;

    const currentValue = roteiro[match.field];
    const newValue = 
      currentValue.substring(0, match.startIndex) +
      replaceTerm +
      currentValue.substring(match.endIndex);

    onReplace(match.guiaNumero, match.ordem, match.field, newValue);

    toast({
      title: "Substituído",
      description: `"${match.text}" → "${replaceTerm}"`,
    });

    // Re-run search after a small delay
    setTimeout(() => findMatches(), 100);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    let replacementCount = 0;
    const processedKeys = new Set<string>();

    // Group matches by roteiro to avoid multiple updates
    const groupedMatches = new Map<string, Match[]>();
    matches.forEach((match) => {
      const key = `${match.guiaNumero}-${match.ordem}-${match.field}`;
      if (!groupedMatches.has(key)) {
        groupedMatches.set(key, []);
      }
      groupedMatches.get(key)!.push(match);
    });

    groupedMatches.forEach((fieldMatches, groupKey) => {
      const [guiaStr, ordemStr, field] = groupKey.split("-");
      const guiaNumero = parseInt(guiaStr);
      const ordem = parseInt(ordemStr);
      const key = `${guiaNumero}-${ordem}`;
      const roteiro = roteirosLocais.get(key);
      
      if (!roteiro) return;

      let currentValue = roteiro[field as "headline" | "estrutura"];
      
      // Replace from end to start to maintain indices
      const sortedMatches = [...fieldMatches].sort((a, b) => b.startIndex - a.startIndex);
      
      sortedMatches.forEach((match) => {
        currentValue = 
          currentValue.substring(0, match.startIndex) +
          replaceTerm +
          currentValue.substring(match.endIndex);
        replacementCount++;
      });

      onReplace(guiaNumero, ordem, field as "headline" | "estrutura", currentValue);
    });

    toast({
      title: "Substituições concluídas",
      description: `${replacementCount} ocorrências substituídas em todos os roteiros.`,
    });

    // Clear matches after replace all
    setTimeout(() => findMatches(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      goToNext();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      goToPrevious();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed top-16 right-6 z-50 bg-card border rounded-lg shadow-lg p-4 w-96"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-poppins font-semibold text-sm flex items-center gap-2">
          <Search className="h-4 w-4" />
          Localizar e Substituir
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Localizar..."
              className="pl-9 font-poppins"
              autoFocus
            />
          </div>
          <Toggle
            pressed={caseSensitive}
            onPressedChange={setCaseSensitive}
            size="sm"
            title="Diferenciar maiúsculas/minúsculas"
          >
            <CaseSensitive className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={useRegex}
            onPressedChange={setUseRegex}
            size="sm"
            title="Usar expressão regular"
          >
            <Regex className="h-4 w-4" />
          </Toggle>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Replace className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Substituir por..."
              className="pl-9 font-poppins"
            />
          </div>
        </div>

        {/* Results counter and navigation */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-poppins">
            {matches.length > 0
              ? `${currentMatchIndex + 1} de ${matches.length} ocorrências`
              : searchTerm
              ? "Nenhuma ocorrência"
              : "Digite para buscar"}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={goToPrevious}
              disabled={matches.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={goToNext}
              disabled={matches.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Replace buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleReplaceCurrent}
            disabled={matches.length === 0}
          >
            Substituir
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
          >
            Substituir tudo ({matches.length})
          </Button>
        </div>

        {/* Current match info */}
        {matches.length > 0 && matches[currentMatchIndex] && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 font-poppins">
            📍 Guia {matches[currentMatchIndex].guiaNumero}, Roteiro {matches[currentMatchIndex].ordem} 
            ({matches[currentMatchIndex].field === "headline" ? "Headline" : "Estrutura"})
          </div>
        )}
      </div>
    </div>
  );
};
