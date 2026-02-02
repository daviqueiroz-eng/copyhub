import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUserRole } from "@/hooks/useAuth";
import { useRoteiros, useCreateRoteiro, useDeleteRoteiro } from "@/hooks/useRoteiros";
import { useProgressoRoteiros, useCompletarRoteiro, useDeleteProgressoRoteiro } from "@/hooks/useProgressoRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { useNichos, useCreateNicho } from "@/hooks/useNichos";
import { useMentorados } from "@/hooks/useMentorados";
import { useAnalysisStreak } from "@/hooks/useAnalysisStreak";
import { useMedalhasUsuario } from "@/hooks/useMedalhas";
import { useCreateHeadlinesCriadas } from "@/hooks/useHeadlinesCriadas";
import { MedalhasSection } from "@/components/MedalhasSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, ExternalLink, Copy, FileUp, FileEdit, ArrowLeft, Trash2, Flame, Filter, Plus, Eye, User, Table2, LayoutGrid, Image, FileText, PenTool } from "lucide-react";
import { detectVideoType, extractYouTubeId, extractGoogleDriveId } from "@/lib/videoUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoteiroAnaliseView } from "@/components/RoteiroAnaliseView";
import { HighlightsList } from "@/components/HighlightsList";
import { HighlightsTable } from "@/components/HighlightsTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RankingMensal } from "@/components/RankingMensal";
import { AnalysesTableView } from "@/components/AnalysesTableView";
import { GerenciarFotosDialog } from "@/components/GerenciarFotosDialog";
import { CelebracaoDialog } from "@/components/CelebracaoDialog";
import { HeadlinesCriadasView } from "@/components/HeadlinesCriadasView";
import { CriarRoteiroView } from "@/components/CriarRoteiroView";
import confetti from "canvas-confetti";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Highlight = {
  id: string;
  text: string;
  color: string;
  startPos: number;
  endPos: number;
  annotation?: string;
  annotations?: string[];
  commentPositions?: Record<number, { x: number; y: number }>;
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
  const createNicho = useCreateNicho();
  const completarRoteiro = useCompletarRoteiro();
  const createRoteiro = useCreateRoteiro();
  const deleteRoteiro = useDeleteRoteiro();
  const deleteProgressoRoteiro = useDeleteProgressoRoteiro();
  const createHeadlinesCriadas = useCreateHeadlinesCriadas();
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
  
  // Estado para dragging de comentários
  const [draggingComment, setDraggingComment] = useState<{
    highlightId: string;
    commentIndex: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  
  // Ref para armazenar posições das palavras grifadas
  const highlightRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Dialog novo roteiro (todos os usuários)
  const [showNovoRoteiroDialog, setShowNovoRoteiroDialog] = useState(false);
  const [novoRoteiroForm, setNovoRoteiroForm] = useState({
    titulo: "",
    conteudo: "",
    nicho_id: "",
    link_video: "",
    ordem: 0,
    criador_conteudo: "",
    visualizacoes: "",
    tipoUpload: "privado" as "privado" | "geral",
  });
  
  // Dialog roteiro avulso
  const [showAvulsoDialog, setShowAvulsoDialog] = useState(false);
  const [avulsoForm, setAvulsoForm] = useState({ titulo: "", conteudo: "", criador_conteudo: "" });
  
  // Campos de análise
  const [estruturaInvisivel, setEstruturaInvisivel] = useState("");
  const [gatilhosAtencao, setGatilhosAtencao] = useState("");
  const [estruturaRoteiro, setEstruturaRoteiro] = useState("");
  const [estruturaRoteiroCheckboxes, setEstruturaRoteiroCheckboxes] = useState<string[]>([]);
  const [cargaCognitiva, setCargaCognitiva] = useState<number>(5);
  const [oQueTornouViral, setOQueTornouViral] = useState("");
  const [melhoriasPotencial, setMelhoriasPotencial] = useState("");
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
  const [filtroEstruturaSelecionada, setFiltroEstruturaSelecionada] = useState<string>("all");
  
  // Estados para dialog de estrutura de conteúdo notável
  const [showEstruturaDialog, setShowEstruturaDialog] = useState(false);
  const [highlightPendenteEstrutura, setHighlightPendenteEstrutura] = useState<Highlight | null>(null);
  const [estruturaSelecionada, setEstruturaSelecionada] = useState<string>("");
  
  // Estado para comentários expandidos/minimizados
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  
  // Estado para indicar erro nos checkboxes
  const [showCheckboxError, setShowCheckboxError] = useState(false);
  
  // Estado para dialog de novo nicho
  const [showNovoNichoDialog, setShowNovoNichoDialog] = useState(false);
  const [novoNichoNome, setNovoNichoNome] = useState("");
  
  // Estado para modo de visualização (cards, tabela ou headlines)
  const [viewMode, setViewMode] = useState<"cards" | "table" | "headlines">("cards");
  
  // Estados para fotos de celebração
  const [showGerenciarFotosDialog, setShowGerenciarFotosDialog] = useState(false);
  const [showCelebracaoDialog, setShowCelebracaoDialog] = useState(false);
  
  // Estados para headlines para mentorados
  const [mentoradosSelecionados, setMentoradosSelecionados] = useState<string[]>([]);
  const [headlinesMentorados, setHeadlinesMentorados] = useState<{
    mentorado1: string;
    mentorado2: string;
    mentorado3: string;
  }>({ mentorado1: "", mentorado2: "", mentorado3: "" });
  
  // Buscar mentorados do usuário
  const { data: mentorados = [] } = useMentorados();
  
  // Função para selecionar/remover mentorado
  const handleSelectMentorado = (index: number, mentoradoId: string) => {
    const newSelecionados = [...mentoradosSelecionados];
    newSelecionados[index] = mentoradoId;
    setMentoradosSelecionados(newSelecionados);
  };
  
  // Função para limpar seleção de mentorados
  const limparMentoradosSelecionados = () => {
    setMentoradosSelecionados([]);
    setHeadlinesMentorados({ mentorado1: "", mentorado2: "", mentorado3: "" });
  };

  // Função para processar link de vídeo e garantir que seja abrível
  const getWatchableVideoUrl = (url: string): string => {
    if (!url) return '';
    
    const videoType = detectVideoType(url);
    
    // Se for YouTube, garantir formato watch
    if (videoType === 'youtube') {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    
    // Se for Google Drive, formato de visualização
    if (videoType === 'google-drive') {
      const fileId = extractGoogleDriveId(url);
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/view`;
      }
    }
    
    // Retorna URL original se não for reconhecida
    return url;
  };

  const handleCopyVideoLink = (url: string) => {
    const processedUrl = getWatchableVideoUrl(url);
    navigator.clipboard.writeText(processedUrl);
    toast({
      title: "Link copiado!",
      description: "O link do vídeo foi copiado para a área de transferência.",
    });
  };

  // Não selecionar automaticamente - usuário escolhe manualmente

  // Selecionar primeira cor automaticamente
  useEffect(() => {
    if (cores.length > 0 && !selectedColor) {
      setSelectedColor(cores[0].cor);
    }
  }, [cores, selectedColor]);

  // Listeners globais para drag de comentários
  useEffect(() => {
    if (draggingComment) {
      window.addEventListener('mousemove', handleCommentMouseMove);
      window.addEventListener('mouseup', handleCommentMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleCommentMouseMove);
        window.removeEventListener('mouseup', handleCommentMouseUp);
      };
    }
  }, [draggingComment]);

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
  
  // Função para obter lista de highlights agrupados por roteiro
  const getHighlightsAgrupados = () => {
    const result: Array<{
      roteiroId: string;
      roteiroTitulo: string;
      nicho: string;
      highlights: Array<{
        id: string;
        text: string;
        color: string;
        annotation?: string;
      }>;
    }> = [];

    progressoData.forEach(progresso => {
      if (!progresso.sublinhados || !Array.isArray(progresso.sublinhados)) return;
      
      // Filtrar highlights pela cor selecionada
      let highlightsFiltrados = progresso.sublinhados.filter(
        (sub: any) => filtroCorSelecionada === "all" || sub.color === filtroCorSelecionada
      );
      
      // NOVO: Filtrar por estrutura se selecionada
      if (modoFiltroAvancado && filtroEstruturaSelecionada !== "all") {
        const corConteudoNotavel = cores.find(c => c.nome === "Conteúdo notável");
        
        highlightsFiltrados = highlightsFiltrados.filter((sub: any) => {
          // Verificar se é da cor "Conteúdo Notável"
          if (sub.color !== corConteudoNotavel?.cor) return false;
          
          // Verificar se tem a estrutura selecionada
          const annotations = sub.annotations || (sub.annotation ? [sub.annotation] : []);
          return annotations.includes(filtroEstruturaSelecionada);
        });
      }
      
      if (highlightsFiltrados.length === 0) return;
      
      const roteiro = roteiros.find(r => r.id === progresso.roteiro_id);
      if (!roteiro) return;
      
      // Se filtro de nicho avançado estiver ativo, verificar nicho
      if (modoFiltroAvancado && filtroNichoSelecionado !== "all" && roteiro.nicho_id !== filtroNichoSelecionado) {
        return;
      }
      
      const nicho = nichos.find(n => n.id === roteiro.nicho_id);
      
      result.push({
        roteiroId: roteiro.id,
        roteiroTitulo: roteiro.titulo,
        nicho: nicho?.nome || "",
        highlights: highlightsFiltrados.map((h: any) => ({
          id: h.id,
          text: h.text,
          color: h.color,
          annotation: h.annotation || h.annotations?.join(", "),
        })),
      });
    });
    
    return result;
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
    
    // Limpar seleção de mentorados para nova análise
    limparMentoradosSelecionados();
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

  // Helpers para calcular posições corretas ignorando comentários no DOM
  const findIndexedElement = (node: Node): HTMLElement | null => {
    let el = node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement | null) : (node as HTMLElement | null);
    while (el && !(el.dataset && el.dataset.start && el.dataset.end)) {
      el = el.parentElement;
    }
    return el;
  };

  const getAbsoluteOffset = (node: Node, offset: number): number => {
    const el = findIndexedElement(node);
    if (!el) return 0;
    const baseStart = Number(el.dataset.start);
    return baseStart + offset;
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selectedColor) return;
    if (!currentRoteiro) return;

    // Usar helpers para calcular posições corretas
    const startRaw = getAbsoluteOffset(selection.anchorNode!, selection.anchorOffset);
    const endRaw = getAbsoluteOffset(selection.focusNode!, selection.focusOffset);
    const startPos = Math.min(startRaw, endRaw);
    const endPos = Math.max(startRaw, endRaw);

    if (startPos === endPos) return;

    const selectedText = currentRoteiro.conteudo.slice(startPos, endPos);
    if (!selectedText.trim()) return;

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

    // Verificar se é "Conteúdo Notável" para abrir dialog de estrutura
    const corConteudoNotavel = cores.find(c => c.nome === "Conteúdo notável");
    
    if (selectedColor === corConteudoNotavel?.cor) {
      // Armazenar highlight pendente e abrir dialog
      setHighlightPendenteEstrutura(newHighlight);
      setShowEstruturaDialog(true);
    } else {
      // Adicionar normalmente
      setHighlightsHistory([...highlightsHistory, highlights]);
      setHighlights([...highlights, newHighlight]);
    }

    selection.removeAllRanges();
  };

  // Determinar posição do comentário baseado na localização da palavra
  const getCommentPosition = (highlightId: string): 'left' | 'top' | 'right' => {
    const element = highlightRefs.current.get(highlightId);
    if (!element) return 'right';

    const rect = element.getBoundingClientRect();
    const container = document.getElementById("roteiro-content");
    if (!container) return 'right';
    
    const containerRect = container.getBoundingClientRect();
    const relativeLeft = rect.left - containerRect.left;
    const containerWidth = containerRect.width;
    
    // Usar posição relativa ao container de texto
    const leftZone = containerWidth * 0.25;
    const rightZone = containerWidth * 0.75;
    
    if (relativeLeft < leftZone) {
      return 'right'; // Palavra à esquerda → comentário à direita
    } else if (relativeLeft > rightZone) {
      return 'left'; // Palavra à direita → comentário à esquerda
    } else {
      return 'top'; // Palavra no centro → comentário acima
    }
  };

  const handleCommentMouseDown = (
    e: React.MouseEvent,
    highlightId: string,
    commentIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevenir scroll do navegador
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;
    
    const commentEl = e.currentTarget as HTMLElement;
    // Pega o container correto para posicionamento absoluto (offsetParent)
    const parent = (commentEl.offsetParent as HTMLElement) || commentEl.parentElement;
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const currentPos = highlight.commentPositions?.[commentIndex];
    
    let initialX = currentPos?.x || 0;
    let initialY = currentPos?.y || 0;
    
    if (!currentPos) {
      const commentRect = commentEl.getBoundingClientRect();
      initialX = commentRect.left - parentRect.left;
      initialY = commentRect.top - parentRect.top;
      
      // Fixar imediatamente a posição para evitar salto no primeiro movimento
      setHighlights(prev =>
        prev.map(h =>
          h.id === highlightId
            ? {
                ...h,
                commentPositions: {
                  ...(h.commentPositions || {}),
                  [commentIndex]: { x: initialX, y: initialY },
                },
              }
            : h
        )
      );
    }
    
    // Restaurar posição de scroll imediatamente
    window.scrollTo(scrollX, scrollY);
    
    setDraggingComment({
      highlightId,
      commentIndex,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: initialX,
      offsetY: initialY,
    });
  };

  const handleCommentMouseMove = (e: MouseEvent) => {
    if (!draggingComment) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - draggingComment.startX;
    const deltaY = e.clientY - draggingComment.startY;
    
    setHighlights(prev =>
      prev.map(h =>
        h.id === draggingComment.highlightId
          ? {
              ...h,
              commentPositions: {
                ...h.commentPositions,
                [draggingComment.commentIndex]: {
                  x: draggingComment.offsetX + deltaX,
                  y: draggingComment.offsetY + deltaY,
                },
              },
            }
          : h
      )
    );
  };

  const handleCommentMouseUp = () => {
    setDraggingComment(null);
  };

  const toggleCommentExpansion = (highlightId: string, commentIndex: number) => {
    const key = `${highlightId}-${commentIndex}`;
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleAddInlineAnnotation = (highlightId: string) => {
    const trimmed = tempAnnotationText.trim();
    if (!trimmed) {
      setEditingHighlightId(null);
      setTempAnnotationText("");
      return;
    }

    setHighlightsHistory([...highlightsHistory, highlights]);
    
    const commentIndex = highlights.find(h => h.id === highlightId)?.annotations?.length || 0;
    
    setHighlights(
      highlights.map((h) =>
        h.id === highlightId
          ? { 
              ...h, 
              annotations: [...(h.annotations || []), trimmed],
              annotation: trimmed // manter para compatibilidade
            }
          : h
      )
    );
    
    // Garantir que novos comentários comecem minimizados
    const key = `${highlightId}-${commentIndex}`;
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    
    setEditingHighlightId(null);
    setTempAnnotationText("");
    
    toast({
      title: "Comentário adicionado",
      description: "Duplo-clique no comentário para expandir/minimizar.",
    });
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

    const isPrivate = novoRoteiroForm.tipoUpload === "privado";

    createRoteiro.mutate({
      titulo: novoRoteiroForm.titulo,
      conteudo: novoRoteiroForm.conteudo,
      nicho_id: novoRoteiroForm.nicho_id || undefined,
      link_video: novoRoteiroForm.link_video || undefined,
      ordem: novoRoteiroForm.ordem,
      is_private: isPrivate,
      user_id: isPrivate ? user?.id : undefined,
      criador_conteudo: novoRoteiroForm.criador_conteudo || undefined,
      visualizacoes: novoRoteiroForm.visualizacoes || undefined,
    }, {
      onSuccess: (data) => {
        setShowNovoRoteiroDialog(false);
        setNovoRoteiroForm({ 
          titulo: "", conteudo: "", nicho_id: "", link_video: "", 
          ordem: 0, criador_conteudo: "", visualizacoes: "", tipoUpload: "privado" 
        });
        
        // Ir automaticamente para análise do roteiro recém-criado
        setIsFocusMode(true);
        handleSelectRoteiro(data.id);
        
        toast({
          title: "Roteiro criado",
          description: "O roteiro foi criado e está pronto para análise.",
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
      criador_conteudo: avulsoForm.criador_conteudo || undefined,
    }, {
      onSuccess: (data) => {
        setShowAvulsoDialog(false);
        setAvulsoForm({ titulo: "", conteudo: "", criador_conteudo: "" });
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
    setFiltroEstruturaSelecionada("all");
    setModoFiltroAvancado(false);
    setShowFiltroGrifadasDialog(false);
    
    toast({
      title: "Filtro Removido",
      description: "Mostrando todos os roteiros novamente",
    });
  };

  const triggerConfetti = () => {
    // Confetes do centro
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Confetes dos lados (efeito mais dramático)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  };

  const handleVerify = () => {
    if (!currentRoteiroId) return;

    // Validação com feedback específico para cada campo
    if (!estruturaInvisivel.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha a 'Estrutura da headline invisível' antes de completar.",
        variant: "destructive",
      });
      setShowCheckboxError(false);
      return;
    }

    if (!gatilhosAtencao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha os 'Gatilhos de atenção' antes de completar.",
        variant: "destructive",
      });
      setShowCheckboxError(false);
      return;
    }

    if (estruturaRoteiroCheckboxes.length === 0) {
      toast({
        title: "Selecione uma estrutura",
        description: "Marque pelo menos uma opção na 'Estrutura do roteiro' antes de completar.",
        variant: "destructive",
      });
      setShowCheckboxError(true);
      return;
    }

    setShowCheckboxError(false);

    completarRoteiro.mutate({
      roteiro_id: currentRoteiroId,
      estrutura_invisivel: estruturaInvisivel,
      gatilhos_atencao: gatilhosAtencao,
      estrutura_roteiro: estruturaRoteiroCheckboxes.join(", "),
      carga_cognitiva: cargaCognitiva,
      o_que_tornou_viral: oQueTornouViral,
      melhorias_potencial: melhoriasPotencial,
      sublinhados: highlights,
    }, {
      onSuccess: async (data) => {
        // Salvar headlines criadas para mentorados (se houver)
        if (user) {
          const headlinesParaSalvar = mentoradosSelecionados
            .map((mentoradoId, index) => ({
              user_id: user.id,
              progresso_id: data?.id,
              roteiro_id: currentRoteiroId,
              mentorado_id: mentoradoId,
              nicho_id: null,
              headline: headlinesMentorados[`mentorado${index + 1}` as keyof typeof headlinesMentorados],
              estrutura_base: estruturaInvisivel,
            }))
            .filter(h => h.headline.trim() !== "" && h.mentorado_id);
          
          if (headlinesParaSalvar.length > 0) {
            await createHeadlinesCriadas.mutateAsync(headlinesParaSalvar);
          }
        }
        
        // Atualizar streak
        updateStreak();
        
        // 🎉 Disparar confetes
        triggerConfetti();
        
        // Toast de celebração
        toast({
          title: "🎉 Roteiro Completado!",
          description: "Parabéns! Mais uma análise concluída com sucesso.",
        });
        
        // Limpar campos e highlights
        setHighlights([]);
        setHighlightsHistory([]);
        setEstruturaInvisivel("");
        setGatilhosAtencao("");
        setEstruturaRoteiro("");
        setEstruturaRoteiroCheckboxes([]);
        setCargaCognitiva(5);
        setOQueTornouViral("");
        setMelhoriasPotencial("");
        setHeadlinesMentorados({ mentorado1: "", mentorado2: "", mentorado3: "" });
        setMentoradosSelecionados([]);
        
        // Mostrar dialog de celebração com foto aleatória
        setShowCelebracaoDialog(true);
      },
    });
  };

  const renderHighlightedText = (text: string) => {
    if (highlights.length === 0) {
      return (
        <span data-start={0} data-end={text.length}>
          {text}
        </span>
      );
    }

    // Filtrar highlights pela cor selecionada ANTES de renderizar
    const filteredHighlights = filterColor === "all" 
      ? highlights 
      : highlights.filter(h => h.color === filterColor);

    const sortedHighlights = [...filteredHighlights].sort((a, b) => a.startPos - b.startPos);
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Texto normal antes do highlight com índices
      if (highlight.startPos > lastIndex) {
        parts.push(
          <span 
            key={`text-${idx}`}
            data-start={lastIndex}
            data-end={highlight.startPos}
          >
            {text.slice(lastIndex, highlight.startPos)}
          </span>
        );
      }

      const isEditing = editingHighlightId === highlight.id;
      const commentPosition = getCommentPosition(highlight.id);
      
      // Pegar todos os comentários (novo formato ou fallback)
      const comments = highlight.annotations?.length 
        ? highlight.annotations 
        : (highlight.annotation ? [highlight.annotation] : []);

      // Renderizar highlight com comentários múltiplos
      parts.push(
              <span 
                key={`highlight-wrapper-${idx}`} 
                className={`inline-block relative group ${comments.length > 0 ? 'mb-12' : ''}`}
                style={{
                  marginBottom: comments.length > 0 ? '3rem' : '0',
                  lineHeight: '1.5',
                }}
              >
          {/* Palavra grifada com índices */}
          <mark
            data-start={highlight.startPos}
            data-end={highlight.endPos}
            ref={(el) => {
              if (el) highlightRefs.current.set(highlight.id, el);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingHighlightId(highlight.id);
              setTempAnnotationText("");
            }}
            style={{
              backgroundColor: highlight.color,
              padding: "2px 4px",
              borderRadius: "3px",
              cursor: "pointer",
              position: "relative",
            }}
            className="hover:opacity-80 transition-opacity"
            title="Duplo-clique para adicionar comentário"
          >
            {text.slice(highlight.startPos, highlight.endPos)}
          </mark>

          {/* Múltiplos comentários empilhados com posicionamento dinâmico */}
          {!isEditing && comments.length > 0 && (
            <div className="relative">
              {comments.map((comment, i) => {
                const customPos = highlight.commentPositions?.[i];
                const hasCustomPos = customPos !== undefined;
                const commentKey = `${highlight.id}-${i}`;
                const isExpanded = expandedComments.has(commentKey);
                
                // Truncar comentário se não estiver expandido
                const MAX_LENGTH = 15;
                const displayComment = isExpanded || comment.length <= MAX_LENGTH
                  ? comment
                  : comment.substring(0, MAX_LENGTH) + "...";
                
                // Se tem posição custom, usar fixed; senão usar o posicionamento automático
              const positionStyle = hasCustomPos
                ? {
                    position: 'absolute' as const,
                    left: customPos.x,
                    top: customPos.y,
                    zIndex: 50,
                  }
                : {};
                
                const positionClasses = !hasCustomPos
                  ? `absolute z-10
                     ${commentPosition === 'left' ? 'right-full mr-2 top-0' : ''}
                     ${commentPosition === 'right' ? 'left-full ml-2 top-0' : ''}
                     ${commentPosition === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}`
                  : '';
                
                return (
                  <div
                    key={i}
                    className={positionClasses}
                    style={{
                      ...positionStyle,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                    onMouseDown={(e) => handleCommentMouseDown(e, highlight.id, i)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCommentExpansion(highlight.id, i);
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: highlight.color,
                        color: '#000',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                      }}
                      className={`inline-block text-xs cursor-move select-none transition-all hover:shadow-md ${
                        isExpanded ? 'max-w-[300px] whitespace-normal break-words' : 'whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis'
                      }`}
                      title={isExpanded ? "Duplo-clique para minimizar" : `${comment} (Duplo-clique para expandir)`}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      💬 {displayComment}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Campo de adição de novo comentário */}
          {isEditing && (
            <span 
              className={`
                absolute z-20
                ${commentPosition === 'left' ? 'right-full mr-2 top-0' : ''}
                ${commentPosition === 'right' ? 'left-full ml-2 top-0' : ''}
                ${commentPosition === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
              `}
            >
              <span className="inline-flex items-center gap-1 bg-background border border-primary rounded-lg p-1 shadow-lg whitespace-nowrap">
                <Input
                  value={tempAnnotationText}
                  onChange={(e) => setTempAnnotationText(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="w-[200px] h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddInlineAnnotation(highlight.id);
                    } else if (e.key === "Escape") {
                      setEditingHighlightId(null);
                      setTempAnnotationText("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleAddInlineAnnotation(highlight.id)}
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

    // Texto restante após o último highlight com índices
    if (lastIndex < text.length) {
      parts.push(
        <span 
          key="text-end"
          data-start={lastIndex}
          data-end={text.length}
        >
          {text.slice(lastIndex)}
        </span>
      );
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
              <ThemeToggle />
              <Button
                onClick={() => setShowFiltroGrifadasDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtrar Palavras Grifadas
              </Button>
              <Button
                onClick={() => setShowNovoRoteiroDialog(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileUp className="w-4 h-4" />
                Novo Roteiro
              </Button>
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
              {isAdmin && (
                <Button
                  onClick={() => setShowGerenciarFotosDialog(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Image className="w-4 h-4" />
                  Fotos Celebração
                </Button>
              )}
            </div>
          </div>

          {/* Seção de Medalhas e Ranking lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Card de Medalhas com Streak e Contagem */}
            <MedalhasSection streak={streak} medalhasCount={medalhasUsuario.length} />
            
            {/* Ranking Mensal */}
            <Card className="p-6 h-full">
              <RankingMensal />
            </Card>
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
              
              <div className="flex items-center gap-2">
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
                
                {/* Botão adicionar nicho */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNovoNichoDialog(true)}
                  title="Adicionar novo nicho"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título..."
                className="flex-1"
              />
              
              {/* Toggle de visualização */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 rounded-none rounded-l-md"
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 rounded-none border-x"
                  onClick={() => setViewMode("table")}
                >
                  <Table2 className="h-4 w-4" />
                  Tabela
                </Button>
                <Button
                  variant={viewMode === "headlines" ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 rounded-none rounded-r-md"
                  onClick={() => setViewMode("headlines")}
                >
                  <FileText className="h-4 w-4" />
                  Headlines
                </Button>
              </div>
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

            {/* Lista de roteiros ou Tabela */}
            {viewMode === "cards" && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filtroGrifadasAtivo ? (
                  // Modo: Mostrar palavras grifadas
                  (() => {
                    const highlightsAgrupados = getHighlightsAgrupados();
                    
                    if (highlightsAgrupados.length === 0) {
                      return (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma palavra grifada encontrada com os filtros atuais.
                        </p>
                      );
                    }
                    
                    const corNome = cores.find(c => c.cor === filtroCorSelecionada)?.nome || "Todas as cores";
                    const totalHighlights = highlightsAgrupados.reduce((sum, g) => sum + g.highlights.length, 0);
                    
                    return (
                      <>
                        {/* Cabeçalho informativo */}
                        <div className="bg-muted p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-2">
                            {filtroCorSelecionada !== "all" && (
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: filtroCorSelecionada }}
                              />
                            )}
                            <span className="font-semibold">{corNome}</span>
                            <span className="text-sm text-muted-foreground">
                              ({totalHighlights} {totalHighlights === 1 ? 'palavra grifada' : 'palavras grifadas'})
                            </span>
                          </div>
                        </div>
                        
                        {/* Lista de highlights agrupados por roteiro */}
                        {highlightsAgrupados.map((grupo) => (
                          <Card key={grupo.roteiroId} className="p-4 space-y-3">
                            {/* Header do roteiro */}
                            <div className="flex items-center justify-between border-b pb-2">
                              <div>
                                <h4 className="font-medium text-sm">{grupo.roteiroTitulo}</h4>
                                {grupo.nicho && (
                                  <p className="text-xs text-muted-foreground">{grupo.nicho}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {grupo.highlights.length} {grupo.highlights.length === 1 ? 'grifada' : 'grifadas'}
                              </span>
                            </div>
                            
                            {/* Lista de highlights */}
                            <div className="space-y-2">
                              {grupo.highlights.map((highlight, index) => (
                                <div
                                  key={highlight.id}
                                  className="group hover:bg-accent p-2 rounded-lg transition-colors cursor-pointer"
                                  onClick={() => {
                                    setIsFocusMode(true);
                                    handleSelectRoteiro(grupo.roteiroId);
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-xs text-muted-foreground font-mono mt-0.5">
                                      {index + 1}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="text-sm px-2 py-1 rounded inline-block"
                                        style={{ backgroundColor: highlight.color }}
                                      >
                                        {highlight.text}
                                      </p>
                                      {highlight.annotation && (
                                        <p className="text-xs text-muted-foreground mt-1 ml-2">
                                          💬 {highlight.annotation}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Botão para analisar o roteiro */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setIsFocusMode(true);
                                handleSelectRoteiro(grupo.roteiroId);
                              }}
                            >
                              Analisar este roteiro
                            </Button>
                          </Card>
                        ))}
                      </>
                    );
                  })()
                ) : (
                  // Modo normal: Mostrar lista de roteiros
                  filteredRoteiros.length === 0 ? (
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
                              {/* Criador e visualizações */}
                              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                {roteiro.criador_conteudo && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{roteiro.criador_conteudo}</span>
                                  </div>
                                )}
                                {roteiro.visualizacoes && (
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>{roteiro.visualizacoes} views</span>
                                  </div>
                                )}
                              </div>
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
                  )
                )}
              </div>
            )}
          </Card>

          {/* Tabela de análises - Fora do Card para ocupar largura total */}
          {viewMode === "table" && (
            <div className="w-full mt-6">
              <AnalysesTableView
                progressos={progressoData}
                roteiros={roteiros}
                cores={cores}
                nichos={nichos}
                onSelectAnalysis={(progressoId) => {
                  setSelectedAnalysis(progressoId);
                  setShowAnalysesDialog(true);
                }}
              />
            </div>
          )}
          
          {/* Headlines criadas - Nova aba */}
          {viewMode === "headlines" && (
            <div className="w-full mt-6">
              <HeadlinesCriadasView />
            </div>
          )}
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
            <ThemeToggle />
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
        {isFocusMode && (
          <div>
            <ThemeToggle />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1fr] gap-6">
        {/* Coluna Esquerda - Legenda de Cores + Lista de Highlights */}
        <div className="space-y-4 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
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
            
            {/* Botões de Ação */}
            <div className="space-y-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={highlightsHistory.length === 0}
                title="Desfazer último sublinhado (Ctrl+Z)"
                className="w-full"
              >
                Desfazer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHighlights([]);
                  setHighlightsHistory([]);
                  setEstruturaInvisivel("");
                  setGatilhosAtencao("");
                  setEstruturaRoteiro("");
                  setEstruturaRoteiroCheckboxes([]);
                  setCargaCognitiva(5);
                  setOQueTornouViral("");
                  setMelhoriasPotencial("");
                }}
                className="w-full"
              >
                Limpar Tudo
              </Button>
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
            <div className="mb-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const processedUrl = getWatchableVideoUrl(currentRoteiro.link_video!);
                  if (processedUrl) {
                    window.open(processedUrl, '_blank');
                  } else {
                    toast({
                      title: "Link inválido",
                      description: "Não foi possível abrir o vídeo. Verifique o link.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Assistir Vídeo do Roteiro
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => handleCopyVideoLink(currentRoteiro.link_video!)}
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </Button>
            </div>
          )}
          
          {filterColor === "all" ? (
            <div
              id="roteiro-content"
              className="relative prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed select-text cursor-text"
              onMouseUp={handleTextSelection}
            >
              {renderHighlightedText(currentRoteiro.conteudo)}
            </div>
          ) : (
            <HighlightsTable
              highlights={highlights.filter(h => h.color === filterColor)}
              colorName={cores.find(c => c.cor === filterColor)?.nome || ""}
              color={filterColor}
              onRemoveHighlight={handleRemoveHighlight}
            />
          )}
        </Card>

        {/* Coluna Direita - Análise */}
        <div className="space-y-4">
          {/* Botão Completar no Topo */}
          <div className="flex justify-end">
            <Button 
              onClick={handleVerify} 
              disabled={completarRoteiro.isPending}
              size="lg"
              className="w-full sm:w-auto"
            >
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

          {/* Campo 1: Estrutura da Headline */}
          <Card className="p-4">
            <Label htmlFor="estrutura-invisivel" className="text-sm font-medium mb-2 block">
              Retire a estrutura da headline
            </Label>
            <Textarea
              id="estrutura-invisivel"
              value={estruturaInvisivel}
              onChange={(e) => setEstruturaInvisivel(e.target.value)}
              placeholder=""
              className="min-h-[150px] resize-none"
            />
          </Card>

          {/* Campo Headlines para Mentorados */}
          <Card className="p-4 border-primary/30 bg-primary/5">
            <Label className="text-sm font-medium mb-4 block">
              Crie headlines para 3 mentorados diferentes usando essa estrutura
            </Label>
            <div className="space-y-4">
              {[0, 1, 2].map((index) => {
                const mentoradoId = mentoradosSelecionados[index];
                const mentorado = mentorados.find(m => m.id === mentoradoId);
                
                return (
                  <div key={index} className="space-y-2">
                    {/* Seletor de mentorado */}
                    <Select
                      value={mentoradoId || ""}
                      onValueChange={(value) => handleSelectMentorado(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um mentorado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mentorados
                          .filter(m => !mentoradosSelecionados.includes(m.id) || mentoradosSelecionados[index] === m.id)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={m.avatar || undefined} />
                                  <AvatarFallback className="text-[10px]">{m.iniciais}</AvatarFallback>
                                </Avatar>
                                <span>{m.nome}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Campo de headline (só aparece se mentorado selecionado) */}
                    {mentoradoId && (
                      <Textarea
                        value={headlinesMentorados[`mentorado${index + 1}` as keyof typeof headlinesMentorados]}
                        onChange={(e) => setHeadlinesMentorados(prev => ({
                          ...prev,
                          [`mentorado${index + 1}`]: e.target.value
                        }))}
                        placeholder={`Digite uma headline para ${mentorado?.nome || "este mentorado"}...`}
                        className="min-h-[60px] resize-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {mentorados.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Você ainda não tem mentorados cadastrados. Cadastre mentorados na aba "Meus Mentorados".
              </p>
            )}
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
              placeholder=""
              className="min-h-[120px] resize-none"
            />
          </Card>

          {/* Campo 3: Conteúdo Notável */}
          <Card className={`p-4 transition-all ${showCheckboxError ? 'border-2 border-destructive ring-2 ring-destructive/20' : ''}`}>
            <Label className={`text-sm font-medium mb-3 block ${showCheckboxError ? 'text-destructive' : ''}`}>
              Conteúdo notável presente {showCheckboxError && <span className="text-destructive">*</span>}
            </Label>
            {showCheckboxError && (
              <p className="text-xs text-destructive mb-2">
                Marque pelo menos uma opção antes de completar
              </p>
            )}
            <div className="space-y-3">
              {[
                "Valor prático",
                "Historia",
                "Prova/ argumentação",
                "Ponto de identificação",
                "Opinião polêmica",
                "Fatos curiosos"
              ].map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`estrutura-${item}`}
                    checked={estruturaRoteiroCheckboxes.includes(item)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEstruturaRoteiroCheckboxes([...estruturaRoteiroCheckboxes, item]);
                        setShowCheckboxError(false);
                      } else {
                        setEstruturaRoteiroCheckboxes(
                          estruturaRoteiroCheckboxes.filter((i) => i !== item)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`estrutura-${item}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Campo 4: Carga Cognitiva */}
          <Card className="p-4">
            <Label htmlFor="carga-cognitiva" className="text-sm font-medium mb-3 block">
              Carga cognitiva
            </Label>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground min-w-[40px]">1</span>
                <Slider
                  id="carga-cognitiva"
                  min={1}
                  max={10}
                  step={1}
                  value={[cargaCognitiva]}
                  onValueChange={(value) => setCargaCognitiva(value[0])}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[40px]">10</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">{cargaCognitiva}</span>
              </div>
            </div>
          </Card>

          {/* Campo 5: O que tornou viral */}
          <Card className="p-4">
            <Label htmlFor="tornou-viral" className="text-sm font-medium mb-2 block">
              O que tornou esse vídeo víral?
            </Label>
            <Textarea
              id="tornou-viral"
              value={oQueTornouViral}
              onChange={(e) => setOQueTornouViral(e.target.value)}
              placeholder="Descreva os elementos que tornaram este conteúdo viral..."
              className="min-h-[120px] resize-none"
            />
          </Card>

          {/* Campo 6: Melhorias para potencial */}
          <Card className="p-4">
            <Label htmlFor="melhorias-potencial" className="text-sm font-medium mb-2 block">
              O que melhoraria nesse roteiros para ter ainda mais potencial?
            </Label>
            <Textarea
              id="melhorias-potencial"
              value={melhoriasPotencial}
              onChange={(e) => setMelhoriasPotencial(e.target.value)}
              placeholder="Sugira melhorias que aumentariam o potencial do roteiro..."
              className="min-h-[120px] resize-none"
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

      {/* Dialog Novo Roteiro */}
      <Dialog open={showNovoRoteiroDialog} onOpenChange={setShowNovoRoteiroDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Roteiro</DialogTitle>
            <DialogDescription>
              Adicione um novo roteiro {isAdmin ? "ao banco de dados" : "para você analisar"}.
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
              <Label htmlFor="novo-criador">Criador de Conteúdo</Label>
              <Input
                id="novo-criador"
                value={novoRoteiroForm.criador_conteudo}
                onChange={(e) => setNovoRoteiroForm({ ...novoRoteiroForm, criador_conteudo: e.target.value })}
                placeholder="Ex: João Silva, Canal XYZ, etc."
              />
            </div>
            <div>
              <Label htmlFor="novo-visualizacoes">Quantas Visualizações?</Label>
              <Input
                id="novo-visualizacoes"
                value={novoRoteiroForm.visualizacoes}
                onChange={(e) => setNovoRoteiroForm({ ...novoRoteiroForm, visualizacoes: e.target.value })}
                placeholder="Ex: 150k, 1.2M, 500 mil..."
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
                <div className="flex items-center gap-2">
                  <Select
                    value={novoRoteiroForm.nicho_id}
                    onValueChange={(value) => setNovoRoteiroForm({ ...novoRoteiroForm, nicho_id: value })}
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNovoNichoDialog(true)}
                    title="Adicionar novo nicho"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
            <div>
              <Label>Onde subir este roteiro?</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="tipo-privado"
                    checked={novoRoteiroForm.tipoUpload === "privado"}
                    onChange={() => setNovoRoteiroForm({ ...novoRoteiroForm, tipoUpload: "privado" })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="tipo-privado" className="cursor-pointer font-normal">
                    Subir para Mim (apenas eu vejo)
                  </Label>
                </div>
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="tipo-geral"
                      checked={novoRoteiroForm.tipoUpload === "geral"}
                      onChange={() => setNovoRoteiroForm({ ...novoRoteiroForm, tipoUpload: "geral" })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="tipo-geral" className="cursor-pointer font-normal">
                      Subir para Geral (todos veem)
                    </Label>
                  </div>
                )}
              </div>
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
              <Label htmlFor="avulso-criador">Criador de Conteúdo</Label>
              <Input
                id="avulso-criador"
                value={avulsoForm.criador_conteudo}
                onChange={(e) => setAvulsoForm({ ...avulsoForm, criador_conteudo: e.target.value })}
                placeholder="Ex: João Silva, Canal XYZ, etc."
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
              
              <div>
                <Label htmlFor="filtro-estrutura">Filtrar por Estrutura do Roteiro</Label>
                <Select 
                  value={filtroEstruturaSelecionada} 
                  onValueChange={setFiltroEstruturaSelecionada}
                  disabled={filtroCorSelecionada !== cores.find(c => c.nome === "Conteúdo notável")?.cor}
                >
                  <SelectTrigger id="filtro-estrutura">
                    <SelectValue placeholder="Todas as estruturas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as estruturas</SelectItem>
                    <SelectItem value="Valor prático">Valor prático</SelectItem>
                    <SelectItem value="Historia">Historia</SelectItem>
                    <SelectItem value="Prova/ argumentação">Prova/ argumentação</SelectItem>
                    <SelectItem value="Ponto de identificação">Ponto de identificação</SelectItem>
                    <SelectItem value="Opinião polêmica">Opinião polêmica</SelectItem>
                    <SelectItem value="Fatos curiosos">Fatos curiosos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível apenas quando "Conteúdo Notável" estiver selecionado
                </p>
              </div>
              
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
              
              <p className="text-xs text-muted-foreground">
                Combine categoria, estrutura e nicho para filtros mais específicos
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

      {/* Dialog de Estrutura do Roteiro (Conteúdo Notável) */}
      <Dialog open={showEstruturaDialog} onOpenChange={setShowEstruturaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>qual o conteúdo notável?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              "Valor prático",
              "Historia",
              "Prova/ argumentação",
              "Ponto de identificação",
              "Opinião polêmica",
              "Fatos curiosos"
            ].map((estrutura) => (
              <Button
                key={estrutura}
                variant={estruturaSelecionada === estrutura ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setEstruturaSelecionada(estrutura)}
              >
                {estrutura}
              </Button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowEstruturaDialog(false);
              setHighlightPendenteEstrutura(null);
              setEstruturaSelecionada("");
            }}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (highlightPendenteEstrutura && estruturaSelecionada) {
                const highlightComEstrutura = {
                  ...highlightPendenteEstrutura,
                  annotation: estruturaSelecionada,
                  annotations: [estruturaSelecionada]
                };
                setHighlightsHistory([...highlightsHistory, highlights]);
                setHighlights([...highlights, highlightComEstrutura]);
                setShowEstruturaDialog(false);
                setHighlightPendenteEstrutura(null);
                setEstruturaSelecionada("");
              }
            }} disabled={!estruturaSelecionada}>
              Confirmar
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
                  onDelete={() => {
                    setSelectedAnalysis(null);
                    setShowAnalysesDialog(false);
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Nicho */}
      <Dialog open={showNovoNichoDialog} onOpenChange={setShowNovoNichoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Nicho</DialogTitle>
            <DialogDescription>
              Crie um novo nicho para categorizar os roteiros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="novo-nicho-nome">Nome do Nicho</Label>
              <Input
                id="novo-nicho-nome"
                value={novoNichoNome}
                onChange={(e) => setNovoNichoNome(e.target.value)}
                placeholder="Ex: Finanças, Saúde, Desenvolvimento Pessoal..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowNovoNichoDialog(false);
                setNovoNichoNome("");
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (!novoNichoNome.trim()) {
                    toast({
                      title: "Nome obrigatório",
                      description: "Digite um nome para o nicho.",
                      variant: "destructive",
                    });
                    return;
                  }
                  await createNicho.mutateAsync(novoNichoNome.trim());
                  setShowNovoNichoDialog(false);
                  setNovoNichoNome("");
                }}
                disabled={createNicho.isPending}
              >
                {createNicho.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Nicho"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciar Fotos de Celebração (Admin) */}
      <GerenciarFotosDialog
        open={showGerenciarFotosDialog}
        onOpenChange={setShowGerenciarFotosDialog}
      />

      {/* Dialog de Celebração ao Completar Análise */}
      <CelebracaoDialog
        open={showCelebracaoDialog}
        onOpenChange={(open) => {
          setShowCelebracaoDialog(open);
          if (!open) {
            // Redirecionar para home quando fechar
            navigate('/');
          }
        }}
      />
    </>
  );
};

export default AnaliseRoteiroGame;
