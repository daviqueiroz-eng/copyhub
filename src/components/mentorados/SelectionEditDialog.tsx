import { useState, useEffect } from "react";
import { Loader2, Plus, ChevronDown, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTiposAjuste, TipoAjuste } from "@/hooks/useTiposAjuste";
import { useTiposChatRevisao, TipoChatRevisao } from "@/hooks/useTiposChatRevisao";
import { TiposAjusteDialog } from "./TiposAjusteDialog";
import { TiposChatDialog } from "./TiposChatDialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Variante {
  trecho_substituto: string;
  resumo: string;
}

interface SelectionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  campo: "headline" | "estrutura";
  headline: string;
  estrutura: string;
  onUpdate: (headline: string, estrutura: string) => void;
}

export const SelectionEditDialog = ({
  open,
  onOpenChange,
  selectedText,
  campo,
  headline,
  estrutura,
  onUpdate,
}: SelectionEditDialogProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTiposAjuste, setShowTiposAjuste] = useState(false);
  const [showTiposChat, setShowTiposChat] = useState(false);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [selectedVariante, setSelectedVariante] = useState<number | null>(null);
  
  const { data: tiposAjuste = [] } = useTiposAjuste();
  const { data: tiposChat = [] } = useTiposChatRevisao();
  const [selectedTipoChatId, setSelectedTipoChatIdState] = useState<string | null>(() => {
    return localStorage.getItem("selection-edit-chat-profile") || null;
  });

  const setSelectedTipoChatId = (id: string | null) => {
    setSelectedTipoChatIdState(id);
    if (id) {
      localStorage.setItem("selection-edit-chat-profile", id);
    } else {
      localStorage.removeItem("selection-edit-chat-profile");
    }
  };
  
  const selectedTipoChat = tiposChat.find(t => t.id === selectedTipoChatId);

  // Limpar state quando dialog abre
  useEffect(() => {
    if (open) {
      setInputValue("");
      setVariantes([]);
      setSelectedVariante(null);
    }
  }, [open]);

  const handleSelectTipoAjuste = (tipo: TipoAjuste) => {
    if (tipo.instrucoes) {
      setInputValue(prev => prev ? `${prev}\n\n${tipo.instrucoes}` : tipo.instrucoes);
    } else {
      setInputValue(prev => prev ? `${prev}\n\n${tipo.nome}` : tipo.nome);
    }
    setShowTiposAjuste(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setVariantes([]);
    setSelectedVariante(null);
    
    try {
      const payload = {
        headline,
        estrutura,
        mensagem: inputValue,
        historico: [],
        selecao: {
          texto: selectedText,
          campo: campo,
        },
        promptSistema: selectedTipoChat?.prompt_sistema || null,
        variantes: true,
      };
      
      const { data, error } = await supabase.functions.invoke("revisar-roteiro", {
        body: payload,
      });
      
      if (error) {
        console.error("Erro ao chamar revisar-roteiro:", error);
        toast({
          title: "Erro",
          description: "Não foi possível processar a solicitação.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      
      if (data.variantes && data.variantes.length > 0) {
        setVariantes(data.variantes);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar variações. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro:", err);
      toast({
        title: "Erro",
        description: "Erro ao processar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUsar = () => {
    if (selectedVariante === null) return;
    const v = variantes[selectedVariante];
    onUpdate(v.headline, v.estrutura);
    toast({
      title: "Alteração aplicada!",
      description: v.resumo || "O trecho foi modificado com sucesso.",
    });
    onOpenChange(false);
  };

  // Extract only the changed part for display
  const getChangedText = (v: Variante) => {
    if (campo === "headline") {
      return v.headline !== headline ? v.headline : v.estrutura;
    }
    return v.estrutura !== estrutura ? v.estrutura : v.headline;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              Editar seleção
            </DialogTitle>
          </DialogHeader>
          
          {/* Texto selecionado */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Texto selecionado:</p>
            <p className="text-sm font-medium break-words">"{selectedText}"</p>
          </div>
          
          {/* Input para instrução */}
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="O que deseja fazer com este trecho?"
            className="min-h-[80px]"
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          
          {/* Variantes results */}
          {(variantes.length > 0 || isProcessing) && (
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {isProcessing ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Gerando 3 variações...</span>
                </div>
              ) : (
                variantes.map((v, i) => {
                  const isSelected = selectedVariante === i;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedVariante(isSelected ? null : i)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => setSelectedVariante(isSelected ? null : i)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            V{i + 1} — {v.resumo}
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words line-clamp-4">
                            {campo === "headline" ? v.headline : v.estrutura}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          
          {/* Linha de ações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Popover open={showTiposAjuste} onOpenChange={setShowTiposAjuste}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Tipos de ajuste">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Tipos de Ajuste
                    </p>
                    {tiposAjuste.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-2">
                        Nenhum tipo cadastrado
                      </p>
                    ) : (
                      tiposAjuste.map((tipo) => (
                        <Button
                          key={tipo.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm h-8"
                          onClick={() => handleSelectTipoAjuste(tipo)}
                        >
                          {tipo.nome}
                        </Button>
                      ))
                    )}
                    <div className="border-t pt-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-7 text-muted-foreground"
                        onClick={() => {
                          setShowTiposAjuste(false);
                          setTimeout(() => {
                            const btn = document.querySelector('[data-manage-tipos-ajuste]') as HTMLButtonElement;
                            btn?.click();
                          }, 100);
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Gerenciar tipos
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs h-8 px-2">
                    {selectedTipoChat?.nome || "Padrão"}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Perfil de Chat
                    </p>
                    <Button
                      variant={!selectedTipoChatId ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => setSelectedTipoChatId(null)}
                    >
                      Padrão
                    </Button>
                    {[...tiposChat].sort((a, b) => {
                      if (a.id === selectedTipoChatId) return -1;
                      if (b.id === selectedTipoChatId) return 1;
                      return 0;
                    }).map((tipo) => (
                      <Button
                        key={tipo.id}
                        variant={selectedTipoChatId === tipo.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-sm h-8"
                        onClick={() => setSelectedTipoChatId(tipo.id)}
                      >
                        {tipo.nome}
                      </Button>
                    ))}
                    <div className="border-t pt-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-7 text-muted-foreground"
                        onClick={() => setShowTiposChat(true)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Gerenciar perfis
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {variantes.length > 0 && selectedVariante !== null ? (
                <Button 
                  onClick={handleUsar}
                  size="sm"
                  className="h-8"
                >
                  Usar
                </Button>
              ) : (
                <Button 
                  onClick={handleSend} 
                  disabled={isProcessing || !inputValue.trim()}
                  size="sm"
                  className="h-8"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar"
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground text-center">
            Pressione Cmd/Ctrl + Enter para enviar
          </p>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para gerenciar tipos de ajuste (hidden trigger) */}
      <button data-manage-tipos-ajuste className="hidden" onClick={() => setShowTiposAjuste(true)} />
      
      {/* Dialog de tipos de chat */}
      <TiposChatDialog
        open={showTiposChat}
        onOpenChange={setShowTiposChat}
      />
    </>
  );
};