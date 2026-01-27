import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Send, 
  Bot, 
  User,
  Loader2,
  Undo2,
  Redo2,
  ChevronDown,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AjusteFinoPanel } from "./AjusteFinoPanel";
import { TiposChatDialog } from "./TiposChatDialog";
import { useTiposChatRevisao, TipoChatRevisao } from "@/hooks/useTiposChatRevisao";

interface HistoryEntry {
  headline: string;
  estrutura: string;
  timestamp: Date;
  source: "manual" | "ai" | "initial";
}

interface RoteiroParaRevisao {
  key: string;
  headline: string;
  estrutura: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface RoteiroRevisaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roteiros: RoteiroParaRevisao[];
  onRoteiroChange: (key: string, field: "headline" | "estrutura", value: string) => void;
  mentoradoNome: string;
  inteligenciaGlobal?: string;
  inteligenciaMentorado?: string;
  initialIndex?: number;
}

export const RoteiroRevisaoDialog = ({
  open,
  onOpenChange,
  roteiros,
  onRoteiroChange,
  mentoradoNome,
  initialIndex = 0,
}: RoteiroRevisaoDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [messagesPerRoteiro, setMessagesPerRoteiro] = useState<Map<string, Message[]>>(new Map());
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "ajuste">("chat");
  
  // Estado para tipo de chat selecionado
  const [selectedTipoChatId, setSelectedTipoChatId] = useState<string | null>(null);
  const [showTiposChatDialog, setShowTiposChatDialog] = useState(false);
  const { data: tiposChat = [] } = useTiposChatRevisao();
  const selectedTipoChat = tiposChat.find(t => t.id === selectedTipoChatId) || null;
  
  // Estado local para edição direta (sincronizado com prop)
  const [localHeadline, setLocalHeadline] = useState("");
  const [localEstrutura, setLocalEstrutura] = useState("");
  
  // Estado para seleção de texto vinculada ao chat
  const [selectedText, setSelectedText] = useState<{
    text: string;
    field: "headline" | "estrutura";
  } | null>(null);
  
  // Histórico de alterações por roteiro (Undo/Redo)
  const [historyPerRoteiro, setHistoryPerRoteiro] = useState<Map<string, {
    entries: HistoryEntry[];
    currentIndex: number;
  }>>(new Map());
  
  // Debounce para salvar alterações diretas
  const directEditTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para evitar salvar histórico durante undo/redo
  const isUndoRedoRef = useRef(false);
  // Ref para rastrear se houve edição desde o último save no histórico
  const hasEditedRef = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const estruturaRef = useRef<HTMLTextAreaElement>(null);
  
  const currentRoteiro = roteiros[currentIndex];
  const currentKey = currentRoteiro?.key || "";
  const currentMessages = messagesPerRoteiro.get(currentKey) || [];
  
  // Histórico do roteiro atual
  const currentHistory = historyPerRoteiro.get(currentKey);
  const canUndo = currentHistory ? currentHistory.currentIndex > 0 : false;
  const canRedo = currentHistory ? currentHistory.currentIndex < currentHistory.entries.length - 1 : false;
  const undoCount = currentHistory ? currentHistory.currentIndex : 0;
  const redoCount = currentHistory ? currentHistory.entries.length - 1 - currentHistory.currentIndex : 0;

  // Salvar snapshot no histórico
  const saveToHistory = useCallback((source: "manual" | "ai" | "initial", headline: string, estrutura: string) => {
    if (isUndoRedoRef.current) return;
    
    setHistoryPerRoteiro(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(currentKey) || { entries: [], currentIndex: -1 };
      
      // Verificar se o conteúdo é diferente do último
      const lastEntry = current.entries[current.currentIndex];
      if (lastEntry && lastEntry.headline === headline && lastEntry.estrutura === estrutura) {
        return prev; // Não salvar duplicatas
      }
      
      // Remover entradas futuras se estamos no meio do histórico
      const newEntries = current.entries.slice(0, current.currentIndex + 1);
      
      // Adicionar nova entrada
      newEntries.push({
        headline,
        estrutura,
        timestamp: new Date(),
        source,
      });
      
      // Limitar a 50 entradas
      if (newEntries.length > 50) newEntries.shift();
      
      newMap.set(currentKey, {
        entries: newEntries,
        currentIndex: newEntries.length - 1,
      });
      
      return newMap;
    });
    
    hasEditedRef.current = false;
  }, [currentKey]);

  // Desfazer (Undo)
  const handleUndo = useCallback(() => {
    const history = historyPerRoteiro.get(currentKey);
    if (!history || history.currentIndex <= 0) return;
    
    isUndoRedoRef.current = true;
    
    const newIndex = history.currentIndex - 1;
    const entry = history.entries[newIndex];
    
    setLocalHeadline(entry.headline);
    setLocalEstrutura(entry.estrutura);
    onRoteiroChange(currentKey, "headline", entry.headline);
    onRoteiroChange(currentKey, "estrutura", entry.estrutura);
    
    setHistoryPerRoteiro(prev => {
      const newMap = new Map(prev);
      newMap.set(currentKey, { ...history, currentIndex: newIndex });
      return newMap;
    });
    
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 100);
  }, [currentKey, historyPerRoteiro, onRoteiroChange]);

  // Refazer (Redo)
  const handleRedo = useCallback(() => {
    const history = historyPerRoteiro.get(currentKey);
    if (!history || history.currentIndex >= history.entries.length - 1) return;
    
    isUndoRedoRef.current = true;
    
    const newIndex = history.currentIndex + 1;
    const entry = history.entries[newIndex];
    
    setLocalHeadline(entry.headline);
    setLocalEstrutura(entry.estrutura);
    onRoteiroChange(currentKey, "headline", entry.headline);
    onRoteiroChange(currentKey, "estrutura", entry.estrutura);
    
    setHistoryPerRoteiro(prev => {
      const newMap = new Map(prev);
      newMap.set(currentKey, { ...history, currentIndex: newIndex });
      return newMap;
    });
    
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 100);
  }, [currentKey, historyPerRoteiro, onRoteiroChange]);

  // Sincronizar estado local com roteiro atual quando mudar de índice
  useEffect(() => {
    if (currentRoteiro) {
      setLocalHeadline(currentRoteiro.headline);
      setLocalEstrutura(currentRoteiro.estrutura);
      
      // Salvar estado inicial no histórico se for a primeira vez
      if (!historyPerRoteiro.has(currentKey)) {
        saveToHistory("initial", currentRoteiro.headline, currentRoteiro.estrutura);
      }
    }
  }, [currentIndex, currentRoteiro?.headline, currentRoteiro?.estrutura, currentKey, historyPerRoteiro, saveToHistory]);

  // Handler para edição direta com debounce
  const handleDirectEdit = useCallback((field: "headline" | "estrutura", value: string) => {
    if (field === "headline") {
      setLocalHeadline(value);
    } else {
      setLocalEstrutura(value);
    }
    
    hasEditedRef.current = true;
    
    // Debounce para salvar
    if (directEditTimeoutRef.current) {
      clearTimeout(directEditTimeoutRef.current);
    }
    
    directEditTimeoutRef.current = setTimeout(() => {
      onRoteiroChange(currentKey, field, value);
    }, 1000);
  }, [currentKey, onRoteiroChange]);
  
  // Salvar no histórico ao sair do campo (blur)
  const handleFieldBlur = useCallback(() => {
    if (hasEditedRef.current && !isUndoRedoRef.current) {
      saveToHistory("manual", localHeadline, localEstrutura);
    }
  }, [saveToHistory, localHeadline, localEstrutura]);

  // Capturar seleção de texto
  const handleTextSelection = useCallback((field: "headline" | "estrutura") => {
    const textarea = field === "headline" ? headlineRef.current : estruturaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedValue = textarea.value.substring(start, end).trim();
      if (selectedValue) {
        setSelectedText({ text: selectedValue, field });
        inputRef.current?.focus();
      }
    }
  }, []);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (directEditTimeoutRef.current) {
        clearTimeout(directEditTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Focar no input quando abrir ou mudar de roteiro
  useEffect(() => {
    if (open && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, currentIndex, activeTab]);

  // Limpar seleção ao mudar de roteiro
  useEffect(() => {
    setSelectedText(null);
  }, [currentIndex]);

  // Reset ao fechar ou definir índice inicial ao abrir
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    } else {
      setInputMessage("");
      setSelectedText(null);
    }
  }, [open, initialIndex]);

  // Navegação por teclado (apenas quando não está focado em textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      // Atalhos Undo/Redo (funcionam em qualquer lugar exceto input do chat)
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        const target = e.target as HTMLElement;
        // Permitir undo/redo nativo apenas no input do chat
        if (target === inputRef.current) return;
        
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      
      // Não capturar navegação se estiver digitando em input ou textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Enter" && !e.shiftKey && target === inputRef.current && inputMessage.trim()) {
          e.preventDefault();
          handleSendMessage();
        }
        return;
      }
      
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === "ArrowRight" && currentIndex < roteiros.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, roteiros.length, inputMessage, onOpenChange, handleUndo, handleRedo]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || !currentRoteiro) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Adicionar mensagem do usuário
    setMessagesPerRoteiro(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentKey) || [];
      newMap.set(currentKey, [...existing, userMessage]);
      return newMap;
    });

    setInputMessage("");
    setIsLoading(true);

    try {
      // Preparar histórico para a API
      const historico = currentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke("revisar-roteiro", {
        body: {
          headline: localHeadline,
          estrutura: localEstrutura,
          mensagem: userMessage.content,
          historico,
          selecao: selectedText ? {
            texto: selectedText.text,
            campo: selectedText.field,
          } : null,
          promptSistema: selectedTipoChat?.prompt_sistema || null,
        },
      });

      // Limpar seleção após enviar
      setSelectedText(null);

      if (error) throw error;

      // Atualizar roteiro se houve mudança
      if (data.changed) {
        const newHeadline = data.headlineChanged ? data.headline : localHeadline;
        const newEstrutura = data.estruturaChanged ? data.estrutura : localEstrutura;
        
        if (data.headlineChanged) {
          setLocalHeadline(data.headline);
          onRoteiroChange(currentKey, "headline", data.headline);
        }
        if (data.estruturaChanged) {
          setLocalEstrutura(data.estrutura);
          onRoteiroChange(currentKey, "estrutura", data.estrutura);
        }
        
        // Salvar no histórico após alteração da IA
        saveToHistory("ai", newHeadline, newEstrutura);
      }

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.explanation || "Alteração realizada.",
        timestamp: new Date(),
      };

      setMessagesPerRoteiro(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(currentKey) || [];
        // Incluir a mensagem do usuário que acabamos de adicionar
        newMap.set(currentKey, [...existing, userMessage, assistantMessage]);
        return newMap;
      });
    } catch (error) {
      console.error("Erro ao revisar roteiro:", error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
      
      // Remover mensagem do usuário em caso de erro
      setMessagesPerRoteiro(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(currentKey) || [];
        newMap.set(currentKey, existing.filter(m => m.id !== userMessage.id));
        return newMap;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [inputMessage, isLoading, currentRoteiro, currentKey, currentMessages, onRoteiroChange, localHeadline, localEstrutura, selectedText, saveToHistory]);

  // Handler para atualização vinda do AjusteFinoPanel
  const handleAjusteUpdate = useCallback((newHeadline: string, newEstrutura: string) => {
    setLocalHeadline(newHeadline);
    setLocalEstrutura(newEstrutura);
    onRoteiroChange(currentKey, "headline", newHeadline);
    onRoteiroChange(currentKey, "estrutura", newEstrutura);
    saveToHistory("ai", newHeadline, newEstrutura);
  }, [currentKey, onRoteiroChange, saveToHistory]);

  // Adicionar mensagem inicial de boas-vindas se for a primeira vez
  useEffect(() => {
    if (!currentKey || messagesPerRoteiro.has(currentKey)) return;
    
    const welcomeMessage: Message = {
      id: `welcome-${currentKey}`,
      role: "assistant",
      content: "Em que posso ajudar na revisão deste roteiro? Você pode editar diretamente o texto à esquerda ou pedir alterações específicas aqui:\n\n• \"Troca 'demais' por 'muito bom'\"\n• \"Remove a última frase\"\n• \"Adiciona um CTA no final\"\n• \"Deixa mais curto\"",
      timestamp: new Date(),
    };

    setMessagesPerRoteiro(prev => {
      const newMap = new Map(prev);
      newMap.set(currentKey, [welcomeMessage]);
      return newMap;
    });
  }, [currentKey, messagesPerRoteiro]);

  if (!currentRoteiro) return null;

  const [guiaNum, ordem] = currentKey.split("-").map(Number);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[100dvh] p-0 flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="font-semibold">
              Roteiro {currentIndex + 1}/{roteiros.length}
            </span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              ({mentoradoNome} - Guia {guiaNum})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botões Undo/Redo */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={!canUndo}
                title={`Desfazer (Ctrl+Z)${undoCount > 0 ? ` - ${undoCount} alteração(ões)` : ''}`}
                className="h-8 w-8"
              >
                <Undo2 className="h-4 w-4" />
                {undoCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {undoCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={!canRedo}
                title={`Refazer (Ctrl+Shift+Z)${redoCount > 0 ? ` - ${redoCount} alteração(ões)` : ''}`}
                className="h-8 w-8"
              >
                <Redo2 className="h-4 w-4" />
                {redoCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {redoCount}
                  </span>
                )}
              </Button>
            </div>
            
            {/* Botões de navegação */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={currentIndex === roteiros.length - 1}
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Lado esquerdo - Roteiro editável */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
              <h3 className="font-semibold text-sm" style={{ color: "#B8860B" }}>
                HEADLINE {String(ordem).padStart(2, "0")}:
              </h3>
            </div>
            <Textarea
              ref={headlineRef}
              value={localHeadline}
              onChange={(e) => handleDirectEdit("headline", e.target.value)}
              onMouseUp={() => handleTextSelection("headline")}
              onSelect={() => handleTextSelection("headline")}
              onBlur={handleFieldBlur}
              placeholder="Digite a headline..."
              className="border-0 rounded-none resize-none min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
              <h3 className="font-semibold text-sm" style={{ color: "#B8860B" }}>
                ESTRUTURA {String(ordem).padStart(2, "0")}:
              </h3>
            </div>
            <Textarea
              ref={estruturaRef}
              value={localEstrutura}
              onChange={(e) => handleDirectEdit("estrutura", e.target.value)}
              onMouseUp={() => handleTextSelection("estrutura")}
              onSelect={() => handleTextSelection("estrutura")}
              onBlur={handleFieldBlur}
              placeholder="Digite a estrutura do roteiro..."
              className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Lado direito - Tabs: Chat / Ajuste Fino */}
          <div className="flex-1 flex flex-col lg:w-[400px] lg:max-w-[400px] overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "ajuste")} className="flex flex-col h-full">
              <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat de Revisão</TabsTrigger>
                  <TabsTrigger value="ajuste">Ajuste Fino</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="chat" className="flex-1 flex flex-col mt-0 overflow-hidden">
                {/* Mensagens */}
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-4">
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <span className="text-[10px] opacity-60 mt-1 block">
                            {message.timestamp.toLocaleTimeString("pt-BR", { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                        </div>
                        {message.role === "user" && (
                          <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-2 justify-start">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Processando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t shrink-0">
                  {/* Indicador de seleção */}
                  {selectedText && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 border-b text-xs">
                      <span className="text-muted-foreground">Seleção:</span>
                      <span className="font-medium text-accent-foreground truncate max-w-[200px]">
                        "{selectedText.text}"
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 shrink-0 ml-auto"
                        onClick={() => setSelectedText(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="px-4 py-3">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={selectedText ? `O que fazer com "${selectedText.text.substring(0, 20)}${selectedText.text.length > 20 ? '...' : ''}"?` : "Digite sua instrução..."}
                        disabled={isLoading}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Seletor de tipo de chat e dicas */}
                    <div className="flex items-center justify-between mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 gap-1">
                            <Settings2 className="h-3 w-3" />
                            {selectedTipoChat?.nome || "Padrão"}
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-2" align="start">
                          <div className="space-y-1">
                            <button
                              onClick={() => setSelectedTipoChatId(null)}
                              className={cn(
                                "w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                                !selectedTipoChatId && "bg-accent"
                              )}
                            >
                              <span className="font-medium">Padrão</span>
                              <span className="block text-xs text-muted-foreground">Faz apenas o que é pedido</span>
                            </button>
                            
                            {tiposChat.map(tipo => (
                              <button
                                key={tipo.id}
                                onClick={() => setSelectedTipoChatId(tipo.id)}
                                className={cn(
                                  "w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                                  selectedTipoChatId === tipo.id && "bg-accent"
                                )}
                              >
                                <span className="font-medium">{tipo.nome}</span>
                                {tipo.descricao && (
                                  <span className="block text-xs text-muted-foreground truncate">{tipo.descricao}</span>
                                )}
                              </button>
                            ))}
                            
                            <Separator className="my-1" />
                            
                            <button
                              onClick={() => setShowTiposChatDialog(true)}
                              className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
                            >
                              <Settings2 className="h-3 w-3 inline mr-1" />
                              Gerenciar tipos
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <p className="text-[10px] text-muted-foreground">
                        {selectedText 
                          ? "Alterar trecho selecionado"
                          : "← → navegar"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ajuste" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <AjusteFinoPanel
                  headline={localHeadline}
                  estrutura={localEstrutura}
                  selecao={selectedText}
                  onUpdate={handleAjusteUpdate}
                  onClearSelection={() => setSelectedText(null)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
      
      {/* Dialog para gerenciar tipos de chat */}
      <TiposChatDialog 
        open={showTiposChatDialog} 
        onOpenChange={setShowTiposChatDialog} 
      />
    </Sheet>
  );
};
