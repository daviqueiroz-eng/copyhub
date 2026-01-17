import { useState, useCallback } from "react";
import { Plus, ChevronDown, ChevronRight, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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

interface OverdeliveryViewProps {
  blocos: Bloco[];
  onBlocosChange: (blocos: Bloco[]) => void;
  onSaveRoteiro: (blocoId: string, ordem: number, headline: string, estrutura: string) => void;
}

export const OverdeliveryView = ({
  blocos,
  onBlocosChange,
  onSaveRoteiro,
}: OverdeliveryViewProps) => {
  const [editingTitulo, setEditingTitulo] = useState<string | null>(null);

  const toggleBloco = useCallback((blocoId: string, isOpen: boolean) => {
    onBlocosChange(
      blocos.map((b) =>
        b.id === blocoId ? { ...b, isOpen } : b
      )
    );
  }, [blocos, onBlocosChange]);

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
    value: string
  ) => {
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

  return (
    <div className="space-y-4 px-4 sm:px-8 lg:px-16 py-6 lg:py-12">
      {blocos.map((bloco, blocoIndex) => (
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
              <div className="border-t p-4 space-y-6">
                {bloco.roteiros.map((roteiro, roteiroIndex) => {
                  const ordemFormatada = String(roteiro.ordem).padStart(2, "0");
                  
                  return (
                    <div key={roteiro.ordem} className="group relative">
                      {/* Headline */}
                      <div className="mb-2">
                        <label className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-1 block">
                          HEADLINE {ordemFormatada}:
                        </label>
                        <div className="relative">
                          <Input
                            value={roteiro.headline}
                            onChange={(e) => updateRoteiro(bloco.id, roteiro.ordem, "headline", e.target.value)}
                            placeholder="Digite a headline..."
                            className="font-medium"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                            onClick={() => removeRoteiro(bloco.id, roteiro.ordem)}
                            title="Remover roteiro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Estrutura */}
                      <div>
                        <label className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-1 block">
                          ESTRUTURA {ordemFormatada}:
                        </label>
                        <Textarea
                          value={roteiro.estrutura}
                          onChange={(e) => updateRoteiro(bloco.id, roteiro.ordem, "estrutura", e.target.value)}
                          placeholder="Digite a estrutura..."
                          className="min-h-[120px] resize-y"
                        />
                      </div>
                      
                      {roteiroIndex < bloco.roteiros.length - 1 && (
                        <div className="border-b mt-6" />
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
    </div>
  );
};
