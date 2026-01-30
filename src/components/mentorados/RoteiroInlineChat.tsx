import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Send,
  Loader2,
  Plus,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTiposAjuste } from "@/hooks/useTiposAjuste";
import { useTiposChatRevisao } from "@/hooks/useTiposChatRevisao";
import { TiposAjusteDialog } from "./TiposAjusteDialog";
import { TiposChatDialog } from "./TiposChatDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface RoteiroInlineChatProps {
  roteiroKey: string;
  headline: string;
  estrutura: string;
  onUpdate: (headline: string, estrutura: string) => void;
}

export const RoteiroInlineChat = ({
  roteiroKey,
  headline,
  estrutura,
  onUpdate,
}: RoteiroInlineChatProps) => {
  const { data: tiposAjuste = [], isLoading: loadingTipos } = useTiposAjuste();
  const { data: tiposChat = [], isLoading: loadingTiposChat } = useTiposChatRevisao();
  
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ajustesPopoverOpen, setAjustesPopoverOpen] = useState(false);
  const [tiposChatPopoverOpen, setTiposChatPopoverOpen] = useState(false);
  const [showTiposDialog, setShowTiposDialog] = useState(false);
  const [showTiposChatDialog, setShowTiposChatDialog] = useState(false);
  const [selectedTipoChatId, setSelectedTipoChatId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<string>("");

  // Scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const selectedTipoChat = tiposChat.find(t => t.id === selectedTipoChatId);

  const handleAjusteClick = (instrucoes: string | null | undefined) => {
    if (!instrucoes) return;
    setInputValue((prev) => {
      if (prev.trim()) {
        return `${prev}\n\n${instrucoes}`;
      }
      return instrucoes;
    });
    setAjustesPopoverOpen(false);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = () => {
    if (lastUserMessageRef.current) {
      setInputValue(lastUserMessageRef.current);
    }
  };

  const handleSend = async () => {
    const messageContent = inputValue.trim();
    if (!messageContent) {
      toast({
        title: "Digite uma instrução",
        variant: "destructive",
      });
      return;
    }

    lastUserMessageRef.current = messageContent;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      // Construir histórico para contexto
      const historico = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const payload = {
        headline,
        estrutura,
        mensagem: messageContent,
        historico,
        selecao: null,
        promptSistema: selectedTipoChat?.prompt_sistema || null,
      };

      const { data, error } = await supabase.functions.invoke("revisar-roteiro", {
        body: payload,
      });

      if (error) throw error;

      if (data) {
        const newHeadline = data.headline || headline;
        const newEstrutura = data.estrutura || estrutura;

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.mensagem ||
            data.message ||
            (newEstrutura !== estrutura
              ? "Roteiro atualizado!"
              : "Ajuste processado."),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (newHeadline !== headline || newEstrutura !== estrutura) {
          onUpdate(newHeadline, newEstrutura);
        }
      }
    } catch (error) {
      console.error("Erro ao processar:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Erro ao processar. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Erro ao processar",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessageContent = (content: string) => {
    return content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Mostrar mensagens visíveis (últimas 2 se não expandido, todas se expandido)
  const visibleMessages = expanded ? messages : messages.slice(-2);

  return (
    <div className="mt-4 border rounded-xl bg-muted/20 overflow-hidden">
      {/* Área de mensagens (colapsável) */}
      {messages.length > 0 && (
        <div className="border-b">
          {messages.length > 2 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Ocultar mensagens anteriores
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Ver {messages.length - 2} mensagens anteriores
                </>
              )}
            </button>
          )}
          
          <ScrollArea className="max-h-[200px] px-3 py-2" ref={scrollRef}>
            <div className="space-y-3">
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {message.role === "user" ? (
                    <div className="max-w-[85%] bg-primary text-primary-foreground rounded-xl rounded-br-sm px-3 py-2">
                      <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[95%] space-y-1">
                      <div className="bg-background border rounded-xl rounded-bl-sm px-3 py-2">
                        <p className="text-xs whitespace-pre-wrap leading-relaxed">
                          {renderMessageContent(message.content)}
                        </p>
                      </div>
                      {/* Botões de ação */}
                      <div className="flex items-center gap-0.5 pl-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={handleRefresh}
                          title="Repetir última instrução"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isProcessing && (
                <div className="flex items-start">
                  <div className="bg-background border rounded-xl rounded-bl-sm px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Processando...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 bg-background">
        {/* Textarea */}
        <div className="bg-muted/30 rounded-lg border mb-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Responder..."
            disabled={isProcessing}
            className="min-h-[50px] max-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Linha de botões */}
        <div className="flex items-center justify-between">
          {/* Esquerda: + e clock */}
          <div className="flex items-center gap-1">
            <Popover open={ajustesPopoverOpen} onOpenChange={setAjustesPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  disabled={isProcessing}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-64 p-0"
                sideOffset={8}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-medium text-xs">Tipos de Ajuste</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setAjustesPopoverOpen(false);
                      setShowTiposDialog(true);
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                </div>
                <ScrollArea className="max-h-[150px]">
                  <div className="p-2 space-y-1">
                    {loadingTipos && (
                      <div className="text-center py-3 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                      </div>
                    )}
                    {tiposAjuste.map((tipo) => (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => handleAjusteClick(tipo.instrucoes)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="font-medium text-xs">{tipo.nome}</p>
                        {tipo.descricao && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {tipo.descricao}
                          </p>
                        )}
                      </button>
                    ))}
                    {!loadingTipos && tiposAjuste.length === 0 && (
                      <div className="text-center py-3">
                        <p className="text-[10px] text-muted-foreground">
                          Nenhum ajuste cadastrado
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground"
              title="Histórico"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Direita: tipo de chat e enviar */}
          <div className="flex items-center gap-2">
            <Popover open={tiposChatPopoverOpen} onOpenChange={setTiposChatPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground gap-1"
                >
                  {selectedTipoChat?.nome || "Padrão"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-56 p-0"
                sideOffset={8}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-medium text-xs">Tipo de Chat</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setTiposChatPopoverOpen(false);
                      setShowTiposChatDialog(true);
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                </div>
                <ScrollArea className="max-h-[150px]">
                  <div className="p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTipoChatId(null);
                        setTiposChatPopoverOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted transition-colors",
                        !selectedTipoChatId && "bg-muted"
                      )}
                    >
                      <p className="font-medium text-xs">Padrão</p>
                      <p className="text-[10px] text-muted-foreground">
                        Comportamento padrão do assistente
                      </p>
                    </button>
                    {loadingTiposChat && (
                      <div className="text-center py-3 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                      </div>
                    )}
                    {tiposChat.map((tipo) => (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => {
                          setSelectedTipoChatId(tipo.id);
                          setTiposChatPopoverOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted transition-colors",
                          selectedTipoChatId === tipo.id && "bg-muted"
                        )}
                      >
                        <p className="font-medium text-xs">{tipo.nome}</p>
                        {tipo.descricao && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {tipo.descricao}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
            <Button
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={handleSend}
              disabled={isProcessing || !inputValue.trim()}
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs de gerenciamento */}
      <TiposAjusteDialog
        open={showTiposDialog}
        onOpenChange={setShowTiposDialog}
      />
      <TiposChatDialog
        open={showTiposChatDialog}
        onOpenChange={setShowTiposChatDialog}
      />
    </div>
  );
};
