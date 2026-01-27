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
} from "lucide-react";
import { useTiposAjuste } from "@/hooks/useTiposAjuste";
import { TiposAjusteDialog } from "./TiposAjusteDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AjusteMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AjusteFinoPanelProps {
  headline: string;
  estrutura: string;
  selecao: { text: string; field: "headline" | "estrutura" } | null;
  onUpdate: (headline: string, estrutura: string) => void;
  onClearSelection: () => void;
}

export const AjusteFinoPanel = ({
  headline,
  estrutura,
  selecao,
  onUpdate,
  onClearSelection,
}: AjusteFinoPanelProps) => {
  const { data: tiposAjuste = [], isLoading: loadingTipos } = useTiposAjuste();
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTiposDialog, setShowTiposDialog] = useState(false);
  const [messages, setMessages] = useState<AjusteMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ajustesPopoverOpen, setAjustesPopoverOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<string>("");

  // Mensagem de boas-vindas inicial
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Selecione um tipo de ajuste clicando no **+** ou digite sua instrução para refinar o roteiro.",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Ao clicar em um ajuste, colar as instruções no campo de texto
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

  const handleEnviar = async () => {
    const messageContent = inputValue.trim();
    if (!messageContent) {
      toast({
        title: "Digite uma instrução",
        variant: "destructive",
      });
      return;
    }

    // Guardar última mensagem do usuário
    lastUserMessageRef.current = messageContent;

    // Adicionar mensagem do usuário
    const userMessage: AjusteMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      const payload = {
        headline,
        estrutura,
        ajustes: [],
        instrucao_livre: messageContent,
        selecao: selecao
          ? {
              texto: selecao.text,
              campo: selecao.field,
            }
          : null,
      };

      const { data, error } = await supabase.functions.invoke("n8n-ajustes", {
        body: payload,
      });

      if (error) throw error;

      // O webhook pode retornar headline e estrutura atualizados
      if (data) {
        const newHeadline = data.headline || headline;
        const newEstrutura = data.estrutura || estrutura;

        // Adicionar resposta do assistente
        const assistantMessage: AjusteMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.message ||
            data.resposta ||
            (newEstrutura !== estrutura
              ? "Roteiro atualizado com sucesso!"
              : "Ajuste processado."),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (newHeadline !== headline || newEstrutura !== estrutura) {
          onUpdate(newHeadline, newEstrutura);
        }
      }

      onClearSelection();
    } catch (error) {
      console.error("Erro ao processar ajustes:", error);
      // Adicionar mensagem de erro como resposta do assistente
      const errorMessage: AjusteMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Erro ao processar o ajuste. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Erro ao processar ajustes",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessageContent = (content: string) => {
    // Suporte básico a markdown bold
    return content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Área de mensagens */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="space-y-4 max-w-full">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col",
                message.role === "user" ? "items-end" : "items-start"
              )}
            >
              {message.role === "user" ? (
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ) : (
                <div className="max-w-[95%] space-y-2">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {renderMessageContent(message.content)}
                    </p>
                  </div>
                  {/* Botões de ação apenas para mensagens do assistente (exceto welcome) */}
                  {message.id !== "welcome" && (
                    <div className="flex items-center gap-1 pl-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={handleRefresh}
                        title="Repetir última instrução"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isProcessing && (
            <div className="flex items-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Processando...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t shrink-0 bg-background p-4">
        {/* Indicador de seleção */}
        {selecao && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-accent/50 rounded-lg text-xs">
            <span className="text-muted-foreground">Seleção:</span>
            <span className="font-medium text-accent-foreground truncate max-w-[250px]">
              "{selecao.text}"
            </span>
          </div>
        )}

        {/* Textarea - largura total */}
        <div className="bg-muted/30 rounded-xl border mb-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Responder..."
            disabled={isProcessing}
            className="min-h-[60px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleEnviar();
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
                  className="h-8 w-8 rounded-lg"
                  disabled={isProcessing}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-72 p-0"
                sideOffset={8}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-medium text-sm">Tipos de Ajuste</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setAjustesPopoverOpen(false);
                      setShowTiposDialog(true);
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="p-2 space-y-1">
                    {loadingTipos && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    )}
                    {tiposAjuste.map((tipo) => (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => handleAjusteClick(tipo.instrucoes)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="font-medium text-sm">{tipo.nome}</p>
                        {tipo.descricao && (
                          <p className="text-xs text-muted-foreground truncate">
                            {tipo.descricao}
                          </p>
                        )}
                      </button>
                    ))}
                    {!loadingTipos && tiposAjuste.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">
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
              className="h-8 w-8 rounded-lg text-muted-foreground"
              title="Histórico"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>

          {/* Direita: modelo e enviar */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground gap-1"
            >
              Ajuste Fino
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleEnviar}
              disabled={isProcessing || !inputValue.trim()}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          IA pode cometer erros. Verifique as respostas.
        </p>
      </div>

      {/* Dialog de gerenciamento */}
      <TiposAjusteDialog
        open={showTiposDialog}
        onOpenChange={setShowTiposDialog}
      />
    </div>
  );
};
