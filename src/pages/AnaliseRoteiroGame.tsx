import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoteiros } from "@/hooks/useRoteiros";
import { useProgressoRoteiros, useCompletarRoteiro } from "@/hooks/useProgressoRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";

const AnaliseRoteiroGame = () => {
  const { user } = useAuth();
  const { data: roteiros = [], isLoading: loadingRoteiros } = useRoteiros();
  const { data: progresso = [], isLoading: loadingProgresso } = useProgressoRoteiros();
  const { data: cores = [], isLoading: loadingCores } = useCoresAnalise();
  const completarRoteiro = useCompletarRoteiro();
  const { toast } = useToast();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedRoteiroId, setSelectedRoteiroId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<{
    text: string;
    color: string;
    start: number;
    end: number;
  }>>([]);

  // Selecionar primeiro roteiro não completado automaticamente
  useEffect(() => {
    if (roteiros.length > 0 && !selectedRoteiroId) {
      const primeiroNaoCompletado = roteiros.find(r => 
        !progresso.some(p => p.roteiro_id === r.id && p.completado)
      );
      setSelectedRoteiroId(primeiroNaoCompletado?.id || roteiros[0].id);
    }
  }, [roteiros, progresso, selectedRoteiroId]);

  const roteiroAtual = roteiros.find(r => r.id === selectedRoteiroId);
  
  // Check if current roteiro is completed
  const isCompleted = roteiroAtual 
    ? progresso.some(p => p.roteiro_id === roteiroAtual.id && p.completado)
    : false;

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectedColor || selection.toString().trim() === "") return;

    const range = selection.getRangeAt(0);
    const text = selection.toString();
    
    // Get the position relative to the content
    const preSelectionRange = range.cloneRange();
    const container = document.getElementById("roteiro-content");
    if (!container) return;
    
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + text.length;

    setHighlights([...highlights, {
      text,
      color: selectedColor,
      start,
      end,
    }]);

    selection.removeAllRanges();
  };

  const handleVerify = () => {
    // TODO: Implement verification logic against sublinhados_corretos
    // For now, just mark as completed
    if (roteiroAtual) {
      completarRoteiro.mutate(roteiroAtual.id);
      setHighlights([]);
    }
  };

  const renderHighlightedText = () => {
    if (!roteiroAtual) return null;

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((highlight, i) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {roteiroAtual.conteudo.substring(lastIndex, highlight.start)}
          </span>
        );
      }

      // Add highlighted text
      parts.push(
        <mark
          key={`highlight-${i}`}
          style={{ backgroundColor: highlight.color }}
          className="px-1 rounded"
        >
          {highlight.text}
        </mark>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < roteiroAtual.conteudo.length) {
      parts.push(
        <span key="text-end">
          {roteiroAtual.conteudo.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Você precisa estar logado para jogar.</p>
      </div>
    );
  }

  if (loadingRoteiros || loadingProgresso || loadingCores) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (roteiros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Nenhum roteiro disponível ainda.</p>
        <p className="text-sm text-muted-foreground">
          Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  if (!roteiroAtual) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roteirosCompletados = progresso.filter(p => p.completado).length;
  const roteirosDisponiveis = roteiros.length;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Análise de Roteiro
            </h2>
            <p className="text-muted-foreground">
              {roteirosCompletados} de {roteirosDisponiveis} roteiros completados
            </p>
          </div>
          {isCompleted && (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          )}
        </div>

        {/* Seletor de Roteiros */}
        <div className="flex flex-wrap gap-2">
          {roteiros.map((roteiro) => {
            const completo = progresso.some(p => p.roteiro_id === roteiro.id && p.completado);
            return (
              <Button
                key={roteiro.id}
                variant={selectedRoteiroId === roteiro.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedRoteiroId(roteiro.id);
                  setHighlights([]);
                }}
                className="relative"
              >
                {completo && (
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                )}
                {roteiro.titulo}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Color Palette */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Selecione uma cor:</p>
          <div className="flex flex-wrap gap-2">
            {cores.map((cor) => (
              <button
                key={cor.id}
                onClick={() => setSelectedColor(cor.cor)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedColor === cor.cor
                    ? "border-primary scale-105"
                    : "border-transparent hover:border-border"
                }`}
                style={{ backgroundColor: cor.cor }}
              >
                <span className="text-sm font-medium text-white mix-blend-difference">
                  {cor.nome}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roteiro Content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div
            id="roteiro-content"
            className="prose dark:prose-invert max-w-none"
            onMouseUp={handleTextSelection}
            style={{ userSelect: "text", cursor: selectedColor ? "text" : "default" }}
          >
            <div className="whitespace-pre-wrap leading-relaxed">
              {highlights.length === 0 ? roteiroAtual.conteudo : renderHighlightedText()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setHighlights([])}
          disabled={highlights.length === 0}
        >
          Limpar Sublinhados
        </Button>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-muted-foreground">
            {highlights.length} sublinhados
          </span>
          <Button
            onClick={handleVerify}
            disabled={highlights.length === 0 || completarRoteiro.isPending}
          >
            {completarRoteiro.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar e Completar"
            )}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8 bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Como jogar:</strong> Selecione uma cor da paleta acima e sublinha o texto
            do roteiro de acordo com as categorias indicadas. Quando terminar, clique em
            "Verificar e Completar" para validar suas escolhas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnaliseRoteiroGame;
