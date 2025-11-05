import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoteiros } from "@/hooks/useRoteiros";
import { useProgressoRoteiros, useCompletarRoteiro } from "@/hooks/useProgressoRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Highlight = {
  text: string;
  color: string;
  startPos: number;
  endPos: number;
};

const AnaliseRoteiroGame = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: roteiros = [], isLoading: loadingRoteiros } = useRoteiros();
  const { data: progressoData = [], isLoading: loadingProgresso } = useProgressoRoteiros();
  const { data: cores = [], isLoading: loadingCores } = useCoresAnalise();
  const completarRoteiro = useCompletarRoteiro();

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsHistory, setHighlightsHistory] = useState<Highlight[][]>([]);
  const [currentRoteiroId, setCurrentRoteiroId] = useState<string | null>(null);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  
  // Campos de análise
  const [estruturaInvisivel, setEstruturaInvisivel] = useState("");
  const [gatilhosAtencao, setGatilhosAtencao] = useState("");
  const [estruturaRoteiro, setEstruturaRoteiro] = useState("");

  // Selecionar automaticamente o primeiro roteiro não completado
  useEffect(() => {
    if (roteiros.length > 0 && progressoData.length >= 0) {
      const roteiroNaoCompletado = roteiros.find(
        (r) => !progressoData.some((p) => p.roteiro_id === r.id && p.completado)
      );
      
      if (roteiroNaoCompletado) {
        setCurrentRoteiroId(roteiroNaoCompletado.id);
      } else if (roteiros.length > 0) {
        // Se todos completados, mostra o primeiro
        setCurrentRoteiroId(roteiros[0].id);
      }
    }
  }, [roteiros, progressoData]);

  // Selecionar primeira cor automaticamente
  useEffect(() => {
    if (cores.length > 0 && !selectedColor) {
      setSelectedColor(cores[0].cor);
    }
  }, [cores, selectedColor]);

  const currentRoteiro = roteiros.find((r) => r.id === currentRoteiroId);
  const completedRoteiros = roteiros.filter((r) => 
    progressoData.some((p) => p.roteiro_id === r.id && p.completado)
  );

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selectedColor) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    const container = document.getElementById("roteiro-content");
    if (!container) return;

    preCaretRange.selectNodeContents(container);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const startPos = preCaretRange.toString().length;
    const endPos = startPos + selectedText.length;

    const newHighlight = {
      text: selectedText,
      color: selectedColor,
      startPos,
      endPos,
    };

    setHighlightsHistory([...highlightsHistory, highlights]);
    setHighlights([...highlights, newHighlight]);

    selection.removeAllRanges();
  };

  const handleUndo = () => {
    if (highlightsHistory.length > 0) {
      const previousState = highlightsHistory[highlightsHistory.length - 1];
      setHighlights(previousState);
      setHighlightsHistory(highlightsHistory.slice(0, -1));
    }
  };

  const handleVerify = () => {
    if (!currentRoteiroId) return;

    // Validar se os campos foram preenchidos
    if (!estruturaInvisivel.trim() || !gatilhosAtencao.trim() || !estruturaRoteiro.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos de análise antes de completar.",
        variant: "destructive",
      });
      return;
    }

    completarRoteiro.mutate(currentRoteiroId, {
      onSuccess: () => {
        // Limpar campos e highlights
        setHighlights([]);
        setHighlightsHistory([]);
        setEstruturaInvisivel("");
        setGatilhosAtencao("");
        setEstruturaRoteiro("");
        
        // Mostrar banco de roteiros analisados
        setShowCompletedDialog(true);
        
        // Buscar próximo roteiro não completado
        const proximoRoteiro = roteiros.find(
          (r) =>
            r.id !== currentRoteiroId &&
            !progressoData.some((p) => p.roteiro_id === r.id && p.completado)
        );
        
        if (proximoRoteiro) {
          setCurrentRoteiroId(proximoRoteiro.id);
        }
      },
    });
  };

  const renderHighlightedText = (text: string) => {
    if (highlights.length === 0) return text;

    const sortedHighlights = [...highlights].sort((a, b) => a.startPos - b.startPos);
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      if (highlight.startPos > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{text.slice(lastIndex, highlight.startPos)}</span>
        );
      }

      parts.push(
        <mark
          key={`highlight-${idx}`}
          style={{
            backgroundColor: highlight.color,
            padding: "2px 0",
            borderRadius: "2px",
          }}
        >
          {text.slice(highlight.startPos, highlight.endPos)}
        </mark>
      );

      lastIndex = highlight.endPos;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return parts;
  };

  if (loadingRoteiros || loadingProgresso || loadingCores) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <p className="text-lg">Por favor, faça login para acessar o jogo.</p>
        </Card>
      </div>
    );
  }

  if (!currentRoteiro) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <p className="text-lg">Nenhum roteiro disponível no momento.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Roteiro</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_1fr] gap-6">
        {/* Coluna Esquerda - Legenda de Cores */}
        <Card className="p-4 h-fit">
          <h3 className="text-sm font-semibold mb-3">Legenda</h3>
          <div className="space-y-2">
            {cores.map((cor) => (
              <button
                key={cor.id}
                onClick={() => setSelectedColor(cor.cor)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-accent ${
                  selectedColor === cor.cor ? "bg-accent ring-2 ring-primary" : ""
                }`}
              >
                <div
                  className="w-5 h-5 rounded border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: cor.cor }}
                />
                <span className="text-xs font-medium text-left">{cor.nome}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Coluna Central - Conteúdo do Roteiro */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{currentRoteiro.titulo}</h2>
          <div
            id="roteiro-content"
            className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed select-text cursor-text"
            onMouseUp={handleTextSelection}
          >
            {renderHighlightedText(currentRoteiro.conteudo)}
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={highlightsHistory.length === 0}
              title="Desfazer último sublinhado (Ctrl+Z)"
            >
              Desfazer
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setHighlights([]);
                setHighlightsHistory([]);
                setEstruturaInvisivel("");
                setGatilhosAtencao("");
                setEstruturaRoteiro("");
              }}
            >
              Limpar Tudo
            </Button>
            <Button onClick={handleVerify} disabled={completarRoteiro.isPending}>
              {completarRoteiro.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Completar Roteiro"
              )}
            </Button>
          </div>
        </Card>

        {/* Coluna Direita - Análise */}
        <div className="space-y-4">
          {/* Campo 1: Estrutura Invisível */}
          <Card className="p-4">
            <Label htmlFor="estrutura-invisivel" className="text-sm font-medium mb-2 block">
              Retire a estrutura invisível
            </Label>
            <Textarea
              id="estrutura-invisivel"
              value={estruturaInvisivel}
              onChange={(e) => setEstruturaInvisivel(e.target.value)}
              placeholder="Descreva a estrutura invisível do roteiro..."
              className="min-h-[150px] resize-none"
            />
          </Card>

          {/* Campo 2: 7 Gatilhos da Atenção */}
          <Card className="p-4">
            <Label htmlFor="gatilhos-atencao" className="text-sm font-medium mb-2 block">
              Quais os 7 gatilhos da atenção presente na headline?
            </Label>
            <Textarea
              id="gatilhos-atencao"
              value={gatilhosAtencao}
              onChange={(e) => setGatilhosAtencao(e.target.value)}
              placeholder="Liste os 7 gatilhos da atenção..."
              className="min-h-[120px] resize-none"
            />
          </Card>

          {/* Campo 3: Estrutura do Roteiro */}
          <Card className="p-4">
            <Label htmlFor="estrutura-roteiro" className="text-sm font-medium mb-2 block">
              Estrutura do roteiro
            </Label>
            <Textarea
              id="estrutura-roteiro"
              value={estruturaRoteiro}
              onChange={(e) => setEstruturaRoteiro(e.target.value)}
              placeholder="Descreva a estrutura do roteiro..."
              className="min-h-[150px] resize-none"
            />
          </Card>
        </div>
      </div>

      {/* Dialog de Roteiros Completados */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Banco de Roteiros Analisados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {completedRoteiros.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum roteiro completado ainda.
              </p>
            ) : (
              completedRoteiros.map((roteiro) => {
                const progresso = progressoData.find(
                  (p) => p.roteiro_id === roteiro.id && p.completado
                );
                return (
                  <Card key={roteiro.id} className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{roteiro.titulo}</h3>
                    {progresso?.data_completado && (
                      <p className="text-sm text-muted-foreground">
                        Completado em:{" "}
                        {new Date(progresso.data_completado).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {roteiro.link_video && (
                      <a
                        href={roteiro.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        Ver vídeo
                      </a>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnaliseRoteiroGame;
