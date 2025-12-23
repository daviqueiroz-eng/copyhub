import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Copy, Trash2, Plus, Check, Loader2, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  useMentoradosRoteiros,
  useUpsertMentoradoRoteiro,
  MentoradoRoteiro,
} from "@/hooks/useMentoradosRoteiros";

interface MentoradoRoteirosViewProps {
  mentoradoId: string;
  mentoradoNome: string;
  onClose: () => void;
}

type RoteiroLocal = {
  headline: string;
  estrutura: string;
  isDirty: boolean;
};

const ROTEIROS_POR_GUIA = 10;

export const MentoradoRoteirosView = ({
  mentoradoId,
  mentoradoNome,
  onClose,
}: MentoradoRoteirosViewProps) => {
  const [guiaAtiva, setGuiaAtiva] = useState(1);
  const [guias, setGuias] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [roteirosLocais, setRoteirosLocais] = useState<Map<string, RoteiroLocal>>(new Map());
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const { data: roteiros = [], isLoading } = useMentoradosRoteiros(mentoradoId);
  const upsertRoteiro = useUpsertMentoradoRoteiro();

  // Inicializar roteiros locais a partir do banco
  useEffect(() => {
    const newMap = new Map<string, RoteiroLocal>();
    
    // Para cada guia e ordem, verificar se existe no banco
    guias.forEach((guiaNum) => {
      for (let ordem = 1; ordem <= ROTEIROS_POR_GUIA; ordem++) {
        const key = `${guiaNum}-${ordem}`;
        const existing = roteiros.find(
          (r) => r.guia_numero === guiaNum && r.ordem === ordem
        );
        
        if (existing) {
          newMap.set(key, {
            headline: existing.headline || "",
            estrutura: existing.estrutura || "",
            isDirty: false,
          });
        } else {
          // Manter o que já existe localmente se não tiver no banco
          const localExisting = roteirosLocais.get(key);
          if (localExisting) {
            newMap.set(key, localExisting);
          }
        }
      }
    });
    
    setRoteirosLocais(newMap);
  }, [roteiros, guias]);

  // Debounce para auto-save
  const debouncedSave = useCallback(
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

  // Timer refs para debounce
  const [debounceTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const handleChange = (
    guiaNumero: number,
    ordem: number,
    field: "headline" | "estrutura",
    value: string
  ) => {
    const key = `${guiaNumero}-${ordem}`;
    
    setRoteirosLocais((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(key) || { headline: "", estrutura: "", isDirty: false };
      newMap.set(key, {
        ...existing,
        [field]: value,
        isDirty: true,
      });
      return newMap;
    });

    // Limpar timer anterior
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Novo timer para auto-save (500ms)
    const timer = setTimeout(() => {
      const current = roteirosLocais.get(key);
      const headline = field === "headline" ? value : (current?.headline || "");
      const estrutura = field === "estrutura" ? value : (current?.estrutura || "");
      debouncedSave(guiaNumero, ordem, headline, estrutura);
    }, 500);
    
    debounceTimers.set(key, timer);
  };

  const handleClearRoteiro = (guiaNumero: number, ordem: number) => {
    const key = `${guiaNumero}-${ordem}`;
    
    setRoteirosLocais((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, { headline: "", estrutura: "", isDirty: true });
      return newMap;
    });

    // Salvar como vazio (ou deletar)
    debouncedSave(guiaNumero, ordem, "", "");
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

    const text = `HEADLINE:\n${roteiro.headline}\n\nESTRUTURA:\n${roteiro.estrutura}`;
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Copiado!",
      description: `Roteiro ${String(ordem).padStart(2, "0")} copiado.`,
    });
  };

  const handleCopyAllRoteiros = () => {
    const roteirosGuia: string[] = [];
    
    for (let ordem = 1; ordem <= ROTEIROS_POR_GUIA; ordem++) {
      const key = `${guiaAtiva}-${ordem}`;
      const roteiro = roteirosLocais.get(key);
      
      if (roteiro?.headline || roteiro?.estrutura) {
        roteirosGuia.push(
          `--- ROTEIRO ${String(ordem).padStart(2, "0")} ---\nHEADLINE:\n${roteiro.headline}\n\nESTRUTURA:\n${roteiro.estrutura}`
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

    navigator.clipboard.writeText(roteirosGuia.join("\n\n"));
    
    toast({
      title: "Copiados!",
      description: `${roteirosGuia.length} roteiros da Guia ${guiaAtiva} copiados.`,
    });
  };

  const handleAddGuia = () => {
    const nextGuia = Math.max(...guias) + 1;
    setGuias((prev) => [...prev, nextGuia]);
    setGuiaAtiva(nextGuia);
  };

  const getFilledCount = (guiaNumero: number) => {
    let count = 0;
    for (let ordem = 1; ordem <= ROTEIROS_POR_GUIA; ordem++) {
      const key = `${guiaNumero}-${ordem}`;
      const roteiro = roteirosLocais.get(key);
      if (roteiro?.headline || roteiro?.estrutura) {
        count++;
      }
    }
    return count;
  };

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
              Guia {guiaAtiva} • {getFilledCount(guiaAtiva)}/{ROTEIROS_POR_GUIA} preenchidos
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
              {guias.map((guiaNum) => (
                <Button
                  key={guiaNum}
                  variant={guiaAtiva === guiaNum ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setGuiaAtiva(guiaNum)}
                >
                  <span>Guia {guiaNum}</span>
                  <span className="ml-auto text-xs opacity-70">
                    {getFilledCount(guiaNum)}/{ROTEIROS_POR_GUIA}
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
              onClick={handleAddGuia}
            >
              <Plus className="h-4 w-4" />
              Nova Guia
            </Button>
          </div>
        </div>

        {/* Main - Roteiros */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {Array.from({ length: ROTEIROS_POR_GUIA }, (_, i) => i + 1).map((ordem) => {
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
                      HEADLINE {String(ordem).padStart(2, "0")}:
                    </label>
                    <Input
                      value={roteiro.headline}
                      onChange={(e) =>
                        handleChange(guiaAtiva, ordem, "headline", e.target.value)
                      }
                      placeholder="Digite a headline..."
                      className="font-poppins text-[16px]"
                    />
                  </div>

                  {/* Estrutura */}
                  <div className="space-y-2">
                    <label className="font-poppins font-bold text-[#B8860B] text-sm">
                      ESTRUTURA {String(ordem).padStart(2, "0")}:
                    </label>
                    <Textarea
                      value={roteiro.estrutura}
                      onChange={(e) =>
                        handleChange(guiaAtiva, ordem, "estrutura", e.target.value)
                      }
                      placeholder="Digite a estrutura do roteiro..."
                      className="font-poppins text-[14px] min-h-[120px] border-b-2 border-b-blue-500"
                      rows={5}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
