import { useState, useCallback } from "react";
import { X, Check, Loader2, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RoteiroLocal {
  headline: string;
  estrutura: string;
}

interface SpellError {
  id: string;
  type: "spacing" | "punctuation" | "spelling" | "duplicate" | "trim" | "grammar";
  original: string;
  suggestion: string;
  guiaNumero: number;
  ordem: number;
  field: "headline" | "estrutura";
  startIndex: number;
  endIndex: number;
  message: string;
}

interface SpellCheckerPanelProps {
  open: boolean;
  onClose: () => void;
  roteirosLocais: Map<string, RoteiroLocal>;
  guias: { numero: number; quantidade: number }[];
  guiaAtiva: number;
  onFix: (guiaNumero: number, ordem: number, field: "headline" | "estrutura", newValue: string) => void;
}

export const SpellCheckerPanel = ({
  open,
  onClose,
  roteirosLocais,
  guias,
  guiaAtiva,
  onFix,
}: SpellCheckerPanelProps) => {
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [checkAllGuias, setCheckAllGuias] = useState(false);

  // Local pattern-based checks (no AI needed)
  const runLocalChecks = useCallback((text: string, guiaNumero: number, ordem: number, field: "headline" | "estrutura"): SpellError[] => {
    const localErrors: SpellError[] = [];
    let errorId = 0;

    // 1. Double spaces
    const doubleSpaceRegex = /  +/g;
    let match;
    while ((match = doubleSpaceRegex.exec(text)) !== null) {
      localErrors.push({
        id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
        type: "spacing",
        original: match[0],
        suggestion: " ",
        guiaNumero,
        ordem,
        field,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message: `Espaço duplo encontrado`,
      });
    }

    // 2. Space before punctuation
    const spaceBeforePunctRegex = / ([.,;:!?])/g;
    while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
      localErrors.push({
        id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
        type: "punctuation",
        original: match[0],
        suggestion: match[1],
        guiaNumero,
        ordem,
        field,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message: `Espaço antes de "${match[1]}"`,
      });
    }

    // 3. Missing space after punctuation (except at end of string)
    const missingSpaceAfterRegex = /([.,;:!?])([a-zA-ZÀ-ú])/g;
    while ((match = missingSpaceAfterRegex.exec(text)) !== null) {
      localErrors.push({
        id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
        type: "punctuation",
        original: match[0],
        suggestion: `${match[1]} ${match[2]}`,
        guiaNumero,
        ordem,
        field,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message: `Falta espaço após "${match[1]}"`,
      });
    }

    // 4. Duplicate consecutive words
    const duplicateWordRegex = /\b(\w+)\s+\1\b/gi;
    while ((match = duplicateWordRegex.exec(text)) !== null) {
      localErrors.push({
        id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
        type: "duplicate",
        original: match[0],
        suggestion: match[1],
        guiaNumero,
        ordem,
        field,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message: `Palavra duplicada: "${match[1]}"`,
      });
    }

    // 5. Leading/trailing whitespace
    if (text !== text.trim()) {
      if (text.startsWith(" ") || text.startsWith("\t")) {
        localErrors.push({
          id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
          type: "trim",
          original: text,
          suggestion: text.trimStart(),
          guiaNumero,
          ordem,
          field,
          startIndex: 0,
          endIndex: text.length - text.trimStart().length,
          message: "Espaços no início do texto",
        });
      }
      if (text.endsWith(" ") || text.endsWith("\t")) {
        const trimmed = text.trimEnd();
        localErrors.push({
          id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
          type: "trim",
          original: text,
          suggestion: trimmed,
          guiaNumero,
          ordem,
          field,
          startIndex: trimmed.length,
          endIndex: text.length,
          message: "Espaços no final do texto",
        });
      }
    }

    // 6. Multiple consecutive line breaks (more than 2)
    const multiLineBreakRegex = /\n{3,}/g;
    while ((match = multiLineBreakRegex.exec(text)) !== null) {
      localErrors.push({
        id: `local-${guiaNumero}-${ordem}-${field}-${errorId++}`,
        type: "spacing",
        original: match[0],
        suggestion: "\n\n",
        guiaNumero,
        ordem,
        field,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        message: "Múltiplas linhas em branco consecutivas",
      });
    }

    return localErrors;
  }, []);

  // AI-based spell checking
  const runAICheck = useCallback(async (text: string, guiaNumero: number, ordem: number, field: "headline" | "estrutura"): Promise<SpellError[]> => {
    if (text.trim().length < 10) return []; // Skip very short texts

    try {
      const { data, error } = await supabase.functions.invoke("spell-check", {
        body: { text, language: "pt-BR" },
      });

      if (error) {
        console.error("Spell check error:", error);
        return [];
      }

      if (data?.errors && Array.isArray(data.errors)) {
        return data.errors.map((err: any, idx: number) => ({
          id: `ai-${guiaNumero}-${ordem}-${field}-${idx}`,
          type: err.type || "spelling",
          original: err.original || "",
          suggestion: err.suggestion || "",
          guiaNumero,
          ordem,
          field,
          startIndex: err.position || 0,
          endIndex: (err.position || 0) + (err.original?.length || 0),
          message: err.message || `Sugestão: "${err.suggestion}"`,
        }));
      }
    } catch (e) {
      console.error("AI spell check failed:", e);
    }
    return [];
  }, []);

  const analyzeRoteiros = useCallback(async () => {
    setIsAnalyzing(true);
    setErrors([]);
    setIgnoredIds(new Set());

    const allErrors: SpellError[] = [];
    const guiasToCheck = checkAllGuias ? guias : guias.filter(g => g.numero === guiaAtiva);

    // Run local checks first (fast)
    guiasToCheck.forEach((guia) => {
      for (let ordem = 1; ordem <= guia.quantidade; ordem++) {
        const key = `${guia.numero}-${ordem}`;
        const roteiro = roteirosLocais.get(key);
        
        if (roteiro) {
          if (roteiro.headline) {
            allErrors.push(...runLocalChecks(roteiro.headline, guia.numero, ordem, "headline"));
          }
          if (roteiro.estrutura) {
            allErrors.push(...runLocalChecks(roteiro.estrutura, guia.numero, ordem, "estrutura"));
          }
        }
      }
    });

    // Run AI checks (slower, one at a time to avoid rate limiting)
    for (const guia of guiasToCheck) {
      for (let ordem = 1; ordem <= guia.quantidade; ordem++) {
        const key = `${guia.numero}-${ordem}`;
        const roteiro = roteirosLocais.get(key);
        
        if (roteiro) {
          if (roteiro.headline && roteiro.headline.length >= 10) {
            const aiErrors = await runAICheck(roteiro.headline, guia.numero, ordem, "headline");
            allErrors.push(...aiErrors);
          }
          if (roteiro.estrutura && roteiro.estrutura.length >= 10) {
            const aiErrors = await runAICheck(roteiro.estrutura, guia.numero, ordem, "estrutura");
            allErrors.push(...aiErrors);
          }
        }
      }
    }

    setErrors(allErrors);
    setIsAnalyzing(false);

    if (allErrors.length === 0) {
      toast({
        title: "Nenhum problema encontrado",
        description: "Os roteiros estão sem erros detectáveis.",
      });
    } else {
      toast({
        title: "Análise concluída",
        description: `${allErrors.length} problemas encontrados.`,
      });
    }
  }, [roteirosLocais, guias, guiaAtiva, checkAllGuias, runLocalChecks, runAICheck]);

  const handleFix = (error: SpellError) => {
    const key = `${error.guiaNumero}-${error.ordem}`;
    const roteiro = roteirosLocais.get(key);
    if (!roteiro) return;

    let currentValue = roteiro[error.field];
    let newValue: string;

    if (error.type === "trim") {
      // For trim errors, apply the suggestion directly
      newValue = error.suggestion;
    } else {
      // For other errors, replace at specific position
      newValue = 
        currentValue.substring(0, error.startIndex) +
        error.suggestion +
        currentValue.substring(error.endIndex);
    }

    onFix(error.guiaNumero, error.ordem, error.field, newValue);
    
    // Remove this error from list
    setErrors(prev => prev.filter(e => e.id !== error.id));

    toast({
      title: "Corrigido",
      description: `"${error.original}" → "${error.suggestion}"`,
    });
  };

  const handleIgnore = (errorId: string) => {
    setIgnoredIds(prev => new Set(prev).add(errorId));
  };

  const handleFixAll = () => {
    const visibleErrors = errors.filter(e => !ignoredIds.has(e.id));
    
    // Group by roteiro and field
    const grouped = new Map<string, SpellError[]>();
    visibleErrors.forEach(error => {
      const key = `${error.guiaNumero}-${error.ordem}-${error.field}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(error);
    });

    grouped.forEach((fieldErrors, groupKey) => {
      const [guiaStr, ordemStr, field] = groupKey.split("-");
      const guiaNumero = parseInt(guiaStr);
      const ordem = parseInt(ordemStr);
      const key = `${guiaNumero}-${ordem}`;
      const roteiro = roteirosLocais.get(key);
      
      if (!roteiro) return;

      let currentValue = roteiro[field as "headline" | "estrutura"];
      
      // Sort by startIndex descending to replace from end
      const sortedErrors = [...fieldErrors].sort((a, b) => b.startIndex - a.startIndex);
      
      sortedErrors.forEach(error => {
        if (error.type === "trim") {
          currentValue = error.suggestion;
        } else {
          currentValue = 
            currentValue.substring(0, error.startIndex) +
            error.suggestion +
            currentValue.substring(error.endIndex);
        }
      });

      onFix(guiaNumero, ordem, field as "headline" | "estrutura", currentValue);
    });

    const fixedCount = visibleErrors.length;
    setErrors([]);
    
    toast({
      title: "Correções aplicadas",
      description: `${fixedCount} correções aplicadas automaticamente.`,
    });
  };

  const visibleErrors = errors.filter(e => !ignoredIds.has(e.id));

  const getErrorIcon = (type: SpellError["type"]) => {
    switch (type) {
      case "spacing":
        return "⎵";
      case "punctuation":
        return ".,";
      case "spelling":
        return "Aa";
      case "duplicate":
        return "2x";
      case "trim":
        return "↹";
      case "grammar":
        return "📝";
      default:
        return "?";
    }
  };

  const getErrorColor = (type: SpellError["type"]) => {
    switch (type) {
      case "spelling":
      case "grammar":
        return "text-red-500";
      case "punctuation":
        return "text-orange-500";
      case "spacing":
      case "trim":
      case "duplicate":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed top-16 right-6 z-50 bg-card border rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-poppins font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Corretor Automático
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-2"
            onClick={analyzeRoteiros}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Analisar
              </>
            )}
          </Button>
          {visibleErrors.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleFixAll}
            >
              <Check className="h-4 w-4" />
              Corrigir tudo
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant={checkAllGuias ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setCheckAllGuias(!checkAllGuias)}
          >
            {checkAllGuias ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Todas as guias
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Apenas Guia {guiaAtiva}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {visibleErrors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isAnalyzing ? (
                <p className="font-poppins text-sm">Analisando roteiros...</p>
              ) : errors.length === 0 ? (
                <p className="font-poppins text-sm">
                  Clique em "Analisar" para verificar os roteiros.
                </p>
              ) : (
                <p className="font-poppins text-sm">
                  Todos os problemas foram corrigidos ou ignorados.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-poppins">
                {visibleErrors.length} problema{visibleErrors.length !== 1 ? "s" : ""} encontrado{visibleErrors.length !== 1 ? "s" : ""}
              </p>
              
              {visibleErrors.map((error) => (
                <div
                  key={error.id}
                  className="bg-muted/50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-mono ${getErrorColor(error.type)}`}>
                        {getErrorIcon(error.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-poppins">{error.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Guia {error.guiaNumero}, Roteiro {error.ordem} ({error.field === "headline" ? "Headline" : "Estrutura"})
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background rounded p-2 text-xs font-mono">
                    <span className="text-red-500 line-through">{error.original}</span>
                    {" → "}
                    <span className="text-green-500">{error.suggestion}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleFix(error)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Corrigir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleIgnore(error.id)}
                    >
                      Ignorar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
