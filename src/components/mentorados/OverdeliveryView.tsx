import { useState, useCallback, useRef } from "react";
import { Plus, ChevronDown, ChevronRight, Trash2, GripVertical, Copy, Volume2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { InlineSpellCheckEditor } from "./InlineSpellCheckEditor";
import { SlashCommandPopover } from "./SlashCommandPopover";
import { HeadlinesRandomDialog } from "./HeadlinesRandomDialog";
import { AnalysisHeadline } from "@/hooks/useAnalysisHeadlines";
import { toast } from "sonner";

type SlashCommandMode = "menu" | "intensificadores" | "ctas" | "prompts" | "mentorados" | string;

interface RoteiroItem {
  ordem: number;
  headline: string;
  estrutura: string;
}

interface Bloco {
  id: string;
  titulo: string;
  isOpen: boolean;
  roteiros: RoteiroItem[];
}

interface AvatarCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  items: string[];
}

interface OverdeliveryViewProps {
  blocos: Bloco[];
  onBlocosChange: (blocos: Bloco[]) => void;
  onToggleBloco?: (blocoId: string, isOpen: boolean) => void;
  onSaveRoteiro: (blocoId: string, ordem: number, headline: string, estrutura: string) => void;
  onFieldBlur?: (blocoId: string, ordem: number, field: "headline" | "estrutura") => void;
  avatarCategories?: AvatarCategory[];
  onAddAvatarItem?: (categoryId: string, text: string) => void;
  onEditAvatarItem?: (categoryId: string, oldText: string, newText: string) => void;
  onDeleteAvatarItem?: (categoryId: string, text: string) => void;
  selectedMentoradoId?: string;
  isSaving?: boolean;
  isSaved?: boolean;
  isLoading?: boolean;
  onCheckTimer?: (field: "headlines" | "roteiros") => void;
  
}

export const OverdeliveryView = ({
  blocos,
  onBlocosChange,
  onToggleBloco,
  onSaveRoteiro,
  onFieldBlur,
  avatarCategories = [],
  onAddAvatarItem,
  onEditAvatarItem,
  onDeleteAvatarItem,
  selectedMentoradoId,
  isSaving = false,
  isSaved = false,
  isLoading = false,
  onCheckTimer,
  
}: OverdeliveryViewProps) => {
  const [editingTitulo, setEditingTitulo] = useState<string | null>(null);
  
  // Slash command state
  const [slashCommand, setSlashCommand] = useState<{
    isOpen: boolean;
    mode: SlashCommandMode;
    targetBlocoId: string;
    targetOrdem: number;
    targetField: "headline" | "estrutura";
    position: { top: number; left: number };
  }>({
    isOpen: false,
    mode: "menu",
    targetBlocoId: "",
    targetOrdem: 0,
    targetField: "headline",
    position: { top: 0, left: 0 },
  });

  // Headlines modal state
  const [showHeadlinesModal, setShowHeadlinesModal] = useState(false);
  const [headlinesTargetBlocoId, setHeadlinesTargetBlocoId] = useState("");
  const [headlinesTargetOrdem, setHeadlinesTargetOrdem] = useState(0);
  const [headlinesTargetField, setHeadlinesTargetField] = useState<"headline" | "estrutura">("headline");
  const [savedHeadlines, setSavedHeadlines] = useState<AnalysisHeadline[]>([]);
  
  // Ref para posição do cursor
  const cursorPositionRef = useRef<Map<string, number>>(new Map());

  const toggleBloco = useCallback((blocoId: string, isOpen: boolean) => {
    // Usar handler dedicado se disponível (não dispara salvamento)
    if (onToggleBloco) {
      onToggleBloco(blocoId, isOpen);
    } else {
      // Fallback para comportamento antigo
      onBlocosChange(
        blocos.map((b) =>
          b.id === blocoId ? { ...b, isOpen } : b
        )
      );
    }
  }, [blocos, onBlocosChange, onToggleBloco]);

  const updateBlocoTitulo = useCallback((blocoId: string, titulo: string) => {
    onBlocosChange(
      blocos.map((b) =>
        b.id === blocoId ? { ...b, titulo } : b
      )
    );
  }, [blocos, onBlocosChange]);

  const addRoteiroToBloco = useCallback((blocoId: string) => {
    onBlocosChange(
      blocos.map((b) => {
        if (b.id === blocoId) {
          const nextOrdem = b.roteiros.length > 0 
            ? Math.max(...b.roteiros.map(r => r.ordem)) + 1 
            : 1;
          return {
            ...b,
            roteiros: [...b.roteiros, { ordem: nextOrdem, headline: "", estrutura: "" }],
          };
        }
        return b;
      })
    );
  }, [blocos, onBlocosChange]);

  const updateRoteiro = useCallback((
    blocoId: string, 
    ordem: number, 
    field: "headline" | "estrutura", 
    value: string,
    cursorPosition?: number
  ) => {
    // Verificar timer ANTES de atualizar (se tem conteúdo)
    if (value.length > 0 && onCheckTimer) {
      onCheckTimer(field === "headline" ? "headlines" : "roteiros");
    }
    
    // Atualizar valor normalmente
    onBlocosChange(
      blocos.map((b) => {
        if (b.id === blocoId) {
          return {
            ...b,
            roteiros: b.roteiros.map((r) =>
              r.ordem === ordem ? { ...r, [field]: value } : r
            ),
          };
        }
        return b;
      })
    );

    // Detectar comandos "/"
    const key = `${blocoId}-${ordem}-${field}`;
    const cursorPos = cursorPosition ?? value.length;
    cursorPositionRef.current.set(key, cursorPos);
    
    const textBeforeCursor = value.slice(0, cursorPos);
    
    const popoverWidth = 320;
    let left = Math.max(20, (window.innerWidth - popoverWidth) / 2);
    let top = 200;

    if (textBeforeCursor.endsWith("/i")) {
      setSlashCommand({
        isOpen: true,
        mode: "intensificadores",
        targetBlocoId: blocoId,
        targetOrdem: ordem,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/c")) {
      setSlashCommand({
        isOpen: true,
        mode: "ctas",
        targetBlocoId: blocoId,
        targetOrdem: ordem,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/3")) {
      // Limpar /3 e abrir modal de headlines
      const textAfterCursor = value.slice(cursorPos);
      const cleanValue = textBeforeCursor.slice(0, -2) + textAfterCursor;
      
      // Atualizar valor sem o /3
      onBlocosChange(
        blocos.map((b) => {
          if (b.id === blocoId) {
            return {
              ...b,
              roteiros: b.roteiros.map((r) =>
                r.ordem === ordem ? { ...r, [field]: cleanValue } : r
              ),
            };
          }
          return b;
        })
      );
      
      cursorPositionRef.current.set(key, cursorPos - 2);
      setHeadlinesTargetBlocoId(blocoId);
      setHeadlinesTargetOrdem(ordem);
      setHeadlinesTargetField(field);
      setShowHeadlinesModal(true);
      setSlashCommand(prev => ({ ...prev, isOpen: false }));
    } else if (textBeforeCursor.endsWith("/p")) {
      const textAfterCursor = value.slice(cursorPos);
      const cleanValue = textBeforeCursor.slice(0, -2) + textAfterCursor;
      
      onBlocosChange(
        blocos.map((b) => {
          if (b.id === blocoId) {
            return {
              ...b,
              roteiros: b.roteiros.map((r) =>
                r.ordem === ordem ? { ...r, [field]: cleanValue } : r
              ),
            };
          }
          return b;
        })
      );
      
      cursorPositionRef.current.set(key, cursorPos - 2);
      setSlashCommand({
        isOpen: true,
        mode: "prompts",
        targetBlocoId: blocoId,
        targetOrdem: ordem,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/m")) {
      const textAfterCursor = value.slice(cursorPos);
      const cleanValue = textBeforeCursor.slice(0, -2) + textAfterCursor;
      
      onBlocosChange(
        blocos.map((b) => {
          if (b.id === blocoId) {
            return {
              ...b,
              roteiros: b.roteiros.map((r) =>
                r.ordem === ordem ? { ...r, [field]: cleanValue } : r
              ),
            };
          }
          return b;
        })
      );
      
      cursorPositionRef.current.set(key, cursorPos - 2);
      setSlashCommand({
        isOpen: true,
        mode: "mentorados",
        targetBlocoId: blocoId,
        targetOrdem: ordem,
        targetField: field,
        position: { top, left },
      });
    } else if (textBeforeCursor.endsWith("/")) {
      // Abrir menu principal de comandos
      setSlashCommand({
        isOpen: true,
        mode: "menu",
        targetBlocoId: blocoId,
        targetOrdem: ordem,
        targetField: field,
        position: { top, left },
      });
    }
    
    // Debounce save
    const bloco = blocos.find(b => b.id === blocoId);
    const roteiro = bloco?.roteiros.find(r => r.ordem === ordem);
    if (roteiro) {
      const newValue = field === "headline" ? value : roteiro.headline;
      const newEstrutura = field === "estrutura" ? value : roteiro.estrutura;
      setTimeout(() => {
        onSaveRoteiro(blocoId, ordem, newValue, newEstrutura);
      }, 1500);
    }
  }, [blocos, onBlocosChange, onSaveRoteiro]);

  const handleSelectItem = useCallback((text: string) => {
    const { targetBlocoId, targetOrdem, targetField } = slashCommand;
    const bloco = blocos.find(b => b.id === targetBlocoId);
    const roteiro = bloco?.roteiros.find(r => r.ordem === targetOrdem);
    
    if (!roteiro) return;
    
    const currentValue = roteiro[targetField];
    const key = `${targetBlocoId}-${targetOrdem}-${targetField}`;
    const cursorPos = cursorPositionRef.current.get(key) ?? currentValue.length;
    
    // Remover o comando / do texto
    let textBeforeCursor = currentValue.slice(0, cursorPos);
    const textAfterCursor = currentValue.slice(cursorPos);
    
    // Remover /i, /c, /p, /m ou / do final
    if (textBeforeCursor.endsWith("/i") || textBeforeCursor.endsWith("/c") || 
        textBeforeCursor.endsWith("/p") || textBeforeCursor.endsWith("/m")) {
      textBeforeCursor = textBeforeCursor.slice(0, -2);
    } else if (textBeforeCursor.endsWith("/")) {
      textBeforeCursor = textBeforeCursor.slice(0, -1);
    }
    
    const newValue = textBeforeCursor + text + textAfterCursor;
    
    onBlocosChange(
      blocos.map((b) => {
        if (b.id === targetBlocoId) {
          return {
            ...b,
            roteiros: b.roteiros.map((r) =>
              r.ordem === targetOrdem ? { ...r, [targetField]: newValue } : r
            ),
          };
        }
        return b;
      })
    );
    
    setSlashCommand(prev => ({ ...prev, isOpen: false }));
  }, [blocos, slashCommand, onBlocosChange]);

  const handleSelectHeadlines = useCallback((headlines: string[]) => {
    const bloco = blocos.find(b => b.id === headlinesTargetBlocoId);
    const roteiro = bloco?.roteiros.find(r => r.ordem === headlinesTargetOrdem);
    
    if (roteiro) {
      const currentValue = roteiro[headlinesTargetField];
      const key = `${headlinesTargetBlocoId}-${headlinesTargetOrdem}-${headlinesTargetField}`;
      const cursorPos = cursorPositionRef.current.get(key) ?? currentValue.length;
      const newValue = currentValue.slice(0, cursorPos) + headlines.join("\n") + currentValue.slice(cursorPos);
      
      onBlocosChange(
        blocos.map((b) => {
          if (b.id === headlinesTargetBlocoId) {
            return {
              ...b,
              roteiros: b.roteiros.map((r) =>
                r.ordem === headlinesTargetOrdem ? { ...r, [headlinesTargetField]: newValue } : r
              ),
            };
          }
          return b;
        })
      );
    }
    setShowHeadlinesModal(false);
  }, [blocos, headlinesTargetBlocoId, headlinesTargetOrdem, headlinesTargetField, onBlocosChange]);

  const removeRoteiro = useCallback((blocoId: string, ordem: number) => {
    onBlocosChange(
      blocos.map((b) => {
        if (b.id === blocoId) {
          return {
            ...b,
            roteiros: b.roteiros.filter((r) => r.ordem !== ordem),
          };
        }
        return b;
      })
    );
  }, [blocos, onBlocosChange]);

  const addNewBloco = useCallback(() => {
    const nextId = `bloco-${Date.now()}`;
    const nextNumero = blocos.length + 1;
    onBlocosChange([
      ...blocos,
      {
        id: nextId,
        titulo: `Bloco ${nextNumero}`,
        isOpen: true,
        roteiros: [{ ordem: 1, headline: "", estrutura: "" }],
      },
    ]);
  }, [blocos, onBlocosChange]);

  const removeBloco = useCallback((blocoId: string) => {
    onBlocosChange(blocos.filter((b) => b.id !== blocoId));
  }, [blocos, onBlocosChange]);

  const copyRoteiroContent = useCallback((roteiro: RoteiroItem) => {
    const content = `HEADLINE ${String(roteiro.ordem).padStart(2, "0")}:\n${roteiro.headline}\n\nESTRUTURA ${String(roteiro.ordem).padStart(2, "0")}:\n${roteiro.estrutura}`;
    navigator.clipboard.writeText(content);
    toast.success("Roteiro copiado!");
  }, []);

  const speakRoteiro = useCallback((roteiro: RoteiroItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Headline ${roteiro.ordem}. ${roteiro.headline}. Estrutura ${roteiro.ordem}. ${roteiro.estrutura}`
      );
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
      toast.success("Reproduzindo áudio...");
    } else {
      toast.error("Seu navegador não suporta síntese de voz");
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-8 lg:px-16 py-6 lg:py-12">
      {/* Status de salvamento */}
      <div className="flex items-center justify-end gap-2 h-6">
        {isSaving && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Salvando...</span>
          </div>
        )}
        {isSaved && !isSaving && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>Salvo</span>
          </div>
        )}
      </div>
      
      {blocos.map((bloco) => (
        <Collapsible
          key={bloco.id}
          open={bloco.isOpen}
          onOpenChange={(open) => toggleBloco(bloco.id, open)}
        >
          <div className="border rounded-lg bg-card overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 p-4 hover:bg-muted/50 cursor-pointer group">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {bloco.isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                
                {editingTitulo === bloco.id ? (
                  <Input
                    value={bloco.titulo}
                    onChange={(e) => updateBlocoTitulo(bloco.id, e.target.value)}
                    onBlur={() => setEditingTitulo(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingTitulo(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold h-8 text-base max-w-xs"
                    autoFocus
                  />
                ) : (
                  <span
                    className="font-bold text-base flex-1"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingTitulo(bloco.id);
                    }}
                    title="Duplo clique para editar"
                  >
                    📋 {bloco.titulo}
                  </span>
                )}
                
                <span className="text-sm text-muted-foreground ml-auto mr-2">
                  {bloco.roteiros.length} roteiro{bloco.roteiros.length !== 1 ? "s" : ""}
                </span>
                
                {blocos.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBloco(bloco.id);
                    }}
                    title="Remover bloco"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t px-4 sm:px-8 lg:px-12 py-6 lg:py-8">
                {bloco.roteiros.map((roteiro, roteiroIndex) => {
                  const ordemFormatada = String(roteiro.ordem).padStart(2, "0");
                  
                  return (
                    <div key={roteiro.ordem} className="relative group mb-8">
                      {/* Ícones de ação lateral */}
                      <div className="absolute right-0 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyRoteiroContent(roteiro)}
                          title="Copiar roteiro"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeRoteiro(bloco.id, roteiro.ordem)}
                          title="Remover roteiro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => speakRoteiro(roteiro)}
                          title="Ouvir roteiro"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Headline */}
                      <div className="mb-4 pr-12">
                        <span className="font-poppins font-bold text-[#B8860B] text-base block mb-1">
                          HEADLINE {ordemFormatada}:
                        </span>
                        <InlineSpellCheckEditor
                          value={roteiro.headline}
                          onChange={(value) => {
                            // Get cursor position from the editor if possible
                            const textarea = document.activeElement as HTMLTextAreaElement;
                            const cursorPosition = textarea?.selectionStart;
                            updateRoteiro(bloco.id, roteiro.ordem, "headline", value, cursorPosition);
                          }}
                          onBlur={() => onFieldBlur?.(bloco.id, roteiro.ordem, "headline")}
                          placeholder="Digite a headline... (use / para comandos)"
                          className="text-base"
                        />
                      </div>

                      {/* Estrutura */}
                      <div className="pr-12">
                        <span className="font-poppins font-bold text-[#B8860B] text-base block mb-1">
                          ESTRUTURA {ordemFormatada}:
                        </span>
                        <InlineSpellCheckEditor
                          value={roteiro.estrutura}
                          onChange={(value) => {
                            const textarea = document.activeElement as HTMLTextAreaElement;
                            const cursorPosition = textarea?.selectionStart;
                            updateRoteiro(bloco.id, roteiro.ordem, "estrutura", value, cursorPosition);
                          }}
                          onBlur={() => onFieldBlur?.(bloco.id, roteiro.ordem, "estrutura")}
                          placeholder="Digite a estrutura do roteiro... (use / para comandos)"
                          className="text-base min-h-[120px]"
                        />
                        <div className="text-right text-xs text-muted-foreground mt-1">
                          {roteiro.estrutura?.length || 0} caracteres
                        </div>
                      </div>

                      {/* Separador entre roteiros */}
                      {roteiroIndex < bloco.roteiros.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 mt-4"
                  onClick={() => addRoteiroToBloco(bloco.id)}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar roteiro ao bloco
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
      
      <Button
        variant="outline"
        className="w-full gap-2 py-6 border-dashed"
        onClick={addNewBloco}
      >
        <Plus className="h-5 w-5" />
        Adicionar novo bloco
      </Button>

      {/* Slash Command Popover */}
      <SlashCommandPopover
        isOpen={slashCommand.isOpen}
        mode={slashCommand.mode}
        onClose={() => setSlashCommand(prev => ({ ...prev, isOpen: false }))}
        onSelectItem={handleSelectItem}
        position={slashCommand.position}
        avatarCategories={avatarCategories}
        onAddAvatarItem={onAddAvatarItem}
        onEditAvatarItem={onEditAvatarItem}
        onDeleteAvatarItem={onDeleteAvatarItem}
      />

      {/* Headlines Random Dialog */}
      <HeadlinesRandomDialog
        open={showHeadlinesModal}
        onClose={() => setShowHeadlinesModal(false)}
        onSelectMultiple={handleSelectHeadlines}
        savedHeadlines={savedHeadlines}
        onSaveHeadlines={setSavedHeadlines}
        selectedMentoradoId={selectedMentoradoId}
      />
    </div>
  );
};
