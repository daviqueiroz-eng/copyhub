import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUserRole } from "@/hooks/useAuth";
import { useRoteiros, useCreateRoteiro, useDeleteRoteiro } from "@/hooks/useRoteiros";
import { useProgressoRoteiros, useCompletarRoteiro } from "@/hooks/useProgressoRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { useNichos } from "@/hooks/useNichos";
import { useAnalysisStreak } from "@/hooks/useAnalysisStreak";
import { useMedalhasUsuario } from "@/hooks/useMedalhas";
import { MedalhasSection } from "@/components/MedalhasSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, ExternalLink, FileUp, FileEdit, ArrowLeft, Trash2, Flame, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoteiroAnaliseView } from "@/components/RoteiroAnaliseView";
import { HighlightsList } from "@/components/HighlightsList";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Highlight = {
  id: string;
  text: string;
  color: string;
  startPos: number;
  endPos: number;
  annotation?: string;
};

const AnaliseRoteiroGame = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { data: userRole } = useUserRole();
  const { data: roteiros = [], isLoading: loadingRoteiros } = useRoteiros();
  const { data: progressoData = [], isLoading: loadingProgresso } = useProgressoRoteiros();
  const { data: cores = [], isLoading: loadingCores } = useCoresAnalise();
  const { data: nichos = [] } = useNichos();
  const completarRoteiro = useCompletarRoteiro();
  const createRoteiro = useCreateRoteiro();
  const deleteRoteiro = useDeleteRoteiro();
  const { streak, updateStreak } = useAnalysisStreak();
  const { data: medalhasUsuario = [] } = useMedalhasUsuario();

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsHistory, setHighlightsHistory] = useState<Highlight[][]>([]);
  const [currentRoteiroId, setCurrentRoteiroId] = useState<string | null>(null);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showAnalysesDialog, setShowAnalysesDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  
  // Estados para anotações inline (double-click)
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [tempAnnotationText, setTempAnnotationText] = useState("");
  const [filterColor, setFilterColor] = useState<string>("all");
  
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
  const [selectedNicho, setSelectedNicho] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Dialog e estados para filtro de palavras grifadas
  const [showFiltroGrifadasDialog, setShowFiltroGrifadasDialog] = useState(false);
  const [filtroGrifadasAtivo, setFiltroGrifadasAtivo] = useState(false);
  const [filtroCorSelecionada, setFiltroCorSelecionada] = useState<string>("all");
  const [filtroNichoSelecionado, setFiltroNichoSelecionado] = useState<string>("all");
  const [modoFiltroAvancado, setModoFiltroAvancado] = useState(false);

  // Não selecionar automaticamente - usuário escolhe manualmente

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

  const isAdmin = userRole === "admin";
  
  // Função para filtrar roteiros baseado nas palavras grifadas
  const getRoteirosComGrifados = (corId?: string, nichoId?: string) => {
    // Buscar todos os progressos completados que têm sublinhados
    const progressosComSublinhados = progressoData.filter(p => {
      if (!p.sublinhados || !Array.isArray(p.sublinhados)) return false;
      if (p.sublinhados.length === 0) return false;
      
      // Se filtro por cor estiver ativo, verificar se tem sublinhados dessa cor
      if (corId && corId !== "all") {
        const temCorEspecifica = p.sublinhados.some(
          (sub: any) => sub.color === corId
        );
        if (!temCorEspecifica) return false;
      }
      
      return true;
    });
    
    // Obter IDs dos roteiros que têm análises com grifados
    const roteirosIds = new Set(
      progressosComSublinhados.map(p => p.roteiro_id)
    );
    
    // Filtrar roteiros
    return roteiros.filter(r => {
      // Verificar se roteiro tem análise com grifados
      if (!roteirosIds.has(r.id)) return false;
      
      // Se filtro por nicho estiver ativo, verificar nicho
      if (nichoId && nichoId !== "all") {
        if (r.nicho_id !== nichoId) return false;
      }
      
      return true;
    });
  };
  
  // Filtrar roteiros considerando filtro de palavras grifadas
  const filteredRoteiros = (() => {
    let filtered = [...roteiros];

    // Aplicar filtro de palavras grifadas se ativo
    if (filtroGrifadasAtivo) {
      const roteirosComGrifados = getRoteirosComGrifados(
        filtroCorSelecionada,
        modoFiltroAvancado ? filtroNichoSelecionado : undefined
      );
      
      // Usar apenas roteiros que passaram no filtro de grifados
      filtered = filtered.filter(r => 
        roteirosComGrifados.some(rg => rg.id === r.id)
      );
    }

    // Filtro por nicho (se não estiver usando filtro avançado de grifados)
    if (selectedNicho && selectedNicho !== "all" && !modoFiltroAvancado) {
      filtered = filtered.filter((r) => r.nicho_id === selectedNicho);
    }

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((r) =>
        r.titulo.toLowerCase().includes(term)
      );
    }

    // Ordenar por ordem
    return filtered.sort((a, b) => a.ordem - b.ordem);
  })();
  
  const completedRoteirosWithData = progressoData?.filter(p => p.completado) || [];

  // Resetar roteiro selecionado se não estiver mais na lista filtrada
  useEffect(() => {
    if (currentRoteiroId && !filteredRoteiros.some((r) => r.id === currentRoteiroId)) {
      setCurrentRoteiroId(null);
    }
  }, [selectedNicho, searchTerm, roteiros, currentRoteiroId]);

  const handleSelectRoteiro = (roteiroId: string) => {
    setCurrentRoteiroId(roteiroId);
    setHighlights([]);
    setHighlightsHistory([]);
    setEstruturaInvisivel("");
    setGatilhosAtencao("");
    setEstruturaRoteiro("");
  };

  const handleRandomRoteiro = () => {
    if (filteredRoteiros.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredRoteiros.length);
    setIsFocusMode(true);
    handleSelectRoteiro(filteredRoteiros[randomIndex].id);
  };

  const handleVoltarSelecao = () => {
    setIsFocusMode(false);
    setCurrentRoteiroId(null);
    setHighlights([]);
    setHighlightsHistory([]);
    setEstruturaInvisivel("");
    setGatilhosAtencao("");
    setEstruturaRoteiro("");
  };

  const handleDeleteRoteiro = async (roteiroId: string, titulo: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o roteiro "${titulo}"?`)) {
      try {
        await deleteRoteiro.mutateAsync(roteiroId);
        if (currentRoteiroId === roteiroId) {
          handleVoltarSelecao();
        }
        toast({
          title: "Roteiro deletado",
          description: "O roteiro foi removido com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro ao deletar",
          description: "Não foi possível deletar o roteiro.",
          variant: "destructive",
        });
      }
    }
  };

  // Verificar se há sobreposição entre dois highlights
  const hasOverlap = (h1: Highlight, h2: { startPos: number; endPos: number }) => {
    return !(h1.endPos <= h2.startPos || h1.startPos >= h2.endPos);
  };

  // Verificar se um highlight já existe na posição exata
  const isExactDuplicate = (existing: Highlight, newPos: { startPos: number; endPos: number }) => {
    return existing.startPos === newPos.startPos && existing.endPos === newPos.endPos;
  };

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

    // Verificar se já existe highlight na mesma posição
    const exactDuplicate = highlights.find(h => 
      isExactDuplicate(h, { startPos, endPos })
    );

    if (exactDuplicate) {
      if (exactDuplicate.color === selectedColor) {
        // Mesma cor - apenas avisar e ignorar
        toast({
          title: "Palavra já grifada",
          description: "Esta palavra já está grifada com esta cor.",
        });
        selection.removeAllRanges();
        return;
      } else {
        // Cor diferente - SUBSTITUIR AUTOMATICAMENTE
        setHighlightsHistory([...highlightsHistory, highlights]);
        setHighlights(highlights.map(h => 
          h.id === exactDuplicate.id 
            ? { ...h, color: selectedColor }
            : h
        ));
        
        toast({
          title: "Cor alterada",
          description: "A cor do highlight foi atualizada.",
        });
        
        selection.removeAllRanges();
        return;
      }
    }

    // Verificar sobreposição parcial
    const overlappingHighlight = highlights.find(h => 
      hasOverlap(h, { startPos, endPos })
    );

    if (overlappingHighlight) {
      toast({
        title: "Sobreposição detectada",
        description: "Esta seleção se sobrepõe a uma palavra já grifada. Selecione a palavra completa para trocar a cor.",
        variant: "destructive",
      });
      selection.removeAllRanges();
      return;
    }

    // Nenhum problema - adicionar novo highlight
    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      text: selectedText,
      color: selectedColor,
      startPos,
      endPos,
      annotation: undefined,
    };

    setHighlightsHistory([...highlightsHistory, highlights]);
    setHighlights([...highlights, newHighlight]);

    selection.removeAllRanges();
  };

  const handleSaveInlineAnnotation = (highlightId: string) => {
    setHighlightsHistory([...highlightsHistory, highlights]);
    
    setHighlights(
      highlights.map((h) =>
        h.id === highlightId
          ? { ...h, annotation: tempAnnotationText.trim() || undefined }
          : h
      )
    );
    
    setEditingHighlightId(null);
    setTempAnnotationText("");
    
    if (tempAnnotationText.trim()) {
      toast({
        title: "Comentário salvo",
        description: "Seu comentário foi adicionado à palavra grifada.",
      });
    } else {
      toast({
        title: "Comentário removido",
        description: "O comentário foi removido da palavra grifada.",
      });
    }
  };

  const handleRemoveHighlight = (highlightId: string) => {
    setHighlightsHistory([...highlightsHistory, highlights]);
    setHighlights(highlights.filter(h => h.id !== highlightId));
  };

  const handleScrollToHighlight = (highlightId: string) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    const container = document.getElementById("roteiro-content");
    if (!container) return;

    // Encontrar todos os marks e achar o correto
    const marks = container.querySelectorAll('mark');
    marks.forEach((mark) => {
      const text = mark.textContent;
      if (text === highlight.text) {
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Adicionar animação de destaque
        mark.classList.add('animate-pulse');
        setTimeout(() => mark.classList.remove('animate-pulse'), 2000);
      }
    });
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
      is_private: false,
      user_id: undefined,
    }, {
      onSuccess: () => {
        setShowNovoRoteiroDialog(false);
        setNovoRoteiroForm({ titulo: "", conteudo: "", nicho_id: "", link_video: "", ordem: 0 });
        toast({
          title: "Roteiro criado",
          description: "O novo roteiro foi adicionado e está visível para todos.",
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

    createRoteiro.mutate({
      titulo: avulsoForm.titulo,
      conteudo: avulsoForm.conteudo,
      ordem: 999,
      is_private: true,
      user_id: user?.id,
    }, {
      onSuccess: (data) => {
        setShowAvulsoDialog(false);
        setAvulsoForm({ titulo: "", conteudo: "" });
        setIsFocusMode(true);
        handleSelectRoteiro(data.id);
        toast({
          title: "Roteiro carregado",
          description: "Seu roteiro está pronto para análise e foi salvo na sua lista.",
        });
      },
    });
  };

  // Aplicar filtro de palavras grifadas
  const handleAplicarFiltroGrifadas = () => {
    setFiltroGrifadasAtivo(true);
    setShowFiltroGrifadasDialog(false);
    
    // Se modo avançado, desativar o filtro de nicho normal
    if (modoFiltroAvancado) {
      setSelectedNicho("all");
    }
    
    toast({
      title: "Filtro Aplicado",
      description: modoFiltroAvancado 
        ? "Filtrando por nicho e categoria de cor"
        : "Filtrando por categoria de cor",
    });
  };

  // Limpar filtro de palavras grifadas
  const handleLimparFiltroGrifadas = () => {
    setFiltroGrifadasAtivo(false);
    setFiltroCorSelecionada("all");
    setFiltroNichoSelecionado("all");
    setModoFiltroAvancado(false);
    setShowFiltroGrifadasDialog(false);
    
    toast({
      title: "Filtro Removido",
      description: "Mostrando todos os roteiros novamente",
    });
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

    completarRoteiro.mutate({
      roteiro_id: currentRoteiroId,
      estrutura_invisivel: estruturaInvisivel,
      gatilhos_atencao: gatilhosAtencao,
      estrutura_roteiro: estruturaRoteiro,
      sublinhados: highlights,
    }, {
      onSuccess: () => {
        // Atualizar streak
        updateStreak();
        
        // Limpar campos e highlights
        setHighlights([]);
        setHighlightsHistory([]);
        setEstruturaInvisivel("");
        setGatilhosAtencao("");
        setEstruturaRoteiro("");
        
        // Mostrar banco de roteiros analisados
        setShowCompletedDialog(true);
        
        // Redirecionar para home
        navigate('/');
      },
    });
  };

  const renderHighlightedText = (text: string) => {
    if (highlights.length === 0) return text;

    const sortedHighlights = [...highlights].sort((a, b) => a.startPos - b.startPos);
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Texto normal antes do highlight
      if (highlight.startPos > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{text.slice(lastIndex, highlight.startPos)}</span>
        );
      }

      const isEditing = editingHighlightId === highlight.id;

      // Renderizar highlight com comentário inline
      parts.push(
        <span key={`highlight-wrapper-${idx}`} className="inline-block relative group">
          {/* Palavra grifada */}
          <mark
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingHighlightId(highlight.id);
              setTempAnnotationText(highlight.annotation || "");
            }}
            style={{
              backgroundColor: highlight.color,
              padding: "2px 4px",
              borderRadius: "3px",
              cursor: "pointer",
              position: "relative",
            }}
            className="hover:opacity-80 transition-opacity"
            title="Duplo-clique para adicionar/editar comentário"
          >
            {text.slice(highlight.startPos, highlight.endPos)}
          </mark>

          {/* Comentário visível (quando não está editando) */}
          {!isEditing && highlight.annotation && (
            <span 
              className="inline-block ml-1 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded border border-border max-w-[200px] truncate align-middle cursor-pointer"
              title={highlight.annotation}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingHighlightId(highlight.id);
                setTempAnnotationText(highlight.annotation || "");
              }}
            >
              💬 {highlight.annotation}
            </span>
          )}

          {/* Campo de edição inline (quando está editando) */}
          {isEditing && (
            <span className="inline-block ml-2 align-middle">
              <span className="inline-flex items-center gap-1 bg-background border border-primary rounded-lg p-1 shadow-lg">
                <Input
                  value={tempAnnotationText}
                  onChange={(e) => setTempAnnotationText(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="w-[200px] h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveInlineAnnotation(highlight.id);
                    } else if (e.key === "Escape") {
                      setEditingHighlightId(null);
                      setTempAnnotationText("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleSaveInlineAnnotation(highlight.id)}
                >
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => {
                    setEditingHighlightId(null);
                    setTempAnnotationText("");
                  }}
                >
                  ✕
                </Button>
              </span>
            </span>
          )}
        </span>
      );

      lastIndex = highlight.endPos;
    });

    // Texto restante após o último highlight
    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return <>{parts}</>;
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

  // Tela de seleção de roteiro
  const availableCount = filteredRoteiros.length;
  const completedCount = filteredRoteiros.filter((r) => 
    progressoData.some((p) => p.roteiro_id === r.id && p.completado)
  ).length;

  const selectedProgressoItem = selectedAnalysis
    ? completedRoteirosWithData.find(p => p.id === selectedAnalysis)
    : null;
  const selectedRoteiroForView = selectedProgressoItem
    ? roteiros?.find(r => r.id === selectedProgressoItem.roteiro_id)
    : null;

  return (
    <>
      {!currentRoteiro ? (
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-foreground">Análise de Roteiro</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowFiltroGrifadasDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar Palavras Grifadas
              </Button>
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
          </div>

          {/* Seção de Perfil e Medalhas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Card de Perfil e Estatísticas */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar || undefined} />
                  <AvatarFallback className="text-lg">
                    {profile?.nome?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{profile?.nome || "Usuário"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              {/* Indicador de Streak */}
              {streak > 0 && (
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sequência Atual</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {streak} {streak === 1 ? 'dia' : 'dias'} consecutivos
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {progressoData.filter(p => p.completado).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Roteiros Completados</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {medalhasUsuario.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Medalhas Conquistadas</p>
                </div>
              </div>
            </Card>
            
            {/* Card de Medalhas */}
            <div>
              <MedalhasSection />
            </div>
          </div>

          <Card className="p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Escolha um Roteiro para Analisar</h2>
              <p className="text-muted-foreground">
                {availableCount} roteiros disponíveis • {completedCount} completados
              </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Indicador de filtro ativo */}
              {filtroGrifadasAtivo && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20">
                  <Filter className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {modoFiltroAvancado 
                      ? `${filtroNichoSelecionado !== "all" ? nichos.find(n => n.id === filtroNichoSelecionado)?.nome : "Todos"} + ${filtroCorSelecionada !== "all" ? cores.find(c => c.cor === filtroCorSelecionada)?.nome : "Todas"}`
                      : filtroCorSelecionada !== "all" ? cores.find(c => c.cor === filtroCorSelecionada)?.nome : "Todas as cores"
                    }
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/20"
                    onClick={handleLimparFiltroGrifadas}
                  >
                    ✕
                  </Button>
                </div>
              )}
              
              <Select 
                value={selectedNicho || "all"} 
                onValueChange={setSelectedNicho}
                disabled={modoFiltroAvancado && filtroGrifadasAtivo}
              >
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Todos os nichos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os nichos</SelectItem>
                  {nichos.map((nicho) => (
                    <SelectItem key={nicho.id} value={nicho.id}>
                      {nicho.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título..."
                className="flex-1"
              />
            </div>

            {/* Botão de seleção aleatória */}
            <Button
              onClick={handleRandomRoteiro}
              size="lg"
              className="w-full mb-6 text-lg h-14"
              disabled={filteredRoteiros.length === 0}
            >
              🎲 Roteiro Aleatório
            </Button>

            {/* Lista de roteiros */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredRoteiros.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum roteiro encontrado com os filtros atuais.
                </p>
              ) : (
                filteredRoteiros.map((roteiro) => {
                  const isCompleted = progressoData.some(
                    (p) => p.roteiro_id === roteiro.id && p.completado
                  );
                  const nicho = nichos.find((n) => n.id === roteiro.nicho_id);
                  
                  return (
                    <Card
                      key={roteiro.id}
                  className="p-4 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => {
                    setIsFocusMode(true);
                    handleSelectRoteiro(roteiro.id);
                  }}
                    >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{roteiro.titulo}</h3>
                        {roteiro.is_private && (
                          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                            Privado
                          </span>
                        )}
                      </div>
                      {nicho && (
                        <p className="text-sm text-muted-foreground">{nicho.nome}</p>
                      )}
                    </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCompleted && (
                            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                              ✓ Completado
                            </span>
                          )}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoteiro(roteiro.id, roteiro.titulo);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            Analisar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Roteiro</h1>
          {isFocusMode && (
            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              🎯 Modo Foco
            </span>
          )}
          <Button
            onClick={handleVoltarSelecao}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          {isAdmin && currentRoteiro && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-2 ml-2"
              onClick={() => handleDeleteRoteiro(currentRoteiro.id, currentRoteiro.titulo)}
            >
              <Trash2 className="w-4 h-4" />
              Deletar
            </Button>
          )}
        </div>
        
          {!isFocusMode && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowFiltroGrifadasDialog(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtrar Grifadas
            </Button>
            
            {/* Filtro por nicho */}
            <Select 
              value={selectedNicho || "all"} 
              onValueChange={setSelectedNicho}
              disabled={modoFiltroAvancado && filtroGrifadasAtivo}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os nichos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
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

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1fr] gap-6">
        {/* Coluna Esquerda - Legenda de Cores + Lista de Highlights */}
        <div className="space-y-4">
          <Card className="p-4">
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

          <Card className="p-4">
            <HighlightsList
              highlights={highlights}
              cores={cores}
              filterColor={filterColor}
              onFilterChange={setFilterColor}
              onHighlightClick={handleScrollToHighlight}
              onRemoveHighlight={handleRemoveHighlight}
            />
          </Card>
        </div>

        {/* Coluna Central - Conteúdo do Roteiro */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{currentRoteiro.titulo}</h2>
          {currentRoteiro.link_video && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(currentRoteiro.link_video!, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Assistir Vídeo do Roteiro
              </Button>
            </div>
          )}
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
        </div>
      )}

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

      {/* Dialog Filtro por Palavras Grifadas */}
      <Dialog open={showFiltroGrifadasDialog} onOpenChange={setShowFiltroGrifadasDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Filtrar por Palavras Grifadas</DialogTitle>
            <DialogDescription>
              Filtre os roteiros disponíveis baseado nas análises anteriores
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={modoFiltroAvancado ? "avancado" : "simples"} onValueChange={(v) => setModoFiltroAvancado(v === "avancado")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simples">Simples</TabsTrigger>
              <TabsTrigger value="avancado">Avançado</TabsTrigger>
            </TabsList>
            
            {/* ABA SIMPLES */}
            <TabsContent value="simples" className="space-y-4">
              <div>
                <Label htmlFor="filtro-cor-simples">Filtrar por Categoria</Label>
                <Select value={filtroCorSelecionada} onValueChange={setFiltroCorSelecionada}>
                  <SelectTrigger id="filtro-cor-simples">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {cores.map((cor) => (
                      <SelectItem key={cor.id} value={cor.cor}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: cor.cor }}
                          />
                          {cor.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Mostra roteiros que têm análises com palavras grifadas nesta categoria
                </p>
              </div>
            </TabsContent>
            
            {/* ABA AVANÇADO */}
            <TabsContent value="avancado" className="space-y-4">
              <div>
                <Label htmlFor="filtro-nicho-avancado">Filtrar por Nicho</Label>
                <Select value={filtroNichoSelecionado} onValueChange={setFiltroNichoSelecionado}>
                  <SelectTrigger id="filtro-nicho-avancado">
                    <SelectValue placeholder="Selecione um nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os nichos</SelectItem>
                    {nichos.map((nicho) => (
                      <SelectItem key={nicho.id} value={nicho.id}>
                        {nicho.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filtro-cor-avancado">Filtrar por Categoria</Label>
                <Select value={filtroCorSelecionada} onValueChange={setFiltroCorSelecionada}>
                  <SelectTrigger id="filtro-cor-avancado">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {cores.map((cor) => (
                      <SelectItem key={cor.id} value={cor.cor}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: cor.cor }}
                          />
                          {cor.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Combine nicho e categoria para filtros mais específicos
              </p>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleLimparFiltroGrifadas}>
              Limpar Filtro
            </Button>
            <Button onClick={handleAplicarFiltroGrifadas}>
              Aplicar Filtro
            </Button>
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
    </>
  );
};

export default AnaliseRoteiroGame;
