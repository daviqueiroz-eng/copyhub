import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, Copy, Trash2, Plus, Check, Loader2, ClipboardCopy, Volume2, Square, Search, FileEdit, Instagram, ExternalLink, Undo2, Redo2, CheckSquare, RotateCcw, Package, Video } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useTrelloImport, TrelloCard } from "@/hooks/useTrelloImport";
import {
  useOverdeliveryRoteiros,
  transformToBlocos,
  useSaveAllOverdeliveryBlocos,
} from "@/hooks/useOverdeliveryRoteiros";
import {
  useGuiasConfig,
  useUpsertGuiaConfig,
  useDeleteGuiaConfig,
  useUpdateGuiaQuantidade,
} from "@/hooks/useGuiasConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import { TTSConfigPopover } from "./TTSConfigPopover";
import { FindReplaceDialog } from "./FindReplaceDialog";
import { SpellCheckerPanel, SpellError } from "./SpellCheckerPanel";
import { InlineSpellCheckEditor, SpellError as InlineSpellError } from "./InlineSpellCheckEditor";
import { RoteiroChecklist, TimersRecord } from "./RoteiroChecklist";
import { RoteiroFeedbackDialog } from "./RoteiroFeedbackDialog";
import { RoteiroProgressBar } from "./RoteiroProgressBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMentoradosRoteiros,
  useUpsertMentoradoRoteiro,
  useDeleteGuia,
  useDeletedGuias,
  useRestoreGuia,
} from "@/hooks/useMentoradosRoteiros";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMentorados, useUpdateMentorado } from "@/hooks/useMentorados";
import { SlashCommandPopover } from "./SlashCommandPopover";
import { HeadlinesRandomDialog } from "./HeadlinesRandomDialog";
// MentoradoHeadlinesList removido - seleção agora é feita diretamente nos campos de headline
import { TipoRoteiroDialog, HeadlineComTipo } from "./TipoRoteiroDialog";
import { AnalysisHeadline } from "@/hooks/useAnalysisHeadlines";
import { OverdeliveryView } from "./OverdeliveryView";
import { TeleprompterDialog } from "./TeleprompterDialog";
import { RoteiroRevisaoDialog } from "./RoteiroRevisaoDialog";
import { BulkProgressPanel, BulkProgressState } from "./BulkProgressPanel";
import { useInteligenciaGlobal } from "@/hooks/useInteligenciaGlobal";

type SlashCommandMode = "menu" | "intensificadores" | "ctas" | string;

interface AvatarCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  items: string[];
}

interface MentoradoRoteirosViewProps {
  mentoradoId: string;
  mentoradoNome: string;
  onClose: () => void;
}

type RoteiroLocal = {
  headline: string;
  estrutura: string;
};

type GuiaConfig = {
  numero: number;
  quantidade: number;
  isOverdelivery?: boolean;
};

type OverdeliveryBloco = {
  id: string;
  titulo: string;
  isOpen: boolean;
  roteiros: { ordem: number; headline: string; estrutura: string }[];
};

export const MentoradoRoteirosView = ({
  mentoradoId,
  mentoradoNome,
  onClose,
}: MentoradoRoteirosViewProps) => {
  const [guiaAtiva, setGuiaAtiva] = useState(1);
  const [guias, setGuias] = useState<GuiaConfig[]>([]);
  const [showFirstGuiaDialog, setShowFirstGuiaDialog] = useState(true);
  const [roteirosLocais, setRoteirosLocais] = useState<Map<string, RoteiroLocal>>(new Map());
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [showNewGuiaDialog, setShowNewGuiaDialog] = useState(false);
  const [showHeadlinesModal, setShowHeadlinesModal] = useState(false);
  const [headlinesTargetKey, setHeadlinesTargetKey] = useState<string>("");
  const [savedHeadlines, setSavedHeadlines] = useState<AnalysisHeadline[]>([]);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSpellChecker, setShowSpellChecker] = useState(false);
  const [spellErrors, setSpellErrors] = useState<SpellError[]>([]);
  const [showInlineErrors, setShowInlineErrors] = useState(false);
  const [ignoredErrorIds, setIgnoredErrorIds] = useState<Set<string>>(new Set());
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackTimers, setFeedbackTimers] = useState<TimersRecord | null>(null);
  const [quantidadePersonalizada, setQuantidadePersonalizada] = useState<string>("");
  const [overdeliveryBlocosLocal, setOverdeliveryBlocosLocal] = useState<Map<number, OverdeliveryBloco[]>>(new Map());
  const [overdeliverySaving, setOverdeliverySaving] = useState(false);
  const [overdeliverySaved, setOverdeliverySaved] = useState(false);
  const overdeliverySaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [highlightedMatch, setHighlightedMatch] = useState<{
    guiaNumero: number;
    ordem: number;
    field: "headline" | "estrutura";
    startIndex: number;
    endIndex: number;
  } | null>(null);
  
  // Timer state - elevado para comunicar entre RoteiroTimer e RoteiroChecklist
  const [timers, setTimers] = useState<TimersRecord>({
    headlines: { segundos: 0, isRunning: false, finalizado: false },
    roteiros: { segundos: 0, isRunning: false, finalizado: false },
    revisar: { segundos: 0, isRunning: false, finalizado: false },
  });
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timersLoaded, setTimersLoaded] = useState(false);
  
  // Timer alert state - para avisar quando digitar sem timer ativo
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const [timerAlertField, setTimerAlertField] = useState<"headlines" | "roteiros" | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  
  // Inatividade - pausar timer após 15 minutos sem atividade
  const lastActivityRef = useRef<number>(Date.now());
  const INACTIVITY_PAUSE_MS = 15 * 60 * 1000; // 15 minutos
  
  // Campos finalizados (confirmados por blur) - para contar progresso apenas após clicar fora
  const [finalizedFields, setFinalizedFields] = useState<Set<string>>(new Set());
  
  // Slash command state
  const [slashCommand, setSlashCommand] = useState<{
    isOpen: boolean;
    mode: SlashCommandMode;
    targetKey: string;
    targetField: "headline" | "estrutura";
    position: { top: number; left: number };
  }>({
    isOpen: false,
    mode: "menu",
    targetKey: "",
    targetField: "headline",
    position: { top: 0, left: 0 },
  });

  // TTS hook with configurable rate, pitch, voice
  const { 
    speak, 
    stop, 
    isSpeaking, 
    voices, 
    selectedVoice, 
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch 
  } = useWebSpeechTTS({ rate: 1.0, pitch: 1.0 });
  
  // Estado para guardar posição do cursor por roteiro
  const cursorPositionRef = useRef<Map<string, number>>(new Map());
  
  // Ref para o key do roteiro que está sendo falado
  const speakingKeyRef = useRef<string | null>(null);

  // Refs para debounce
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingChangesRef = useRef<Map<string, RoteiroLocal>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLTextAreaElement>>(new Map());

  // Estado para histórico de undo/redo
  const [history, setHistory] = useState<Map<string, RoteiroLocal>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { data: roteiros = [], isLoading } = useMentoradosRoteiros(mentoradoId);
  const { data: mentorados = [] } = useMentorados();
  const { data: trelloImport } = useTrelloImport();
  const upsertRoteiro = useUpsertMentoradoRoteiro();
  const deleteGuia = useDeleteGuia();
  const updateMentorado = useUpdateMentorado();
  const { data: deletedGuias = [] } = useDeletedGuias(mentoradoId);
  const restoreGuia = useRestoreGuia();
  
  // Hooks para config de guias (persistência do isOverdelivery)
  const { data: guiasConfigDb = [], isLoading: isLoadingGuiasConfig } = useGuiasConfig(mentoradoId);
  const upsertGuiaConfig = useUpsertGuiaConfig();
  const deleteGuiaConfig = useDeleteGuiaConfig();
  const updateGuiaQuantidade = useUpdateGuiaQuantidade();
  
  // Hooks para overdelivery persistência
  const guiaAtivaParaOverdelivery = guias.find(g => g.numero === guiaAtiva)?.isOverdelivery ? guiaAtiva : 0;
  const { data: overdeliveryData = [], isLoading: isLoadingOverdelivery } = useOverdeliveryRoteiros(
    mentoradoId,
    guiaAtivaParaOverdelivery
  );
  const saveAllOverdelivery = useSaveAllOverdeliveryBlocos();
  
  // Estado para confirmação de deletar guia
  const [guiaToDelete, setGuiaToDelete] = useState<number | null>(null);
  const [showTrashDropdown, setShowTrashDropdown] = useState(false);
  
  // Estado para checklist mobile
  const [showChecklistMobile, setShowChecklistMobile] = useState(false);
  
  // Estado para teleprompter
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState("");
  
  // Estado para seleção de roteiros (por key ex: "1-1", "1-2") e tipo de roteiro
  const [selectedRoteiroKeys, setSelectedRoteiroKeys] = useState<string[]>([]);
  const [showTipoRoteiroDialog, setShowTipoRoteiroDialog] = useState(false);
  
  // Estado para dialog de revisão com IA
  const [showRevisaoDialog, setShowRevisaoDialog] = useState(false);
  
  // Estado para geração em massa com painel lateral
  const [bulkProgress, setBulkProgress] = useState<BulkProgressState | null>(null);
  const [bulkHeadlines, setBulkHeadlines] = useState<Array<{ key: string; headline: string }>>([]);
  
  // Hook para inteligência global
  const { data: inteligenciaGlobal } = useInteligenciaGlobal();

  // Buscar categorias do avatar do mentorado atual
  const currentMentorado = mentorados.find(m => m.id === mentoradoId);
  const avatarCategories: AvatarCategory[] = (() => {
    if (!currentMentorado?.observacoes) return [];
    try {
      const parsed = JSON.parse(currentMentorado.observacoes);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not valid JSON
    }
    return [];
  })();

  // Buscar card do Trello pelo nome do mentorado
  const trelloCard = useMemo(() => {
    if (!trelloImport?.dados || !mentoradoNome) return null;
    const cards = trelloImport.dados as unknown as TrelloCard[];
    
    return cards.find(card => {
      const cardNameLower = card.cardName.toLowerCase().trim();
      const mentoradoLower = mentoradoNome.toLowerCase().trim();
      return cardNameLower.includes(mentoradoLower) || mentoradoLower.includes(cardNameLower);
    });
  }, [trelloImport, mentoradoNome]);

  // Inicializar guias a partir das configurações do banco (prioridade)
  useEffect(() => {
    if (isLoadingGuiasConfig || isLoading) return;
    
    // Se temos configurações no banco, usá-las (mantém isOverdelivery)
    if (guiasConfigDb.length > 0) {
      const guiasDoDb: GuiaConfig[] = guiasConfigDb.map(g => ({
        numero: g.numero,
        quantidade: g.quantidade,
        isOverdelivery: g.is_overdelivery,
      }));
      setGuias(guiasDoDb);
      setShowFirstGuiaDialog(false);
      return;
    }
    
    // Fallback: reconstruir de roteiros se não tiver config no banco (guias antigas)
    const guiasExistentes = new Set<number>();
    roteiros.forEach((r) => guiasExistentes.add(r.guia_numero));
    
    if (guiasExistentes.size > 0) {
      const maxGuia = Math.max(...guiasExistentes);
      const guiasAtualizadas: GuiaConfig[] = [];
      
      for (let i = 1; i <= maxGuia; i++) {
        const roteirosGuia = roteiros.filter(r => r.guia_numero === i);
        const maxOrdem = roteirosGuia.length > 0 ? Math.max(...roteirosGuia.map(r => r.ordem)) : 10;
        guiasAtualizadas.push({ numero: i, quantidade: Math.max(maxOrdem, 10) });
      }
      
      if (guiasAtualizadas.length > 0) {
        setGuias(guiasAtualizadas);
        setShowFirstGuiaDialog(false);
        
        // Salvar no banco para próximas vezes
        guiasAtualizadas.forEach(g => {
          upsertGuiaConfig.mutate({
            mentorado_id: mentoradoId,
            numero: g.numero,
            quantidade: g.quantidade,
            is_overdelivery: false,
          });
        });
      }
    }
  }, [guiasConfigDb, isLoadingGuiasConfig, roteiros, isLoading, mentoradoId]);

  // Inicializar roteiros locais a partir do banco
  useEffect(() => {
    if (isLoading) return;
    
    const newMap = new Map<string, RoteiroLocal>();
    
    // Preencher com dados do banco
    roteiros.forEach((r) => {
      const key = `${r.guia_numero}-${r.ordem}`;
      newMap.set(key, {
        headline: r.headline || "",
        estrutura: r.estrutura || "",
      });
    });
    
    setRoteirosLocais(newMap);
    
    // Inicializar histórico com estado inicial
    if (newMap.size > 0) {
      const initialState = new Map(
        Array.from(newMap.entries()).map(([k, v]) => [k, { ...v }])
      );
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [roteiros, isLoading]);

  // Função para mudar de guia com limpeza de estado
  const handleGuiaChange = useCallback((novaGuia: number) => {
    // Parar timer ativo antes de mudar
    if (activeTimerId) {
      setTimers(prev => ({
        ...prev,
        [activeTimerId]: { ...prev[activeTimerId], isRunning: false }
      }));
      setActiveTimerId(null);
    }
    
    // IMPORTANTE: Marcar timers como não carregados ANTES de mudar de guia
    // Isso impede que o RoteiroChecklist salve dados incorretos
    setTimersLoaded(false);
    
    setGuiaAtiva(novaGuia);
  }, [activeTimerId]);

  // Carregar timers do localStorage quando mudar de guia
  useEffect(() => {
    setTimersLoaded(false); // Indicar que está carregando
    
    // IMPORTANTE: Resetar timers para valores zerados ANTES de carregar
    // Isso evita que valores antigos vazem para outra guia
    setTimers({
      headlines: { segundos: 0, isRunning: false, finalizado: false },
      roteiros: { segundos: 0, isRunning: false, finalizado: false },
      revisar: { segundos: 0, isRunning: false, finalizado: false },
    });
    setActiveTimerId(null);
    
    const timerIds = ["headlines", "roteiros", "revisar"];
    const loadedTimers: TimersRecord = {};
    
    timerIds.forEach(id => {
      const timerKey = `roteiro-timer-${mentoradoId}-${guiaAtiva}-${id}`;
      const saved = localStorage.getItem(timerKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          loadedTimers[id] = {
            segundos: data.segundos || 0,
            isRunning: false, // Sempre pausado ao carregar
            finalizado: data.finalizado || false,
          };
        } catch {
          loadedTimers[id] = { segundos: 0, isRunning: false, finalizado: false };
        }
      } else {
        loadedTimers[id] = { segundos: 0, isRunning: false, finalizado: false };
      }
    });
    
    setTimers(loadedTimers);
    setTimersLoaded(true); // Indicar que terminou de carregar
  }, [mentoradoId, guiaAtiva]);

  // Estados para controlar marcos de motivação já celebrados
  const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());

  // Handler para criar primeira guia
  const handleCreateFirstGuia = (quantidade: number, isOverdelivery = false) => {
    // Limpar qualquer dado antigo no localStorage para guia 1
    const timerIds = ["headlines", "roteiros", "revisar"];
    timerIds.forEach((id) => {
      const timerKey = `roteiro-timer-${mentoradoId}-1-${id}`;
      localStorage.removeItem(timerKey);
    });
    localStorage.removeItem(`roteiro-checklist-${mentoradoId}-1`);
    localStorage.removeItem(`checklist-completed-${mentoradoId}-1`);

    // Resetar timers no estado
    setTimers({
      headlines: { segundos: 0, isRunning: false, finalizado: false },
      roteiros: { segundos: 0, isRunning: false, finalizado: false },
      revisar: { segundos: 0, isRunning: false, finalizado: false },
    });
    setActiveTimerId(null);
    setTimersLoaded(true);

    // Se for overdelivery, inicializar com um bloco
    if (isOverdelivery) {
      setOverdeliveryBlocosLocal(prev => {
        const newMap = new Map(prev);
        newMap.set(1, [
          { id: `bloco-${Date.now()}`, titulo: "Bloco 1", isOpen: true, roteiros: [{ ordem: 1, headline: "", estrutura: "" }] }
        ]);
        return newMap;
      });
    }

    // Salvar configuração no banco de dados
    upsertGuiaConfig.mutate({
      mentorado_id: mentoradoId,
      numero: 1,
      quantidade: quantidade,
      is_overdelivery: isOverdelivery,
    });

    setGuias([{ numero: 1, quantidade, isOverdelivery }]);
    setShowFirstGuiaDialog(false);
    setQuantidadePersonalizada("");
    toast({
      title: isOverdelivery ? "Overdelivery criado!" : "Guia criada!",
      description: isOverdelivery 
        ? `Overdelivery criado com sistema de blocos.`
        : `Guia 1 com ${quantidade} roteiros criada.`,
    });
  };

  // Handler para deletar guia
  const handleDeleteGuia = useCallback((guiaNumero: number) => {
    // Deletar do banco
    deleteGuia.mutate(
      { mentoradoId, guiaNumero },
      {
        onSuccess: () => {
          // Remover roteiros locais da guia
          setRoteirosLocais((prev) => {
            const newMap = new Map(prev);
            for (const key of Array.from(newMap.keys())) {
              if (key.startsWith(`${guiaNumero}-`)) {
                newMap.delete(key);
              }
            }
            return newMap;
          });

          // Remover guia do estado
          setGuias((prev) => prev.filter((g) => g.numero !== guiaNumero));
          
          // Deletar config da guia do banco
          deleteGuiaConfig.mutate({ mentorado_id: mentoradoId, numero: guiaNumero });

          // Se a guia ativa foi deletada, mudar para a primeira guia disponível
          if (guiaAtiva === guiaNumero) {
            // IMPORTANTE: Marcar timers como não carregados ANTES de mudar de guia
            // Isso impede que o RoteiroChecklist salve dados incorretos
            setTimersLoaded(false);
            
            const remaining = guias.filter((g) => g.numero !== guiaNumero);
            if (remaining.length > 0) {
              setGuiaAtiva(remaining[0].numero);
            } else {
              // Se não sobrou nenhuma guia, mostrar dialog para criar nova
              setShowFirstGuiaDialog(true);
            }
          }

          // Limpar timers, checklist e celebração do localStorage
          const timerIds = ["headlines", "roteiros", "revisar"];
          timerIds.forEach((id) => {
            const timerKey = `roteiro-timer-${mentoradoId}-${guiaNumero}-${id}`;
            localStorage.removeItem(timerKey);
          });
          localStorage.removeItem(`roteiro-checklist-${mentoradoId}-${guiaNumero}`);
          localStorage.removeItem(`checklist-completed-${mentoradoId}-${guiaNumero}`);

          toast({
            title: "Guia apagada",
            description: `Guia ${guiaNumero} foi removida com sucesso.`,
          });
        },
        onError: () => {
          toast({
            title: "Erro ao apagar",
            description: "Não foi possível apagar a guia.",
            variant: "destructive",
          });
        },
      }
    );

    setGuiaToDelete(null);
  }, [deleteGuia, deleteGuiaConfig, mentoradoId, guiaAtiva, guias]);

  // Função para salvar
  const saveRoteiro = useCallback(
    (guiaNumero: number, ordem: number, headline: string, estrutura: string) => {
      const key = `${guiaNumero}-${ordem}`;
      
      // Não salvar se ambos estiverem vazios
      if (!headline.trim() && !estrutura.trim()) return;

      setSavingKeys((prev) => new Set(prev).add(key));
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      upsertRoteiro.mutate(
        {
          mentoradoId,
          guiaNumero,
          ordem,
          headline,
          estrutura,
        },
        {
          onSuccess: () => {
            setSavingKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
            setSavedKeys((prev) => new Set(prev).add(key));
            
            // Remover indicador de salvo após 2s
            setTimeout(() => {
              setSavedKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
              });
            }, 2000);
          },
          onError: () => {
            setSavingKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
            toast({
              title: "Erro ao salvar",
              description: "Não foi possível salvar o roteiro.",
              variant: "destructive",
            });
          },
        }
      );
    },
    [mentoradoId, upsertRoteiro]
  );

  // Função para salvar snapshot no histórico (debounced)
  const saveToHistory = useCallback((newState: Map<string, RoteiroLocal>) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    
    // Debounce para agrupar edições rápidas
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }
    
    historyDebounceRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        // Deep clone do Map
        const clonedState = new Map(
          Array.from(newState.entries()).map(([k, v]) => [k, { ...v }])
        );
        newHistory.push(clonedState);
        // Limitar histórico a 50 estados
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, 500);
  }, [historyIndex]);

  // Função de Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousState = history[newIndex];
      if (previousState) {
        setRoteirosLocais(new Map(
          Array.from(previousState.entries()).map(([k, v]) => [k, { ...v }])
        ));
      }
      toast({ title: "Ação desfeita", description: "Ctrl+Shift+Z para refazer" });
    }
  }, [historyIndex, history]);

  // Função de Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = history[newIndex];
      if (nextState) {
        setRoteirosLocais(new Map(
          Array.from(nextState.entries()).map(([k, v]) => [k, { ...v }])
        ));
      }
      toast({ title: "Ação refeita" });
    }
  }, [historyIndex, history]);

  // Atalhos de teclado para Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (não Shift)
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo: Ctrl+Shift+Z
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Registrar atividade do usuário
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Verificar inatividade e pausar timers após 15 minutos
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const isAnyRunning = Object.values(timers).some(t => t.isRunning);
      if (!isAnyRunning) return; // Nenhum timer rodando, não precisa pausar
      
      const msSinceLastActivity = Date.now() - lastActivityRef.current;
      if (msSinceLastActivity > INACTIVITY_PAUSE_MS) {
        // Pausar todos os timers ativos
        setTimers(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (updated[key].isRunning) {
              updated[key] = { ...updated[key], isRunning: false };
            }
          });
          return updated;
        });
        setActiveTimerId(null);
        
        toast({
          title: "⏸️ Timer pausado por inatividade",
          description: "Você ficou 15 minutos sem atividade nos roteiros.",
        });
        
        // Resetar o timestamp para evitar alertas repetidos
        lastActivityRef.current = Date.now();
      }
    }, 30000); // Verificar a cada 30 segundos
    
    return () => clearInterval(checkInactivity);
  }, [timers]);

  const handleChange = useCallback((
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura",
    value: string
  ) => {
    // Registrar atividade do usuário
    registerActivity();
    
    const key = `${guiaNumero}-${ordem}`;
    
    // Atualizar estado local imediatamente
    setRoteirosLocais((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(key) || { headline: "", estrutura: "" };
      const updated = {
        ...existing,
        [field]: value,
      };
      newMap.set(key, updated);
      
      // Guardar na ref para o debounce usar o valor mais recente
      pendingChangesRef.current.set(key, updated);
      
      // Salvar no histórico
      saveToHistory(newMap);
      
      return newMap;
    });

    // Limpar timer anterior
    const existingTimer = debounceTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Novo timer para auto-save (1500ms - mais tempo para evitar conflitos)
    const timer = setTimeout(() => {
      const pending = pendingChangesRef.current.get(key);
      if (pending) {
        saveRoteiro(guiaNumero, ordem, pending.headline, pending.estrutura);
        pendingChangesRef.current.delete(key);
      }
    }, 1500);
    
    debounceTimersRef.current.set(key, timer);
  }, [saveRoteiro, saveToHistory, registerActivity]);

  // Detectar "/" para abrir slash command - posicionar ao lado e acima
  const handleInputKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura"
  ) => {
    if (e.key === "/") {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const key = `${guiaNumero}-${ordem}`;
      
      // Posicionar ao lado direito e um pouco acima
      const popoverWidth = 320;
      const popoverHeight = 350;
      
      // Calcular posição - preferir à direita, senão à esquerda
      let left = rect.right + window.scrollX + 8;
      if (left + popoverWidth > window.innerWidth) {
        left = rect.left + window.scrollX - popoverWidth - 8;
      }
      
      // Posicionar mais acima
      let top = rect.top + window.scrollY - popoverHeight / 2;
      if (top < 10) top = 10;
      if (top + popoverHeight > window.innerHeight + window.scrollY) {
        top = window.innerHeight + window.scrollY - popoverHeight - 10;
      }
      
      setSlashCommand({
        isOpen: true,
        mode: "menu",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    }
  }, []);

  // Inserir texto selecionado do slash command - na posição do cursor
  const handleSlashSelectItem = useCallback((text: string) => {
    const { targetKey, targetField } = slashCommand;
    const roteiro = roteirosLocais.get(targetKey);
    if (!roteiro) return;

    const currentValue = roteiro[targetField];
    const cursorPos = cursorPositionRef.current.get(targetKey) ?? currentValue.length;
    
    // Encontrar o início do comando "/" olhando para trás a partir do cursor
    let slashStart = cursorPos;
    
    // Volta até encontrar o "/" ou chegar ao início
    while (slashStart > 0 && currentValue[slashStart - 1] !== '/') {
      slashStart--;
    }
    
    // Se encontrou o /, inclui ele na remoção
    if (slashStart > 0 && currentValue[slashStart - 1] === '/') {
      slashStart--;
    }
    
    const beforeSlash = currentValue.slice(0, slashStart);
    const afterCursor = currentValue.slice(cursorPos);
    
    const newValue = beforeSlash + text + afterCursor;

    const [guiaStr, ordemStr] = targetKey.split("-");
    handleChange(parseInt(guiaStr), parseInt(ordemStr), targetField, newValue);
  }, [slashCommand, roteirosLocais, handleChange]);

  // Função para verificar se o timer está ativo e mostrar alerta
  const checkTimerAndAlert = useCallback((field: "headline" | "estrutura") => {
    // Se o timer de revisão está ativo, não mostrar alerta (usuário está revisando)
    if (timers["revisar"]?.isRunning) return;
    
    // Mapear campo para timer ID
    const timerId = field === "headline" ? "headlines" : "roteiros";
    const timer = timers[timerId];
    
    // Se o timer não está rodando e não está finalizado, mostrar alerta
    if (!timer?.isRunning && !timer?.finalizado) {
      // Evitar spam de alertas (só mostrar a cada 30 segundos)
      const now = Date.now();
      if (now - lastAlertTimeRef.current > 30000) {
        lastAlertTimeRef.current = now;
        setTimerAlertField(timerId);
        setShowTimerAlert(true);
        
        // Auto-fechar após 5 segundos
        setTimeout(() => setShowTimerAlert(false), 5000);
      }
    }
  }, [timers]);

  // Detectar /1 ou /2 para abrir diretamente o modo correto
  const handleInputChange2 = useCallback((
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura",
    value: string,
    cursorPosition?: number
  ) => {
    // Verificar se o timer está ativo antes de processar a mudança
    checkTimerAndAlert(field);
    
    handleChange(guiaNumero, ordem, field, value);

    const key = `${guiaNumero}-${ordem}`;

    // Calcular posição do popover baseado na posição fixa
    const popoverWidth = 320;
    const popoverHeight = 350;
    // Centralizar o popover horizontalmente na tela
    let left = Math.max(20, (window.innerWidth - popoverWidth) / 2);
    let top = 200;

    // Usar a posição do cursor passada, ou a posição salva, ou o final do texto
    const cursorPos = cursorPosition ?? cursorPositionRef.current.get(key) ?? value.length;
    
    // Atualizar a posição do cursor
    cursorPositionRef.current.set(key, cursorPos);
    
    // Verificar o texto antes do cursor para detectar comandos
    const textBeforeCursor = value.slice(0, cursorPos);

    // Verificar se termina com /i, /c ou /3 antes do cursor
    if (textBeforeCursor.endsWith("/i")) {
      setSlashCommand({
        isOpen: true,
        mode: "intensificadores",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/c")) {
      setSlashCommand({
        isOpen: true,
        mode: "ctas",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/3")) {
      // Abrir modal de headlines aleatórias
      // Limpar o /3 do valor - preservando o texto após o cursor
      const textAfterCursor = value.slice(cursorPos);
      const cleanValue = textBeforeCursor.slice(0, -2) + textAfterCursor;
      handleChange(guiaNumero, ordem, field, cleanValue);
      // Atualizar posição do cursor para refletir a remoção do /3
      cursorPositionRef.current.set(key, cursorPos - 2);
      setHeadlinesTargetKey(key);
      setShowHeadlinesModal(true);
      // Fechar o popover se estiver aberto
      setSlashCommand(prev => ({ ...prev, isOpen: false }));
    } else if (textBeforeCursor.endsWith("/p")) {
      // Abrir popover de prompts
      // Limpar o /p do valor - preservando o texto após o cursor
      const textAfterCursor = value.slice(cursorPos);
      const cleanValue = textBeforeCursor.slice(0, -2) + textAfterCursor;
      handleChange(guiaNumero, ordem, field, cleanValue);
      // Atualizar posição do cursor para refletir a remoção do /p
      cursorPositionRef.current.set(key, cursorPos - 2);
      setSlashCommand({
        isOpen: true,
        mode: "prompts",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/m")) {
      // Abrir popover de mentorados para registrar headline
      // Limpar o /m do valor - preservando o texto após o cursor
      const textAfterCursor = value.slice(cursorPos);
      const cleanValue = textBeforeCursor.slice(0, -2) + textAfterCursor;
      handleChange(guiaNumero, ordem, field, cleanValue);
      // Atualizar posição do cursor para refletir a remoção do /m
      cursorPositionRef.current.set(key, cursorPos - 2);
      setSlashCommand({
        isOpen: true,
        mode: "mentorados",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    } else if (slashCommand.isOpen) {
      // Manter popover aberto se já estiver
      setSlashCommand(prev => ({ ...prev, targetKey: key, targetField: field }));
    }
  }, [handleChange, slashCommand.isOpen, checkTimerAndAlert]);

  // Handlers para CRUD do Mapa do Avatar diretamente no popover
  const handleAddAvatarItem = useCallback((categoryId: string, text: string) => {
    if (!currentMentorado) return;
    
    const updatedCategories = avatarCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, text] }
        : cat
    );
    
    updateMentorado.mutate({
      id: currentMentorado.id,
      observacoes: JSON.stringify(updatedCategories),
    });
  }, [currentMentorado, avatarCategories, updateMentorado]);

  const handleEditAvatarItem = useCallback((categoryId: string, oldText: string, newText: string) => {
    if (!currentMentorado) return;
    
    const updatedCategories = avatarCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: cat.items.map(item => item === oldText ? newText : item) }
        : cat
    );
    
    updateMentorado.mutate({
      id: currentMentorado.id,
      observacoes: JSON.stringify(updatedCategories),
    });
  }, [currentMentorado, avatarCategories, updateMentorado]);

  const handleDeleteAvatarItem = useCallback((categoryId: string, text: string) => {
    if (!currentMentorado) return;
    
    const updatedCategories = avatarCategories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: cat.items.filter(item => item !== text) }
        : cat
    );
    
    updateMentorado.mutate({
      id: currentMentorado.id,
      observacoes: JSON.stringify(updatedCategories),
    });
  }, [currentMentorado, avatarCategories, updateMentorado]);

  const handleClearRoteiro = (guiaNumero: number, ordem: number) => {
    const key = `${guiaNumero}-${ordem}`;
    
    setRoteirosLocais((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, { headline: "", estrutura: "" });
      return newMap;
    });

    // Salvar como vazio
    saveRoteiro(guiaNumero, ordem, "", "");
  };

  const handleCopyRoteiro = async (guiaNumero: number, ordem: number) => {
    const key = `${guiaNumero}-${ordem}`;
    const roteiro = roteirosLocais.get(key);
    
    if (!roteiro?.headline && !roteiro?.estrutura) {
      toast({
        title: "Roteiro vazio",
        description: "Não há conteúdo para copiar.",
      });
      return;
    }

    const ordemFormatada = String(ordem).padStart(2, '0');
    
    // HTML formatado para editores ricos (Google Docs, Word)
    const html = `<p><b style="color: #B8860B;">HEADLINE ${ordemFormatada}:</b></p><p>${roteiro.headline || ''}</p><br/><p><b style="color: #B8860B;">ESTRUTURA ${ordemFormatada}:</b></p><p>${(roteiro.estrutura || '').replace(/\n/g, '<br/>')}</p>`;

    // Texto limpo para editores simples
    const plainText = `HEADLINE ${ordemFormatada}:\n\n${roteiro.headline || ''}\n\nESTRUTURA ${ordemFormatada}:\n\n${roteiro.estrutura || ''}`;

    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
    } catch {
      navigator.clipboard.writeText(plainText);
    }
    
    toast({
      title: "Copiado!",
      description: `Roteiro ${ordemFormatada} copiado.`,
    });
  };

  const handleCopyAllRoteiros = async () => {
    const guiaConfig = guias.find(g => g.numero === guiaAtiva);
    const htmlParts: string[] = [];
    const textParts: string[] = [];
    
    // Verificar se é Overdelivery
    if (guiaConfig?.isOverdelivery) {
      const blocos = overdeliveryBlocosLocal.get(guiaAtiva) || [];
      let ordemGeral = 1;
      
      for (const bloco of blocos) {
        for (const roteiro of bloco.roteiros) {
          if (roteiro.headline || roteiro.estrutura) {
            const ordemFormatada = String(ordemGeral).padStart(2, '0');
            
            htmlParts.push(`<p><b style="color: #B8860B;">HEADLINE ${ordemFormatada}:</b></p><p>${roteiro.headline || ''}</p><br/><p><b style="color: #B8860B;">ESTRUTURA ${ordemFormatada}:</b></p><p>${(roteiro.estrutura || '').replace(/\n/g, '<br/>')}</p><hr style="border: 1px solid #e5e5e5; margin: 16px 0;"/>`);
            
            textParts.push(`HEADLINE ${ordemFormatada}:\n\n${roteiro.headline || ''}\n\nESTRUTURA ${ordemFormatada}:\n\n${roteiro.estrutura || ''}`);
            ordemGeral++;
          }
        }
      }
    } else {
      // Lógica existente para guias normais
      const quantidade = guiaConfig?.quantidade || 10;
      
      for (let ordem = 1; ordem <= quantidade; ordem++) {
        const key = `${guiaAtiva}-${ordem}`;
        const roteiro = roteirosLocais.get(key);
        
        if (roteiro?.headline || roteiro?.estrutura) {
          const ordemFormatada = String(ordem).padStart(2, '0');
          
          htmlParts.push(`<p><b style="color: #B8860B;">HEADLINE ${ordemFormatada}:</b></p><p>${roteiro.headline || ''}</p><br/><p><b style="color: #B8860B;">ESTRUTURA ${ordemFormatada}:</b></p><p>${(roteiro.estrutura || '').replace(/\n/g, '<br/>')}</p><hr style="border: 1px solid #e5e5e5; margin: 16px 0;"/>`);
          
          textParts.push(`HEADLINE ${ordemFormatada}:\n\n${roteiro.headline || ''}\n\nESTRUTURA ${ordemFormatada}:\n\n${roteiro.estrutura || ''}`);
        }
      }
    }

    if (htmlParts.length === 0) {
      toast({
        title: "Guia vazia",
        description: "Não há roteiros para copiar nesta guia.",
      });
      return;
    }

    const html = htmlParts.join('');
    const plainText = textParts.join('\n\n---\n\n');

    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
    } catch {
      navigator.clipboard.writeText(plainText);
    }
    
    toast({
      title: "Copiados!",
      description: `${htmlParts.length} roteiros da Guia ${guiaAtiva} copiados.`,
    });
  };

  // Função para processar geração em massa de roteiros (executada externamente ao dialog)
  const processBulkGeneration = useCallback(async (headlinesComTipo: HeadlineComTipo[]) => {
    // Preparar estado de progresso
    const headlines = headlinesComTipo.map(h => ({ key: h.key, headline: h.headline }));
    setBulkHeadlines(headlines);
    setBulkProgress({
      isProcessing: true,
      total: headlinesComTipo.length,
      current: 0,
      currentKey: "",
      results: [],
    });

    // Limpar seleção imediatamente
    setSelectedRoteiroKeys([]);

    const results: Array<{ key: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < headlinesComTipo.length; i++) {
      const item = headlinesComTipo[i];
      
      setBulkProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        currentKey: item.key,
      } : null);

      try {
        const { data, error } = await supabase.functions.invoke("n8n-webhook", {
          body: {
            mentorado: {
              nome: mentoradoNome,
              informacoes_mentorado: currentMentorado?.informacoes_mentorado,
              apresentacao: currentMentorado?.apresentacao,
            },
            roteiros: [{
              key: item.key,
              headline: item.headline,
              estrutura: item.estrutura,
              tipo_roteiro: item.tipoNome,
              tipo_config: item.tipoConfig,
            }],
          },
        });

        if (error) {
          console.error("Erro na Edge Function:", error);
          results.push({ key: item.key, success: false, error: error.message });
        } else if (data?.roteiros?.[0]) {
          const estrutura = data.roteiros[0].estrutura;
          results.push({ key: item.key, success: true });
          
          // Atualizar estado local imediatamente
          setRoteirosLocais((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(item.key);
            if (existing) {
              newMap.set(item.key, { ...existing, estrutura });
            }
            return newMap;
          });

          // Persistir no banco
          const [guiaNumero, ordem] = item.key.split("-").map(Number);
          upsertRoteiro.mutate({
            mentoradoId: mentoradoId,
            guiaNumero: guiaNumero,
            ordem: ordem,
            headline: item.headline,
            estrutura: estrutura,
          });
        } else {
          results.push({ key: item.key, success: false, error: "Sem resposta do webhook" });
        }
      } catch (err) {
        console.error("Erro ao processar roteiro:", err);
        results.push({ 
          key: item.key, 
          success: false, 
          error: err instanceof Error ? err.message : "Erro desconhecido" 
        });
      }

      setBulkProgress(prev => prev ? { ...prev, results: [...results] } : null);
    }

    // Marcar como finalizado
    setBulkProgress(prev => prev ? { ...prev, isProcessing: false } : null);
    
    const successCount = results.filter(r => r.success).length;
    toast({
      title: "Geração concluída!",
      description: `${successCount} de ${headlinesComTipo.length} roteiros gerados com sucesso`,
    });
  }, [mentoradoNome, currentMentorado, mentoradoId, upsertRoteiro]);

  const handleCreateGuia = (quantidade: number, isOverdelivery = false) => {
    const nextGuia = guias.length > 0 ? Math.max(...guias.map(g => g.numero)) + 1 : 1;
    
    // Limpar qualquer dado antigo no localStorage para esta guia
    const timerIds = ["headlines", "roteiros", "revisar"];
    timerIds.forEach((id) => {
      const timerKey = `roteiro-timer-${mentoradoId}-${nextGuia}-${id}`;
      localStorage.removeItem(timerKey);
    });
    localStorage.removeItem(`roteiro-checklist-${mentoradoId}-${nextGuia}`);
    localStorage.removeItem(`checklist-completed-${mentoradoId}-${nextGuia}`);

    // Resetar timers no estado
    setTimers({
      headlines: { segundos: 0, isRunning: false, finalizado: false },
      roteiros: { segundos: 0, isRunning: false, finalizado: false },
      revisar: { segundos: 0, isRunning: false, finalizado: false },
    });
    setActiveTimerId(null);
    setTimersLoaded(true);
    
    // Se for overdelivery, inicializar com um bloco
    if (isOverdelivery) {
      setOverdeliveryBlocosLocal(prev => {
        const newMap = new Map(prev);
        newMap.set(nextGuia, [
          { id: `bloco-${Date.now()}`, titulo: "Bloco 1", isOpen: true, roteiros: [{ ordem: 1, headline: "", estrutura: "" }] }
        ]);
        return newMap;
      });
    }
    
    // Salvar configuração no banco de dados
    upsertGuiaConfig.mutate({
      mentorado_id: mentoradoId,
      numero: nextGuia,
      quantidade: quantidade,
      is_overdelivery: isOverdelivery,
    });
    
    setGuias((prev) => [...prev, { numero: nextGuia, quantidade, isOverdelivery }]);
    setGuiaAtiva(nextGuia);
    setShowNewGuiaDialog(false);
    setQuantidadePersonalizada("");
    
    toast({
      title: isOverdelivery ? "Overdelivery criado!" : "Guia criada!",
      description: isOverdelivery 
        ? `Overdelivery criado com sistema de blocos.`
        : `Guia ${nextGuia} com ${quantidade} roteiros criada.`,
    });
  };
  
  const handleCreateOverdeliveryGuia = () => {
    handleCreateGuia(0, true);
  };

  // Carregar dados do overdelivery do banco quando mudar de guia
  useEffect(() => {
    if (overdeliveryData && overdeliveryData.length > 0 && guiaAtivaParaOverdelivery > 0) {
      const blocos = transformToBlocos(overdeliveryData);
      setOverdeliveryBlocosLocal(prev => {
        const newMap = new Map(prev);
        newMap.set(guiaAtivaParaOverdelivery, blocos);
        return newMap;
      });
    }
  }, [overdeliveryData, guiaAtivaParaOverdelivery]);

  const handleOverdeliverySaveRoteiro = useCallback((blocoId: string, ordem: number, headline: string, estrutura: string) => {
    // Salvar é feito via debounce no handleOverdeliveryBlocosChange
  }, []);

  // Handler para toggle visual do bloco (NÃO salva no banco)
  const handleOverdeliveryToggleBloco = useCallback((guiaNumero: number, blocoId: string, isOpen: boolean) => {
    setOverdeliveryBlocosLocal(prev => {
      const newMap = new Map(prev);
      const blocos = newMap.get(guiaNumero) || [];
      const updatedBlocos = blocos.map(b => 
        b.id === blocoId ? { ...b, isOpen } : b
      );
      newMap.set(guiaNumero, updatedBlocos);
      return newMap;
    });
    // NÃO salvar no banco - apenas estado visual
  }, []);

  // Handler para mudanças de conteúdo (SALVA no banco com debounce)
  const handleOverdeliveryContentChange = useCallback((guiaNumero: number, blocos: OverdeliveryBloco[]) => {
    // Registrar atividade do usuário
    registerActivity();
    
    // Atualizar estado local imediatamente
    setOverdeliveryBlocosLocal(prev => {
      const newMap = new Map(prev);
      newMap.set(guiaNumero, blocos);
      return newMap;
    });
    
    // Debounce para salvar no banco
    if (overdeliverySaveTimerRef.current) {
      clearTimeout(overdeliverySaveTimerRef.current);
    }
    
    setOverdeliverySaved(false);
    
    overdeliverySaveTimerRef.current = setTimeout(() => {
      setOverdeliverySaving(true);
      saveAllOverdelivery.mutate(
        { mentoradoId, guiaNumero, blocos },
        {
          onSuccess: () => {
            setOverdeliverySaving(false);
            setOverdeliverySaved(true);
            setTimeout(() => setOverdeliverySaved(false), 2000);
          },
          onError: () => {
            setOverdeliverySaving(false);
            toast({
              title: "Erro ao salvar",
              description: "Não foi possível salvar o overdelivery.",
              variant: "destructive",
            });
          },
        }
      );
    }, 1500);
  }, [mentoradoId, saveAllOverdelivery, registerActivity]);

  // Função para verificar timer e mostrar alerta (usada também no Overdelivery)
  const checkAndShowTimerAlert = useCallback((field: "headlines" | "roteiros") => {
    // Se o timer de revisão está ativo, não mostrar alerta (usuário está revisando)
    if (timers["revisar"]?.isRunning) return;
    
    const now = Date.now();
    // Evitar alertas muito frequentes (cooldown de 30 segundos)
    if (now - lastAlertTimeRef.current < 30000) return;
    
    const isAnyRunning = Object.values(timers).some(t => t.isRunning);
    if (!isAnyRunning) {
      lastAlertTimeRef.current = now;
      setTimerAlertField(field);
      setShowTimerAlert(true);
    }
  }, [timers]);

  // Handler de blur para Overdelivery (para marcar campo como finalizado)
  const handleOverdeliveryFieldBlur = useCallback((
    blocoId: string,
    ordem: number,
    field: "headline" | "estrutura"
  ) => {
    const blocos = overdeliveryBlocosLocal.get(guiaAtiva) || [];
    const bloco = blocos.find(b => b.id === blocoId);
    const roteiro = bloco?.roteiros.find(r => r.ordem === ordem);
    const fieldKey = `overdelivery-${blocoId}-${ordem}-${field}`;
    const value = field === "headline" ? roteiro?.headline : roteiro?.estrutura;
    
    setFinalizedFields(prev => {
      const next = new Set(prev);
      if (value?.trim()) {
        next.add(fieldKey);
      } else {
        next.delete(fieldKey);
      }
      return next;
    });
  }, [overdeliveryBlocosLocal, guiaAtiva]);

  const handleAddRoteiro = () => {
    const novaQuantidade = guiaAtivaConfig.quantidade + 1;
    
    setGuias((prev) => 
      prev.map((g) => 
        g.numero === guiaAtiva 
          ? { ...g, quantidade: novaQuantidade } 
          : g
      )
    );
    
    // Atualizar quantidade no banco
    updateGuiaQuantidade.mutate({
      mentorado_id: mentoradoId,
      numero: guiaAtiva,
      quantidade: novaQuantidade,
    });
    
    toast({
      title: "Roteiro adicionado!",
      description: `Roteiro ${novaQuantidade} adicionado à Guia ${guiaAtiva}.`,
    });
  };

  const getFilledCount = (guiaNumero: number) => {
    const guiaConfig = guias.find(g => g.numero === guiaNumero);
    const quantidade = guiaConfig?.quantidade || 10;
    let count = 0;
    
    for (let ordem = 1; ordem <= quantidade; ordem++) {
      const key = `${guiaNumero}-${ordem}`;
      const roteiro = roteirosLocais.get(key);
      if (roteiro?.headline || roteiro?.estrutura) {
        count++;
      }
    }
    return count;
  };

  // Get errors for a specific roteiro field
  const getErrorsForField = useCallback((guiaNumero: number, ordem: number, field: "headline" | "estrutura") => {
    if (!showInlineErrors) return [];
    return spellErrors
      .filter(e => e.guiaNumero === guiaNumero && e.ordem === ordem && e.field === field && !ignoredErrorIds.has(e.id))
      .map(e => ({
        id: e.id,
        type: e.type,
        original: e.original,
        suggestion: e.suggestion,
        startIndex: e.startIndex,
        endIndex: e.endIndex,
        message: e.message,
      }));
  }, [spellErrors, showInlineErrors, ignoredErrorIds]);

  // Handle fixing an error inline
  const handleInlineFixError = useCallback((guiaNumero: number, ordem: number, field: "headline" | "estrutura", error: InlineSpellError) => {
    const key = `${guiaNumero}-${ordem}`;
    const roteiro = roteirosLocais.get(key);
    if (!roteiro) return;

    let currentValue = roteiro[field];
    let newValue: string;

    if (error.type === "trim") {
      newValue = error.suggestion;
    } else {
      newValue = 
        currentValue.substring(0, error.startIndex) +
        error.suggestion +
        currentValue.substring(error.endIndex);
    }

    handleChange(guiaNumero, ordem, field, newValue);
    
    // Remove error from list
    setSpellErrors(prev => prev.filter(e => e.id !== error.id));
    
    toast({
      title: "Corrigido",
      description: `"${error.original}" → "${error.suggestion}"`,
    });
  }, [roteirosLocais, handleChange]);

  // Handle ignoring an error
  const handleIgnoreError = useCallback((errorId: string) => {
    setIgnoredErrorIds(prev => new Set(prev).add(errorId));
  }, []);

  const guiaAtivaConfig = guias.find(g => g.numero === guiaAtiva) || { numero: 1, quantidade: 10 };

  // Handler de blur para marcar campo como finalizado
  const handleFieldBlur = useCallback((
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura"
  ) => {
    const key = `${guiaNumero}-${ordem}`;
    const roteiro = roteirosLocais.get(key);
    const fieldKey = `${key}-${field}`;
    const value = field === "headline" ? roteiro?.headline : roteiro?.estrutura;
    
    setFinalizedFields(prev => {
      const next = new Set(prev);
      if (value?.trim()) {
        next.add(fieldKey);  // Tem conteúdo = finalizado
      } else {
        next.delete(fieldKey);  // Sem conteúdo = remover
      }
      return next;
    });
  }, [roteirosLocais]);

  // Inicializar campos finalizados quando roteiros são carregados do banco
  useEffect(() => {
    const initialFinalized = new Set<string>();
    
    roteirosLocais.forEach((roteiro, key) => {
      if (roteiro.headline?.trim()) {
        initialFinalized.add(`${key}-headline`);
      }
      if (roteiro.estrutura?.trim()) {
        initialFinalized.add(`${key}-estrutura`);
      }
    });
    
    // Só atualizar se há roteiros e se finalizedFields está vazio (inicial)
    if (roteirosLocais.size > 0 && finalizedFields.size === 0) {
      setFinalizedFields(initialFinalized);
    }
  }, [roteirosLocais.size]); // Apenas quando o tamanho muda (carregamento inicial)

  // Calcular progresso - usar finalizedFields em vez de verificar conteúdo diretamente
  const calcularProgresso = useCallback(() => {
    const guiaConfig = guias.find(g => g.numero === guiaAtiva);
    const quantidade = guiaConfig?.quantidade || 10;
    let headlinesPreenchidas = 0;
    let roteirosPreenchidos = 0;
    
    for (let ordem = 1; ordem <= quantidade; ordem++) {
      const key = `${guiaAtiva}-${ordem}`;
      // Usar finalizedFields em vez de verificar conteúdo diretamente
      if (finalizedFields.has(`${key}-headline`)) {
        headlinesPreenchidas++;
      }
      if (finalizedFields.has(`${key}-estrutura`)) {
        roteirosPreenchidos++;
      }
    }
    
    return { headlinesPreenchidas, roteirosPreenchidos, total: quantidade };
  }, [guias, guiaAtiva, finalizedFields]);
  
  const progresso = calcularProgresso();

  // Mensagens motivacionais
  const mensagensHeadlines50 = [
    "🔥 Metade das headlines prontas! Continue assim!",
    "💪 50% concluído! Você está voando!",
    "🚀 Meio caminho andado nas headlines!",
    "⚡ Excelente ritmo! Metade feita!",
  ];
  const mensagensHeadlines100 = [
    "🎉 Todas as headlines prontas! Agora é hora dos roteiros!",
    "✨ Headlines finalizadas! Mandou bem!",
    "🏆 100% das headlines! Próximo passo: roteiros!",
  ];
  const mensagensRoteiros50 = [
    "🔥 Metade dos roteiros prontos!",
    "💪 50% dos roteiros! Continue firme!",
    "🚀 Você está na metade! Não pare agora!",
  ];
  const mensagensRoteiros100 = [
    "🎉 Todos os roteiros prontos! Hora de revisar!",
    "🏆 100% concluído! Você é demais!",
    "✨ Roteiros finalizados! Missão cumprida!",
  ];

  const getRandomMessage = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Efeito para mensagens motivacionais de progresso - DEVE estar antes de qualquer return
  useEffect(() => {
    if (progresso.total === 0) return;
    
    const headlinesPercent = (progresso.headlinesPreenchidas / progresso.total) * 100;
    const roteirosPercent = (progresso.roteirosPreenchidos / progresso.total) * 100;
    const guiaKey = `${mentoradoId}-${guiaAtiva}`;

    // Headlines 50%
    if (headlinesPercent >= 50 && headlinesPercent < 100 && !celebratedMilestones.has(`${guiaKey}-headlines-50`)) {
      setCelebratedMilestones(prev => new Set(prev).add(`${guiaKey}-headlines-50`));
      toast({ title: getRandomMessage(mensagensHeadlines50) });
    }
    // Headlines 100%
    if (headlinesPercent >= 100 && !celebratedMilestones.has(`${guiaKey}-headlines-100`)) {
      setCelebratedMilestones(prev => new Set(prev).add(`${guiaKey}-headlines-100`));
      toast({ title: getRandomMessage(mensagensHeadlines100) });
    }
    // Roteiros 50%
    if (roteirosPercent >= 50 && roteirosPercent < 100 && !celebratedMilestones.has(`${guiaKey}-roteiros-50`)) {
      setCelebratedMilestones(prev => new Set(prev).add(`${guiaKey}-roteiros-50`));
      toast({ title: getRandomMessage(mensagensRoteiros50) });
    }
    // Roteiros 100%
    if (roteirosPercent >= 100 && !celebratedMilestones.has(`${guiaKey}-roteiros-100`)) {
      setCelebratedMilestones(prev => new Set(prev).add(`${guiaKey}-roteiros-100`));
      toast({ title: getRandomMessage(mensagensRoteiros100) });
    }
  }, [progresso.headlinesPreenchidas, progresso.roteirosPreenchidos, progresso.total, mentoradoId, guiaAtiva, celebratedMilestones]);

  // Return de loading DEPOIS de todos os hooks
  if (isLoading || isLoadingGuiasConfig) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex flex-col border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-poppins">Roteiros - {mentoradoNome}</h1>
                
                {currentMentorado?.instagram && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-pink-500 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-950"
                    onClick={() => {
                      const handle = currentMentorado.instagram!.replace('@', '');
                      window.open(`https://instagram.com/${handle}`, '_blank');
                    }}
                    title={`@${currentMentorado.instagram.replace('@', '')}`}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                )}
                
                {(trelloCard?.cardUrl || currentMentorado?.link_trello) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950"
                    onClick={() => window.open(trelloCard?.cardUrl || currentMentorado?.link_trello || '', '_blank')}
                    title="Abrir no Trello"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Guia {guiaAtiva} • {getFilledCount(guiaAtiva)}/{guiaAtivaConfig.quantidade} preenchidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini-timer para mobile - visível apenas em telas < lg */}
            <div className="lg:hidden flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant={Object.values(timers).some(t => t.isRunning) ? "default" : "outline"}
                size="sm"
                className="gap-1.5 h-8 px-2"
                onClick={() => setShowChecklistMobile(true)}
                title="Abrir cronômetro"
              >
                {Object.values(timers).some(t => t.isRunning) ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                )}
                <span className="font-mono text-xs">
                  {(() => {
                    const total = Object.values(timers).reduce((acc, t) => acc + t.segundos, 0);
                    const hrs = Math.floor(total / 3600);
                    const mins = Math.floor((total % 3600) / 60);
                    const secs = total % 60;
                    if (hrs > 0) {
                      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                    }
                    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                  })()}
                </span>
              </Button>
            </div>
            
            {/* Botões Undo/Redo */}
            <div className="flex items-center gap-1 border-r pr-2 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Desfazer (Ctrl+Z)"
                className="h-9 w-9"
              >
                <Undo2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Refazer (Ctrl+Shift+Z)"
                className="h-9 w-9"
              >
                <Redo2 className="h-5 w-5" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFindReplace(true)}
              title="Localizar e Substituir (Ctrl+H)"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSpellChecker(true)}
              title="Corretor Automático"
            >
              <FileEdit className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleCopyAllRoteiros}>
              <ClipboardCopy className="h-4 w-4" />
              Copiar todos
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="px-6 pb-3">
          <RoteiroProgressBar
            headlinesPreenchidas={progresso.headlinesPreenchidas}
            roteirosPreenchidos={progresso.roteirosPreenchidos}
            total={progresso.total}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Guias */}
        <div className="w-14 lg:w-48 border-r bg-muted/30 flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-2 lg:p-3 space-y-1">
              {guias.map((guia) => (
                <div key={guia.numero} className="group flex items-center gap-1">
                  <Button
                    variant={guiaAtiva === guia.numero ? "default" : "ghost"}
                    className="flex-1 justify-center lg:justify-start gap-2 px-2 lg:px-4"
                    onClick={() => handleGuiaChange(guia.numero)}
                  >
                    {guia.isOverdelivery ? (
                      <>
                        <Package className="h-4 w-4 lg:hidden" />
                        <span className="hidden lg:inline flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Overdelivery
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="lg:hidden">{guia.numero}</span>
                        <span className="hidden lg:inline">Guia {guia.numero}</span>
                        <span className="ml-auto text-xs opacity-70 hidden lg:inline">
                          {getFilledCount(guia.numero)}/{guia.quantidade}
                        </span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 hidden lg:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGuiaToDelete(guia.numero);
                    }}
                    title="Apagar guia"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 lg:p-3 border-t space-y-2">
            {/* Seção de Atalhos - acima da lixeira */}
            <div className="pb-2 border-b hidden lg:block">
              <p className="text-sm font-semibold mb-2 text-muted-foreground">Atalhos</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-mono bg-muted px-1 rounded">/</span> Mapa do avatar</p>
                <p><span className="font-mono bg-muted px-1 rounded">/c</span> CTAs</p>
                <p><span className="font-mono bg-muted px-1 rounded">/i</span> Intensificadores</p>
                <p><span className="font-mono bg-muted px-1 rounded">/p</span> Prompts</p>
                <p><span className="font-mono bg-muted px-1 rounded">/m</span> Registrar heads</p>
              </div>
            </div>

            {/* Lixeira com guias deletadas */}
            {deletedGuias.length > 0 && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowTrashDropdown(!showTrashDropdown)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden lg:inline">Lixeira ({deletedGuias.length})</span>
                </Button>
                
                {showTrashDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-lg shadow-lg z-50 p-2 space-y-1">
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                      Guias deletadas (expira em 2 dias)
                    </div>
                    {deletedGuias.map((guia) => (
                      <div key={guia.guia_numero} className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-muted rounded">
                        <span className="text-sm">Guia {guia.guia_numero}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            restoreGuia.mutate(
                              { mentoradoId, guiaNumero: guia.guia_numero },
                              {
                                onSuccess: () => {
                                  toast({
                                    title: "Guia restaurada!",
                                    description: `Guia ${guia.guia_numero} foi restaurada.`,
                                  });
                                  setShowTrashDropdown(false);
                                },
                                onError: () => {
                                  toast({
                                    title: "Erro ao restaurar",
                                    description: "Não foi possível restaurar a guia.",
                                    variant: "destructive",
                                  });
                                },
                              }
                            );
                          }}
                          disabled={restoreGuia.isPending}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restaurar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowNewGuiaDialog(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Nova Guia</span>
            </Button>
          </div>
        </div>

        {/* Main - Documento estilo Google Docs */}
        <ScrollArea className="flex-1 bg-muted/20">
          <div className="flex justify-center py-4 lg:py-8 px-2 lg:px-4">
            {/* Paper container */}
            <div className="w-full max-w-[816px] bg-background shadow-md rounded-sm" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {/* Renderizar OverdeliveryView se for guia de overdelivery */}
              {guiaAtivaConfig.isOverdelivery ? (
                <OverdeliveryView
                  blocos={overdeliveryBlocosLocal.get(guiaAtiva) || [{ id: `bloco-${Date.now()}`, titulo: "Bloco 1", isOpen: true, roteiros: [{ ordem: 1, headline: "", estrutura: "" }] }]}
                  onBlocosChange={(blocos) => handleOverdeliveryContentChange(guiaAtiva, blocos)}
                  onToggleBloco={(blocoId, isOpen) => handleOverdeliveryToggleBloco(guiaAtiva, blocoId, isOpen)}
                  onSaveRoteiro={handleOverdeliverySaveRoteiro}
                  onFieldBlur={handleOverdeliveryFieldBlur}
                  avatarCategories={avatarCategories}
                  onAddAvatarItem={handleAddAvatarItem}
                  onEditAvatarItem={handleEditAvatarItem}
                  onDeleteAvatarItem={handleDeleteAvatarItem}
                  selectedMentoradoId={mentoradoId}
                  isSaving={overdeliverySaving}
                  isSaved={overdeliverySaved}
                  isLoading={isLoadingOverdelivery}
                  onCheckTimer={checkAndShowTimerAlert}
                />
              ) : (
              <div className="px-4 sm:px-8 lg:px-16 py-6 lg:py-12">
                {/* Título "Gerar roteiro" - aparece quando há seleção */}
                {selectedRoteiroKeys.length > 0 && (
                  <button 
                    className="mb-8 text-2xl font-serif hover:underline cursor-pointer text-foreground"
                    onClick={() => setShowTipoRoteiroDialog(true)}
                  >
                    Gerar roteiro
                  </button>
                )}
                
                {Array.from({ length: guiaAtivaConfig.quantidade }, (_, i) => i + 1).map((ordem) => {
                  const key = `${guiaAtiva}-${ordem}`;
                  const roteiro = roteirosLocais.get(key) || { headline: "", estrutura: "" };
                  const isSaving = savingKeys.has(key);
                  const isSaved = savedKeys.has(key);

                  return (
                    <div
                      key={key}
                      className="group relative mb-8"
                    >
                      {/* Floating toolbar - mobile: always visible, horizontal; desktop: hover, vertical */}
                      <div className="absolute -right-2 sm:-right-14 top-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex flex-row sm:flex-col gap-1 bg-background/90 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none rounded-lg sm:rounded-none p-1 sm:p-0 shadow-md sm:shadow-none border sm:border-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-7 sm:w-7"
                          onClick={() => handleCopyRoteiro(guiaAtiva, ordem)}
                          title="Copiar roteiro"
                        >
                          <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-7 sm:w-7 text-destructive hover:text-destructive"
                          onClick={() => handleClearRoteiro(guiaAtiva, ordem)}
                          title="Limpar roteiro"
                        >
                          <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <TTSConfigPopover
                          rate={rate}
                          pitch={pitch}
                          onRateChange={setRate}
                          onPitchChange={setPitch}
                          voices={voices}
                          selectedVoice={selectedVoice}
                          onVoiceChange={setSelectedVoice}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-7 sm:w-7"
                          title={isSpeaking && speakingKeyRef.current === key ? "Parar leitura" : "Ler estrutura"}
                          onClick={() => {
                            if (isSpeaking && speakingKeyRef.current === key) {
                              stop();
                              speakingKeyRef.current = null;
                            } else {
                              const cursorPos = cursorPositionRef.current.get(key) || 0;
                              const textToSpeak = roteiro.estrutura?.substring(cursorPos) || roteiro.estrutura || "";
                              if (textToSpeak.trim()) {
                                speakingKeyRef.current = key;
                                speak(textToSpeak);
                              } else {
                                toast({
                                  title: "Sem texto",
                                  description: "Não há texto para ler.",
                                });
                              }
                            }
                          }}
                        >
                          {isSpeaking && speakingKeyRef.current === key ? (
                            <Square className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                          ) : (
                            <Volume2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-7 sm:w-7"
                          title="Gravar com teleprompter"
                          onClick={() => {
                            const textoCompleto = [
                              roteiro.headline ? `📌 HEADLINE:\n${roteiro.headline}` : "",
                              roteiro.estrutura ? `\n\n📝 ESTRUTURA:\n${roteiro.estrutura}` : ""
                            ].filter(Boolean).join("");
                            setTeleprompterText(textoCompleto || "Nenhum texto disponível");
                            setShowTeleprompter(true);
                          }}
                        >
                          <Video className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </div>

                      {/* Status indicators */}
                      {(isSaving || isSaved) && (
                        <div className="absolute -left-14 top-0 text-xs">
                          {isSaving && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                            </span>
                          )}
                          {isSaved && (
                            <span className="text-green-500 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      )}

                      {/* Headline */}
                      <div className="mb-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedRoteiroKeys.includes(key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRoteiroKeys(prev => [...prev, key]);
                              } else {
                                setSelectedRoteiroKeys(prev => prev.filter(k => k !== key));
                              }
                            }}
                            className="h-5 w-5"
                          />
                          <span className="font-poppins font-bold text-[#B8860B] text-base">
                            HEADLINE {String(ordem).padStart(2, "0")}:
                          </span>
                        </div>
                        <InlineSpellCheckEditor
                          value={roteiro.headline}
                          onChange={(value, cursorPos) => {
                            handleInputChange2(guiaAtiva, ordem, "headline", value, cursorPos);
                          }}
                          onKeyDown={(e) => handleInputKeyDown(e, guiaAtiva, ordem, "headline")}
                          onBlur={() => handleFieldBlur(guiaAtiva, ordem, "headline")}
                          placeholder="Digite a headline... (use / para comandos)"
                          className="text-[15px] min-h-[28px] mt-1"
                          errors={getErrorsForField(guiaAtiva, ordem, "headline")}
                          showErrors={showInlineErrors}
                          onFixError={(error) => handleInlineFixError(guiaAtiva, ordem, "headline", error)}
                          onIgnoreError={handleIgnoreError}
                        />
                      </div>

                      {/* Estrutura */}
                      <div className="mb-4">
                        <span className="font-poppins font-bold text-[#B8860B] text-base">
                          ESTRUTURA {String(ordem).padStart(2, "0")}:
                        </span>
                        <InlineSpellCheckEditor
                          value={roteiro.estrutura}
                          onChange={(value, cursorPos) => {
                            handleInputChange2(guiaAtiva, ordem, "estrutura", value, cursorPos);
                          }}
                          onKeyDown={(e) => handleInputKeyDown(e, guiaAtiva, ordem, "estrutura")}
                          onBlur={() => handleFieldBlur(guiaAtiva, ordem, "estrutura")}
                          onSelect={(e) => {
                            const target = e.currentTarget;
                            cursorPositionRef.current.set(key, target.selectionStart || 0);
                          }}
                          placeholder="Digite a estrutura do roteiro... (use / para comandos)"
                          className="text-[14px] min-h-[60px] mt-1"
                          errors={getErrorsForField(guiaAtiva, ordem, "estrutura")}
                          showErrors={showInlineErrors}
                          onFixError={(error) => handleInlineFixError(guiaAtiva, ordem, "estrutura", error)}
                          onIgnoreError={handleIgnoreError}
                        />
                        <div className="text-right text-xs text-muted-foreground mt-1">
                          {roteiro.estrutura?.length || 0} caracteres
                        </div>
                      </div>

                      {/* Separator line */}
                      {ordem < guiaAtivaConfig.quantidade && (
                        <hr className="border-t border-border/50 mt-6" />
                      )}
                    </div>
                  );
                })}
                
                {/* Botão para adicionar mais roteiros */}
                <div className="flex justify-center pt-8 pb-4">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleAddRoteiro}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar roteiro
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        {/* Checklist fixo à direita - escondido em telas pequenas */}
        <div className="shrink-0 border-l bg-muted/30 overflow-y-auto py-4 pl-4 pr-6 hidden lg:block w-80 mr-4">
          <RoteiroChecklist 
            mentoradoId={mentoradoId} 
            guiaNumero={guiaAtiva}
            timers={timers}
            onTimersChange={setTimers}
            activeTimerId={activeTimerId}
            onActiveTimerChange={setActiveTimerId}
            timersLoaded={timersLoaded}
            onComplete={(t) => {
              setFeedbackTimers(t);
              setShowFeedbackDialog(true);
            }}
            onRevisarPlay={() => setShowRevisaoDialog(true)}
          />
        </div>
      </div>
      
      {/* Botão flutuante para abrir checklist em telas pequenas */}
      <Button
        className="lg:hidden fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setShowChecklistMobile(true)}
      >
        <CheckSquare className="h-6 w-6" />
      </Button>
      
      {/* Sheet do Checklist para mobile */}
      <Sheet open={showChecklistMobile} onOpenChange={setShowChecklistMobile}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Checklist - Guia {guiaAtiva}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <RoteiroChecklist 
              mentoradoId={mentoradoId} 
              guiaNumero={guiaAtiva}
              timers={timers}
              onTimersChange={setTimers}
              activeTimerId={activeTimerId}
              onActiveTimerChange={setActiveTimerId}
              timersLoaded={timersLoaded}
              onComplete={(t) => {
                setFeedbackTimers(t);
                setShowFeedbackDialog(true);
              }}
              onRevisarPlay={() => setShowRevisaoDialog(true)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Slash Command Popover */}
      <SlashCommandPopover
        isOpen={slashCommand.isOpen}
        mode={slashCommand.mode}
        onClose={() => setSlashCommand(prev => ({ ...prev, isOpen: false }))}
        onSelectItem={handleSlashSelectItem}
        position={slashCommand.position}
        avatarCategories={avatarCategories}
        onAddAvatarItem={handleAddAvatarItem}
        onEditAvatarItem={handleEditAvatarItem}
        onDeleteAvatarItem={handleDeleteAvatarItem}
      />

      {/* Modal de Headlines Aleatórias (/3) */}
      <HeadlinesRandomDialog
        open={showHeadlinesModal}
        onClose={() => setShowHeadlinesModal(false)}
        savedHeadlines={savedHeadlines}
        onSaveHeadlines={setSavedHeadlines}
        onSelectMultiple={(headlines) => {
          // Encontrar roteiros vazios na guia atual para preencher
          const guiaConfig = guias.find(g => g.numero === guiaAtiva);
          if (!guiaConfig) return;
          
          const roteirosVazios: { guia: number; ordem: number }[] = [];
          for (let ordem = 1; ordem <= guiaConfig.quantidade; ordem++) {
            const key = `${guiaAtiva}-${ordem}`;
            const roteiro = roteirosLocais.get(key);
            if (!roteiro?.headline?.trim()) {
              roteirosVazios.push({ guia: guiaAtiva, ordem });
            }
          }
          
          // Preencher roteiros vazios em sequência
          headlines.forEach((headline, index) => {
            if (index < roteirosVazios.length) {
              handleChange(roteirosVazios[index].guia, roteirosVazios[index].ordem, "headline", headline);
            }
          });
          
          setShowHeadlinesModal(false);
          
          toast({
            title: "Headlines inseridas!",
            description: `${Math.min(headlines.length, roteirosVazios.length)} headlines adicionadas aos roteiros vazios.`,
          });
        }}
      />

      {/* Teleprompter Dialog */}
      <TeleprompterDialog
        open={showTeleprompter}
        onOpenChange={setShowTeleprompter}
        text={teleprompterText}
        onTextChange={setTeleprompterText}
      />

      {/* Dialog para nova guia */}
      <Dialog open={showNewGuiaDialog} onOpenChange={setShowNewGuiaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins">Quantos roteiros na nova guia?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              size="lg"
              className="h-20 text-xl font-bold flex-col gap-1"
              onClick={() => handleCreateGuia(15)}
            >
              <span>15</span>
              <span className="text-xs font-normal text-muted-foreground">roteiros</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-20 text-xl font-bold flex-col gap-1"
              onClick={() => handleCreateGuia(25)}
            >
              <span>25</span>
              <span className="text-xs font-normal text-muted-foreground">roteiros</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-20 text-xl font-bold flex-col gap-1"
              onClick={() => handleCreateGuia(30)}
            >
              <span>30</span>
              <span className="text-xs font-normal text-muted-foreground">roteiros</span>
            </Button>
          </div>
          
          {/* Seção Personalizado */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3 text-center font-medium">Personalizado</p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="Quantidade"
                value={quantidadePersonalizada}
                onChange={(e) => setQuantidadePersonalizada(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  const qtd = parseInt(quantidadePersonalizada);
                  if (qtd > 0 && qtd <= 100) {
                    handleCreateGuia(qtd);
                  }
                }}
                disabled={!quantidadePersonalizada || parseInt(quantidadePersonalizada) < 1 || parseInt(quantidadePersonalizada) > 100}
              >
                Criar
              </Button>
            </div>
          </div>
          
          {/* Seção Overdelivery - só aparece se não existe guia overdelivery */}
          {!guias.some(g => g.isOverdelivery) && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3 text-center font-medium">Especial</p>
              <Button
                variant="outline"
                className="w-full h-16 flex-col gap-1"
                onClick={handleCreateOverdeliveryGuia}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span className="font-bold">Overdelivery</span>
                </div>
                <span className="text-xs text-muted-foreground">Blocos expansíveis com headlines e estruturas</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para primeira guia */}
      <Dialog open={showFirstGuiaDialog && !isLoading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-poppins text-center">
              Quantos roteiros na primeira guia?
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              size="lg"
              className="h-20 text-xl font-bold flex-col gap-1 hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleCreateFirstGuia(15)}
            >
              <span>15</span>
              <span className="text-xs font-normal opacity-70">roteiros</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-20 text-xl font-bold flex-col gap-1 hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleCreateFirstGuia(25)}
            >
              <span>25</span>
              <span className="text-xs font-normal opacity-70">roteiros</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-20 text-xl font-bold flex-col gap-1 hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleCreateFirstGuia(30)}
            >
              <span>30</span>
              <span className="text-xs font-normal opacity-70">roteiros</span>
            </Button>
          </div>
          
          {/* Seção Personalizado */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3 text-center font-medium">Personalizado</p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="Quantidade"
                value={quantidadePersonalizada}
                onChange={(e) => setQuantidadePersonalizada(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  const qtd = parseInt(quantidadePersonalizada);
                  if (qtd > 0 && qtd <= 100) {
                    handleCreateFirstGuia(qtd);
                  }
                }}
                disabled={!quantidadePersonalizada || parseInt(quantidadePersonalizada) < 1 || parseInt(quantidadePersonalizada) > 100}
              >
                Criar
              </Button>
            </div>
          </div>
          
          {/* Seção Overdelivery */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3 text-center font-medium">Especial</p>
            <Button
              variant="outline"
              className="w-full h-16 flex-col gap-1"
              onClick={() => handleCreateFirstGuia(0, true)}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="font-bold">Overdelivery</span>
              </div>
              <span className="text-xs text-muted-foreground">Blocos expansíveis com headlines e estruturas</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Find and Replace Dialog */}
      <FindReplaceDialog
        open={showFindReplace}
        onClose={() => {
          setShowFindReplace(false);
          setHighlightedMatch(null);
        }}
        roteirosLocais={roteirosLocais}
        guias={guias}
        onReplace={(guiaNumero, ordem, field, newValue) => {
          handleChange(guiaNumero, ordem, field, newValue);
        }}
        onHighlightMatch={(match) => {
          if (match) {
            setHighlightedMatch(match);
            setGuiaAtiva(match.guiaNumero);
          } else {
            setHighlightedMatch(null);
          }
        }}
      />

      {/* Spell Checker Panel */}
      <SpellCheckerPanel
        open={showSpellChecker}
        onClose={() => {
          setShowSpellChecker(false);
        }}
        roteirosLocais={roteirosLocais}
        guias={guias}
        guiaAtiva={guiaAtiva}
        onFix={(guiaNumero, ordem, field, newValue) => {
          handleChange(guiaNumero, ordem, field, newValue);
        }}
        onErrorsChange={(errors) => {
          setSpellErrors(errors);
          if (errors.length > 0) {
            setShowInlineErrors(true);
          }
        }}
        showInlineErrors={showInlineErrors}
        onToggleInlineErrors={() => setShowInlineErrors(prev => !prev)}
      />

      {/* Alert Dialog para confirmar deleção de guia */}
      <AlertDialog open={guiaToDelete !== null} onOpenChange={(open) => !open && setGuiaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar Guia {guiaToDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os roteiros desta guia serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => guiaToDelete && handleDeleteGuia(guiaToDelete)}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Dialog após completar checklist */}
      <RoteiroFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        mentoradoId={mentoradoId}
        mentoradoNome={mentoradoNome}
        guiaNumero={guiaAtiva}
        timers={feedbackTimers}
      />

      {/* Alerta de Timer Inativo - Centralizado */}
      {showTimerAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-amber-500 text-white px-10 py-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 pointer-events-auto max-w-lg text-center">
            <p className="text-2xl font-bold mb-3">⏰ Atenção!</p>
            <p className="text-xl">
              Você já começou a criar, lembre de ativar o cronômetro!!
            </p>
            <Button 
              variant="secondary" 
              size="lg"
              className="mt-6 text-lg font-semibold"
              onClick={() => setShowTimerAlert(false)}
            >
              Entendi
            </Button>
          </div>
        </div>
      )}

      {/* Botão flutuante para gerar roteiro quando há roteiros selecionados */}
      {selectedRoteiroKeys.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
          <Button 
            className="gap-2 shadow-lg"
            onClick={() => setShowTipoRoteiroDialog(true)}
          >
            <FileEdit className="h-4 w-4" />
            Gerar roteiro ({selectedRoteiroKeys.length})
          </Button>
        </div>
      )}

      {/* Dialog para seleção de tipo de roteiro */}
      <TipoRoteiroDialog
        open={showTipoRoteiroDialog}
        onOpenChange={setShowTipoRoteiroDialog}
        headlines={selectedRoteiroKeys.map(key => {
          const roteiro = roteirosLocais.get(key);
          return {
            key,
            headline: roteiro?.headline || "",
            estrutura: roteiro?.estrutura || "",
          };
        })}
        mentoradoData={{
          nome: mentoradoNome,
          informacoes_mentorado: currentMentorado?.informacoes_mentorado || null,
          apresentacao: currentMentorado?.apresentacao || null,
        }}
        onStartBulkGeneration={processBulkGeneration}
      />

      {/* Painel de progresso lateral para geração em massa */}
      {bulkProgress && (
        <BulkProgressPanel
          progress={bulkProgress}
          headlines={bulkHeadlines}
          onClose={() => {
            setBulkProgress(null);
            setBulkHeadlines([]);
          }}
        />
      )}

      {/* Dialog de Revisão com IA */}
      <RoteiroRevisaoDialog
        open={showRevisaoDialog}
        onOpenChange={setShowRevisaoDialog}
        roteiros={(() => {
          // Filtrar roteiros da guia ativa que têm estrutura preenchida
          const guiaConfig = guias.find(g => g.numero === guiaAtiva);
          if (!guiaConfig || guiaConfig.isOverdelivery) return [];
          
          const roteirosParaRevisar: Array<{ key: string; headline: string; estrutura: string }> = [];
          
          for (let ordem = 1; ordem <= guiaConfig.quantidade; ordem++) {
            const key = `${guiaAtiva}-${ordem}`;
            const roteiro = roteirosLocais.get(key);
            // Incluir apenas roteiros que têm estrutura preenchida
            if (roteiro?.estrutura?.trim()) {
              roteirosParaRevisar.push({
                key,
                headline: roteiro.headline || "",
                estrutura: roteiro.estrutura,
              });
            }
          }
          
          return roteirosParaRevisar;
        })()}
        onRoteiroChange={(key, field, value) => {
          // Atualizar estado local
          setRoteirosLocais(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(key);
            if (existing) {
              newMap.set(key, { ...existing, [field]: value });
            }
            return newMap;
          });
          
          // Salvar no banco
          const [guiaNumero, ordem] = key.split("-").map(Number);
          const existing = roteirosLocais.get(key);
          upsertRoteiro.mutate({
            mentoradoId: mentoradoId,
            guiaNumero: guiaNumero,
            ordem: ordem,
            headline: field === "headline" ? value : (existing?.headline || ""),
            estrutura: field === "estrutura" ? value : (existing?.estrutura || ""),
          });
        }}
        mentoradoNome={mentoradoNome}
        inteligenciaGlobal={inteligenciaGlobal?.conteudo}
        inteligenciaMentorado={currentMentorado?.inteligencia_ia || undefined}
      />
    </div>
  );
};
