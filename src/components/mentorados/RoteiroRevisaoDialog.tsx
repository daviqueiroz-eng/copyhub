import { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Send, 
  Bot, 
  User,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
}

export const RoteiroRevisaoDialog = ({
  open,
  onOpenChange,
  roteiros,
  onRoteiroChange,
  mentoradoNome,
}: RoteiroRevisaoDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messagesPerRoteiro, setMessagesPerRoteiro] = useState<Map<string, Message[]>>(new Map());
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado local para edição direta (sincronizado com prop)
  const [localHeadline, setLocalHeadline] = useState("");
  const [localEstrutura, setLocalEstrutura] = useState("");
  
  // Debounce para salvar alterações diretas
  const directEditTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentRoteiro = roteiros[currentIndex];
  const currentKey = currentRoteiro?.key || "";
  const currentMessages = messagesPerRoteiro.get(currentKey) || [];

  // Sincronizar estado local com roteiro atual quando mudar de índice
  useEffect(() => {
    if (currentRoteiro) {
      setLocalHeadline(currentRoteiro.headline);
      setLocalEstrutura(currentRoteiro.estrutura);
    }
  }, [currentIndex, currentRoteiro?.headline, currentRoteiro?.estrutura]);

  // Handler para edição direta com debounce
  const handleDirectEdit = useCallback((field: "headline" | "estrutura", value: string) => {
    if (field === "headline") {
      setLocalHeadline(value);
    } else {
      setLocalEstrutura(value);
    }
    
    // Debounce para salvar
    if (directEditTimeoutRef.current) {
      clearTimeout(directEditTimeoutRef.current);
    }
    
    directEditTimeoutRef.current = setTimeout(() => {
      onRoteiroChange(currentKey, field, value);
    }, 1000);
  }, [currentKey, onRoteiroChange]);

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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, currentIndex]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setCurrentIndex(0);
      setInputMessage("");
    }
  }, [open]);

  // Navegação por teclado (apenas quando não está focado em textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      // Não capturar se estiver digitando em input ou textarea
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
  }, [open, currentIndex, roteiros.length, inputMessage, onOpenChange]);

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
        },
      });

      if (error) throw error;

      // Atualizar roteiro se houve mudança
      if (data.changed) {
        if (data.headlineChanged) {
          setLocalHeadline(data.headline);
          onRoteiroChange(currentKey, "headline", data.headline);
        }
        if (data.estruturaChanged) {
          setLocalEstrutura(data.estrutura);
          onRoteiroChange(currentKey, "estrutura", data.estrutura);
        }
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
  }, [inputMessage, isLoading, currentRoteiro, currentKey, currentMessages, onRoteiroChange, localHeadline, localEstrutura]);

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
          
          <div className="flex items-center gap-1">
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
              value={localHeadline}
              onChange={(e) => handleDirectEdit("headline", e.target.value)}
              placeholder="Digite a headline..."
              className="border-0 rounded-none resize-none min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
              <h3 className="font-semibold text-sm" style={{ color: "#B8860B" }}>
                ESTRUTURA {String(ordem).padStart(2, "0")}:
              </h3>
            </div>
            <Textarea
              value={localEstrutura}
              onChange={(e) => handleDirectEdit("estrutura", e.target.value)}
              placeholder="Digite a estrutura do roteiro..."
              className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Lado direito - Chat */}
          <div className="flex-1 flex flex-col lg:w-[400px] lg:max-w-[400px] overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 border-b shrink-0">
              <h3 className="font-semibold text-sm">Chat de Revisão</h3>
            </div>
            
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
            <div className="px-4 py-3 border-t shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Digite sua instrução..."
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
              <p className="text-[10px] text-muted-foreground mt-1">
                Edite o texto diretamente ou use o chat • ← → para navegar
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};