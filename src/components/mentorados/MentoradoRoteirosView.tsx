import { useState, useEffect, useCallback, useRef } from "react";
import { X, Copy, Trash2, Plus, Check, Loader2, ClipboardCopy, Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMentoradosRoteiros,
  useUpsertMentoradoRoteiro,
} from "@/hooks/useMentoradosRoteiros";
import { useMentorados } from "@/hooks/useMentorados";
import { SlashCommandPopover } from "./SlashCommandPopover";
import { HeadlinesRandomDialog } from "./HeadlinesRandomDialog";
import { AnalysisHeadline } from "@/hooks/useAnalysisHeadlines";

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

  // TTS hook
  const { speak, stop, isSpeaking } = useWebSpeechTTS({ rate: 1.0 });
  
  // Estado para guardar posição do cursor por roteiro
  const cursorPositionRef = useRef<Map<string, number>>(new Map());
  
  // Ref para o key do roteiro que está sendo falado
  const speakingKeyRef = useRef<string | null>(null);

  // Refs para debounce
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingChangesRef = useRef<Map<string, RoteiroLocal>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLTextAreaElement>>(new Map());

  const { data: roteiros = [], isLoading } = useMentoradosRoteiros(mentoradoId);
  const { data: mentorados = [] } = useMentorados();
  const upsertRoteiro = useUpsertMentoradoRoteiro();

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

  // Inicializar roteiros locais a partir do banco
  useEffect(() => {
    if (isLoading) return;
    
    const newMap = new Map<string, RoteiroLocal>();
    
    // Descobrir guias existentes a partir dos dados do banco
    const guiasExistentes = new Set<number>();
    roteiros.forEach((r) => guiasExistentes.add(r.guia_numero));
    
    // Atualizar lista de guias se houver mais no banco
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
        setShowFirstGuiaDialog(false); // Já tem guias do banco
      }
    }
    
    // Preencher com dados do banco
    roteiros.forEach((r) => {
      const key = `${r.guia_numero}-${r.ordem}`;
      newMap.set(key, {
        headline: r.headline || "",
        estrutura: r.estrutura || "",
      });
    });
    
    setRoteirosLocais(newMap);
  }, [roteiros, isLoading]);

  // Handler para criar primeira guia
  const handleCreateFirstGuia = (quantidade: number) => {
    setGuias([{ numero: 1, quantidade }]);
    setShowFirstGuiaDialog(false);
    toast({
      title: "Guia criada!",
      description: `Guia 1 com ${quantidade} roteiros criada.`,
    });
  };

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

  const handleChange = useCallback((
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura",
    value: string
  ) => {
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
      
      return newMap;
    });

    // Limpar timer anterior
    const existingTimer = debounceTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Novo timer para auto-save (1000ms)
    const timer = setTimeout(() => {
      const pending = pendingChangesRef.current.get(key);
      if (pending) {
        saveRoteiro(guiaNumero, ordem, pending.headline, pending.estrutura);
        pendingChangesRef.current.delete(key);
      }
    }, 1000);
    
    debounceTimersRef.current.set(key, timer);
  }, [saveRoteiro]);

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

  // Inserir texto selecionado do slash command
  const handleSlashSelectItem = useCallback((text: string) => {
    const { targetKey, targetField } = slashCommand;
    const roteiro = roteirosLocais.get(targetKey);
    if (!roteiro) return;

    const currentValue = roteiro[targetField];
    // Remover o "/" do final
    const cleanValue = currentValue.replace(/\/[12]?$/, "");
    const newValue = cleanValue + text;

    const [guiaStr, ordemStr] = targetKey.split("-");
    handleChange(parseInt(guiaStr), parseInt(ordemStr), targetField, newValue);
  }, [slashCommand, roteirosLocais, handleChange]);

  // Detectar /1 ou /2 para abrir diretamente o modo correto
  const handleInputChange2 = useCallback((
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura",
    value: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleChange(guiaNumero, ordem, field, value);

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const key = `${guiaNumero}-${ordem}`;

    // Calcular posição do popover
    const popoverWidth = 320;
    const popoverHeight = 350;
    let left = rect.right + window.scrollX + 8;
    if (left + popoverWidth > window.innerWidth) {
      left = rect.left + window.scrollX - popoverWidth - 8;
    }
    let top = rect.top + window.scrollY - popoverHeight / 2;
    if (top < 10) top = 10;
    if (top + popoverHeight > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - popoverHeight - 10;
    }

    // Verificar se termina com /1, /2 ou /3 - abrir diretamente no modo
    if (value.endsWith("/1")) {
      setSlashCommand({
        isOpen: true,
        mode: "intensificadores",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    } else if (value.endsWith("/2")) {
      setSlashCommand({
        isOpen: true,
        mode: "ctas",
        targetKey: key,
        targetField: field,
        position: { top, left },
      });
    } else if (value.endsWith("/3")) {
      // Abrir modal de headlines aleatórias
      // Limpar o /3 do valor
      const cleanValue = value.slice(0, -2);
      handleChange(guiaNumero, ordem, field, cleanValue);
      setHeadlinesTargetKey(key);
      setShowHeadlinesModal(true);
      // Fechar o popover se estiver aberto
      setSlashCommand(prev => ({ ...prev, isOpen: false }));
    } else if (slashCommand.isOpen) {
      // Manter popover aberto se já estiver
      setSlashCommand(prev => ({ ...prev, targetKey: key, targetField: field }));
    }
  }, [handleChange, slashCommand.isOpen]);

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

  const handleCopyRoteiro = (guiaNumero: number, ordem: number) => {
    const key = `${guiaNumero}-${ordem}`;
    const roteiro = roteirosLocais.get(key);
    
    if (!roteiro?.headline && !roteiro?.estrutura) {
      toast({
        title: "Roteiro vazio",
        description: "Não há conteúdo para copiar.",
      });
      return;
    }

    const text = `**HEADLINE ${ordem}:**\n\n${roteiro.headline}\n\n**ESTRUTURA ${ordem}:**\n\n${roteiro.estrutura}`;
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Copiado!",
      description: `Roteiro ${String(ordem).padStart(2, "0")} copiado.`,
    });
  };

  const handleCopyAllRoteiros = () => {
    const guiaConfig = guias.find(g => g.numero === guiaAtiva);
    const quantidade = guiaConfig?.quantidade || 10;
    const roteirosGuia: string[] = [];
    
    for (let ordem = 1; ordem <= quantidade; ordem++) {
      const key = `${guiaAtiva}-${ordem}`;
      const roteiro = roteirosLocais.get(key);
      
      if (roteiro?.headline || roteiro?.estrutura) {
        roteirosGuia.push(
          `**HEADLINE ${ordem}:**\n\n${roteiro.headline || ""}\n\n**ESTRUTURA ${ordem}:**\n\n${roteiro.estrutura || ""}`
        );
      }
    }

    if (roteirosGuia.length === 0) {
      toast({
        title: "Guia vazia",
        description: "Não há roteiros para copiar nesta guia.",
      });
      return;
    }

    navigator.clipboard.writeText(roteirosGuia.join("\n\n---\n\n"));
    
    toast({
      title: "Copiados!",
      description: `${roteirosGuia.length} roteiros da Guia ${guiaAtiva} copiados.`,
    });
  };

  const handleCreateGuia = (quantidade: number) => {
    const nextGuia = guias.length > 0 ? Math.max(...guias.map(g => g.numero)) + 1 : 1;
    setGuias((prev) => [...prev, { numero: nextGuia, quantidade }]);
    setGuiaAtiva(nextGuia);
    setShowNewGuiaDialog(false);
    
    toast({
      title: "Guia criada!",
      description: `Guia ${nextGuia} com ${quantidade} roteiros criada.`,
    });
  };

  const handleAddRoteiro = () => {
    setGuias((prev) => 
      prev.map((g) => 
        g.numero === guiaAtiva 
          ? { ...g, quantidade: g.quantidade + 1 } 
          : g
      )
    );
    
    toast({
      title: "Roteiro adicionado!",
      description: `Roteiro ${guiaAtivaConfig.quantidade + 1} adicionado à Guia ${guiaAtiva}.`,
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

  const guiaAtivaConfig = guias.find(g => g.numero === guiaAtiva) || { numero: 1, quantidade: 10 };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-poppins">Roteiros - {mentoradoNome}</h1>
            <p className="text-sm text-muted-foreground">
              Guia {guiaAtiva} • {getFilledCount(guiaAtiva)}/{guiaAtivaConfig.quantidade} preenchidos
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleCopyAllRoteiros}>
          <ClipboardCopy className="h-4 w-4" />
          Copiar todos os roteiros
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Guias */}
        <div className="w-48 border-r bg-muted/30 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {guias.map((guia) => (
                <Button
                  key={guia.numero}
                  variant={guiaAtiva === guia.numero ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setGuiaAtiva(guia.numero)}
                >
                  <span>Guia {guia.numero}</span>
                  <span className="ml-auto text-xs opacity-70">
                    {getFilledCount(guia.numero)}/{guia.quantidade}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowNewGuiaDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Guia
            </Button>
          </div>
        </div>

        {/* Main - Roteiros */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {Array.from({ length: guiaAtivaConfig.quantidade }, (_, i) => i + 1).map((ordem) => {
              const key = `${guiaAtiva}-${ordem}`;
              const roteiro = roteirosLocais.get(key) || { headline: "", estrutura: "" };
              const isSaving = savingKeys.has(key);
              const isSaved = savedKeys.has(key);

              return (
                <div
                  key={key}
                  className="bg-card rounded-lg border p-4 space-y-4"
                >
                  {/* Header do roteiro */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-poppins font-bold text-lg text-primary">
                        {String(ordem).padStart(2, "0")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyRoteiro(guiaAtiva, ordem)}
                        title="Copiar roteiro"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {isSaving && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Salvando...
                        </span>
                      )}
                      {isSaved && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Salvo
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleClearRoteiro(guiaAtiva, ordem)}
                      title="Limpar roteiro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Headline */}
                  <div className="space-y-2">
                    <label className="font-poppins font-bold text-[#B8860B] text-sm">
                      HEADLINE {ordem}:
                    </label>
                    <Textarea
                      value={roteiro.headline}
                      onChange={(e) => {
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        handleInputChange2(guiaAtiva, ordem, "headline", e.target.value, e);
                      }}
                      onKeyDown={(e) => handleInputKeyDown(e, guiaAtiva, ordem, "headline")}
                      placeholder="Digite a headline... (use / para comandos)"
                      className="font-poppins text-[16px] min-h-[44px] resize-none overflow-hidden"
                      ref={(el) => {
                        if (el && roteiro.headline) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                  </div>

                  {/* Estrutura */}
                  <div className="space-y-1">
                    <label className="font-poppins font-bold text-[#B8860B] text-sm">
                      ESTRUTURA {ordem}:
                    </label>
                    <Textarea
                      value={roteiro.estrutura}
                      onChange={(e) => {
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        handleInputChange2(guiaAtiva, ordem, "estrutura", e.target.value, e);
                      }}
                      onKeyDown={(e) => handleInputKeyDown(e, guiaAtiva, ordem, "estrutura")}
                      onSelect={(e) => {
                        // Guardar posição do cursor quando o usuário seleciona/clica
                        const target = e.currentTarget;
                        cursorPositionRef.current.set(key, target.selectionStart || 0);
                      }}
                      placeholder="Digite a estrutura do roteiro... (use / para comandos)"
                      className="font-poppins text-[14px] min-h-[80px] border-b-2 border-b-blue-500 resize-none overflow-hidden"
                      ref={(el) => {
                        // Auto-resize on mount if there's content
                        if (el && roteiro.estrutura) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                    <div className="flex justify-end items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {roteiro.estrutura?.length || 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title={isSpeaking && speakingKeyRef.current === key ? "Parar leitura" : "Ler a partir do cursor"}
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
                                description: "Não há texto a partir do cursor para ler.",
                              });
                            }
                          }
                        }}
                      >
                        {isSpeaking && speakingKeyRef.current === key ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Botão para adicionar mais roteiros */}
            <div className="flex justify-center py-4">
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
        </ScrollArea>
      </div>

      {/* Slash Command Popover */}
      <SlashCommandPopover
        isOpen={slashCommand.isOpen}
        mode={slashCommand.mode}
        onClose={() => setSlashCommand(prev => ({ ...prev, isOpen: false }))}
        onSelectItem={handleSlashSelectItem}
        position={slashCommand.position}
        avatarCategories={avatarCategories}
      />

      {/* Modal de Headlines Aleatórias (/3) */}
      <HeadlinesRandomDialog
        open={showHeadlinesModal}
        onClose={() => setShowHeadlinesModal(false)}
        savedHeadlines={savedHeadlines}
        onSaveHeadlines={setSavedHeadlines}
        onSelect={(headline) => {
          // Inserir a headline no campo de headline do roteiro alvo
          const [guiaStr, ordemStr] = headlinesTargetKey.split("-");
          if (guiaStr && ordemStr) {
            const roteiro = roteirosLocais.get(headlinesTargetKey) || { headline: "", estrutura: "" };
            handleChange(parseInt(guiaStr), parseInt(ordemStr), "headline", roteiro.headline + headline);
          }
          setShowHeadlinesModal(false);
        }}
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
        </DialogContent>
      </Dialog>
    </div>
  );
};
