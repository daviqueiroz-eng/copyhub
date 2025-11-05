import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useAuth";
import { useRoteiros, useCreateRoteiro } from "@/hooks/useRoteiros";
import { useProgressoRoteiros, useCompletarRoteiro } from "@/hooks/useProgressoRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { useNichos } from "@/hooks/useNichos";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, ExternalLink, FileUp, FileEdit, ArrowLeft } from "lucide-react";
import { RoteiroAnaliseView } from "@/components/RoteiroAnaliseView";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Highlight = {
  text: string;
  color: string;
  startPos: number;
  endPos: number;
};

const AnaliseRoteiroGame = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: userRole } = useUserRole();
  const { data: roteiros = [], isLoading: loadingRoteiros } = useRoteiros();
  const { data: progressoData = [], isLoading: loadingProgresso } = useProgressoRoteiros();
  const { data: cores = [], isLoading: loadingCores } = useCoresAnalise();
  const { data: nichos = [] } = useNichos();
  const completarRoteiro = useCompletarRoteiro();
  const createRoteiro = useCreateRoteiro();

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsHistory, setHighlightsHistory] = useState<Highlight[][]>([]);
  const [currentRoteiroId, setCurrentRoteiroId] = useState<string | null>(null);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showAnalysesDialog, setShowAnalysesDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  
  // Modo avulso
  const [isAnalysingAvulso, setIsAnalysingAvulso] = useState(false);
  const [roteiroAvulso, setRoteiroAvulso] = useState<{ titulo: string; conteudo: string } | null>(null);
  
  // Dialog novo roteiro (admin)
  const [showNovoRoteiroDialog, setShowNovoRoteiroDialog] = useState(false);
  const [novoRoteiroForm, setNovoRoteiroForm] = useState({
    titulo: "",
    conteudo: "",
    nicho_id: "",
    link_video: "",
    ordem: 0,
  });
  
  // Dialog roteiro avulso
  const [showAvulsoDialog, setShowAvulsoDialog] = useState(false);
  const [avulsoForm, setAvulsoForm] = useState({ titulo: "", conteudo: "" });
  
  // Campos de análise
  const [estruturaInvisivel, setEstruturaInvisivel] = useState("");
  const [gatilhosAtencao, setGatilhosAtencao] = useState("");
  const [estruturaRoteiro, setEstruturaRoteiro] = useState("");
  // Filtros
  const [selectedNicho, setSelectedNicho] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const currentRoteiro = isAnalysingAvulso && roteiroAvulso
    ? { id: "avulso", titulo: roteiroAvulso.titulo, conteudo: roteiroAvulso.conteudo }
    : roteiros.find((r) => r.id === currentRoteiroId);
  
  const completedRoteiros = roteiros.filter((r) => 
    progressoData.some((p) => p.roteiro_id === r.id && p.completado)
  );

  const isAdmin = userRole === "admin";
  const filteredRoteiros = roteiros.filter((r) =>
    (!selectedNicho || r.nicho_id === selectedNicho) &&
    (!searchTerm || r.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    if (isAnalysingAvulso) return;
    if (!filteredRoteiros.some((r) => r.id === currentRoteiroId || "")) {
      setCurrentRoteiroId(filteredRoteiros[0]?.id ?? null);
    }
  }, [selectedNicho, searchTerm, roteiros, isAnalysingAvulso]);

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

  const handleCreateRoteiro = () => {
    if (!novoRoteiroForm.titulo.trim() || !novoRoteiroForm.conteudo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createRoteiro.mutate({
      titulo: novoRoteiroForm.titulo,
      conteudo: novoRoteiroForm.conteudo,
      nicho_id: novoRoteiroForm.nicho_id || undefined,
      link_video: novoRoteiroForm.link_video || undefined,
      ordem: novoRoteiroForm.ordem,
    }, {
      onSuccess: () => {
        setShowNovoRoteiroDialog(false);
        setNovoRoteiroForm({ titulo: "", conteudo: "", nicho_id: "", link_video: "", ordem: 0 });
        toast({
          title: "Roteiro criado",
          description: "O novo roteiro foi adicionado com sucesso.",
        });
      },
    });
  };

  const handleStartAvulso = () => {
    if (!avulsoForm.titulo.trim() || !avulsoForm.conteudo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setRoteiroAvulso(avulsoForm);
    setIsAnalysingAvulso(true);
    setShowAvulsoDialog(false);
    setHighlights([]);
    setHighlightsHistory([]);
    setEstruturaInvisivel("");
    setGatilhosAtencao("");
    setEstruturaRoteiro("");
  };

  const handleVoltarRoteiros = () => {
    setIsAnalysingAvulso(false);
    setRoteiroAvulso(null);
    setHighlights([]);
    setHighlightsHistory([]);
    setEstruturaInvisivel("");
    setGatilhosAtencao("");
    setEstruturaRoteiro("");
  };

  const handleVerify = () => {
    if (!currentRoteiroId || isAnalysingAvulso) return;

    // Validar se os campos foram preenchidos
    if (!estruturaInvisivel.trim() || !gatilhosAtencao.trim() || !estruturaRoteiro.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos de análise antes de completar.",
        variant: "destructive",
      });
      return;
    }

    completarRoteiro.mutate({
      roteiro_id: currentRoteiroId,
      estrutura_invisivel: estruturaInvisivel,
      gatilhos_atencao: gatilhosAtencao,
      estrutura_roteiro: estruturaRoteiro,
      sublinhados: highlights,
    }, {
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

  const completedRoteirosWithData = progressoData?.filter(p => p.completado) || [];
  const selectedProgressoItem = selectedAnalysis 
    ? completedRoteirosWithData.find(p => p.id === selectedAnalysis)
    : null;
  const selectedRoteiroForView = selectedProgressoItem
    ? roteiros?.find(r => r.id === selectedProgressoItem.roteiro_id)
    : null;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">
            {isAnalysingAvulso ? "Análise Avulsa" : "Roteiro"}
          </h1>
          {isAnalysingAvulso && (
            <Button
              onClick={handleVoltarRoteiros}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar aos Roteiros
            </Button>
          )}
        </div>
        
        {!isAnalysingAvulso && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por nicho */}
            <Select value={selectedNicho} onValueChange={setSelectedNicho}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os nichos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os nichos</SelectItem>
                {nichos.map((nicho) => (
                  <SelectItem key={nicho.id} value={nicho.id}>
                    {nicho.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Busca por título */}
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar roteiro..."
              className="w-[220px]"
            />

            {/* Selecionar roteiro filtrado */}
            <Select
              value={currentRoteiroId ?? ""}
              onValueChange={(value) => setCurrentRoteiroId(value)}
              disabled={filteredRoteiros.length === 0}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Selecione um roteiro" />
              </SelectTrigger>
              <SelectContent>
                {filteredRoteiros.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button
                onClick={() => setShowNovoRoteiroDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileUp className="w-4 h-4" />
                Novo Roteiro
              </Button>
            )}
            <Button
              onClick={() => setShowAvulsoDialog(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FileEdit className="w-4 h-4" />
              Analisar Avulso
            </Button>
            <Button
              onClick={() => setShowAnalysesDialog(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Ver Analisados ({completedRoteirosWithData.length})
            </Button>
          </div>
        )}
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
            {!isAnalysingAvulso && (
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
            )}
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

      {/* Dialog de Conclusão */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Roteiro Completado!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Parabéns! Você completou a análise do roteiro.</p>
            {currentRoteiro && 'link_video' in currentRoteiro && currentRoteiro.link_video && (
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={currentRoteiro.link_video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Assistir vídeo do roteiro
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Roteiro (Admin) */}
      <Dialog open={showNovoRoteiroDialog} onOpenChange={setShowNovoRoteiroDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Roteiro</DialogTitle>
            <DialogDescription>
              Adicione um novo roteiro ao banco de dados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="novo-titulo">Título *</Label>
              <Input
                id="novo-titulo"
                value={novoRoteiroForm.titulo}
                onChange={(e) => setNovoRoteiroForm({ ...novoRoteiroForm, titulo: e.target.value })}
                placeholder="Título do roteiro"
              />
            </div>
            <div>
              <Label htmlFor="novo-conteudo">Conteúdo *</Label>
              <Textarea
                id="novo-conteudo"
                value={novoRoteiroForm.conteudo}
                onChange={(e) => setNovoRoteiroForm({ ...novoRoteiroForm, conteudo: e.target.value })}
                placeholder="Cole o conteúdo do roteiro aqui..."
                className="min-h-[300px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="novo-nicho">Nicho</Label>
                <Select
                  value={novoRoteiroForm.nicho_id}
                  onValueChange={(value) => setNovoRoteiroForm({ ...novoRoteiroForm, nicho_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {nichos.map((nicho) => (
                      <SelectItem key={nicho.id} value={nicho.id}>
                        {nicho.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="novo-ordem">Ordem</Label>
                <Input
                  id="novo-ordem"
                  type="number"
                  value={novoRoteiroForm.ordem}
                  onChange={(e) => setNovoRoteiroForm({ ...novoRoteiroForm, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="novo-link">Link do Vídeo</Label>
              <Input
                id="novo-link"
                value={novoRoteiroForm.link_video}
                onChange={(e) => setNovoRoteiroForm({ ...novoRoteiroForm, link_video: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNovoRoteiroDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRoteiro} disabled={createRoteiro.isPending}>
                {createRoteiro.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Roteiro"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Analisar Roteiro Avulso */}
      <Dialog open={showAvulsoDialog} onOpenChange={setShowAvulsoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analisar Roteiro Avulso</DialogTitle>
            <DialogDescription>
              Cole um roteiro para análise temporária. Não será salvo no banco de dados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="avulso-titulo">Título *</Label>
              <Input
                id="avulso-titulo"
                value={avulsoForm.titulo}
                onChange={(e) => setAvulsoForm({ ...avulsoForm, titulo: e.target.value })}
                placeholder="Título do roteiro"
              />
            </div>
            <div>
              <Label htmlFor="avulso-conteudo">Conteúdo *</Label>
              <Textarea
                id="avulso-conteudo"
                value={avulsoForm.conteudo}
                onChange={(e) => setAvulsoForm({ ...avulsoForm, conteudo: e.target.value })}
                placeholder="Cole o conteúdo do roteiro aqui..."
                className="min-h-[300px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAvulsoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStartAvulso}>
                Iniciar Análise
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Roteiros Analisados */}
      <Dialog open={showAnalysesDialog} onOpenChange={(open) => {
        setShowAnalysesDialog(open);
        if (!open) setSelectedAnalysis(null);
      }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh]">
          <DialogHeader>
            <DialogTitle>📚 Roteiros Analisados</DialogTitle>
          </DialogHeader>
          
          {!selectedAnalysis ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {completedRoteirosWithData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Você ainda não completou nenhum roteiro.
                  </p>
                ) : (
                  completedRoteirosWithData.map((progresso) => {
                    const roteiro = roteiros?.find(r => r.id === progresso.roteiro_id);
                    if (!roteiro) return null;
                    
                    return (
                      <Card
                        key={progresso.id}
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSelectedAnalysis(progresso.id)}
                      >
                        <div className="space-y-2">
                          <h3 className="font-semibold">{roteiro.titulo}</h3>
                          <p className="text-sm text-muted-foreground">
                            Completado em: {progresso.data_completado 
                              ? format(new Date(progresso.data_completado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : "N/A"}
                          </p>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAnalysis(null)}
                className="w-fit"
              >
                ← Voltar para lista
              </Button>
              {selectedProgressoItem && selectedRoteiroForView && (
                <RoteiroAnaliseView
                  progresso={selectedProgressoItem}
                  roteiro={selectedRoteiroForView}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnaliseRoteiroGame;
