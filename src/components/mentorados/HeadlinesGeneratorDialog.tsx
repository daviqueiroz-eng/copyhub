import { useState, useCallback, useEffect } from "react";
import { Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGenerateHeadlines } from "@/hooks/useGenerateHeadlines";
import { useInteligenciaGlobal, useUpdateInteligenciaGlobal } from "@/hooks/useInteligenciaGlobal";
import { useMentorados, useUpdateMentorado } from "@/hooks/useMentorados";
import { useUserRole } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AdaptedHeadline {
  original: string;
  adaptada: string;
}

interface HeadlinesGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  headlines: string[];
  mentoradoId?: string;
  onUseHeadlines: (headlines: string[]) => void;
}

export const HeadlinesGeneratorDialog = ({
  open,
  onClose,
  headlines,
  mentoradoId,
  onUseHeadlines,
}: HeadlinesGeneratorDialogProps) => {
  const [inteligenciaIndividual, setInteligenciaIndividual] = useState("");
  const [adaptedHeadlines, setAdaptedHeadlines] = useState<AdaptedHeadline[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGlobalOpen, setIsGlobalOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estados para edição da inteligência global (admin)
  const [inteligenciaGlobalEdit, setInteligenciaGlobalEdit] = useState("");
  const [tituloGlobalEdit, setTituloGlobalEdit] = useState("");
  const [hasUnsavedGlobalChanges, setHasUnsavedGlobalChanges] = useState(false);

  const generateMutation = useGenerateHeadlines();
  const { data: inteligenciaGlobal, isLoading: isLoadingGlobal } = useInteligenciaGlobal();
  const updateInteligenciaGlobal = useUpdateInteligenciaGlobal();
  const { data: mentorados = [] } = useMentorados();
  const updateMentorado = useUpdateMentorado();
  const { data: role } = useUserRole();
  const isAdmin = role === "admin";

  // Find the current mentorado
  const currentMentorado = mentoradoId 
    ? mentorados.find(m => m.id === mentoradoId) 
    : null;

  // Load mentorado's inteligencia when dialog opens or mentorado changes
  useEffect(() => {
    if (open && currentMentorado) {
      setInteligenciaIndividual(currentMentorado.inteligencia_ia || "");
      setHasUnsavedChanges(false);
    }
  }, [open, currentMentorado]);

  // Sync global intelligence data for admin editing
  useEffect(() => {
    if (open && inteligenciaGlobal) {
      setInteligenciaGlobalEdit(inteligenciaGlobal.conteudo || "");
      setTituloGlobalEdit(inteligenciaGlobal.titulo || "Método Principal");
      setHasUnsavedGlobalChanges(false);
    } else if (open && !inteligenciaGlobal && !isLoadingGlobal) {
      // No global intelligence exists yet
      setInteligenciaGlobalEdit("");
      setTituloGlobalEdit("Método Principal");
      setHasUnsavedGlobalChanges(false);
    }
  }, [open, inteligenciaGlobal, isLoadingGlobal]);

  // Track changes to individual intelligence
  const handleInteligenciaChange = (value: string) => {
    setInteligenciaIndividual(value);
    if (currentMentorado) {
      setHasUnsavedChanges(value !== (currentMentorado.inteligencia_ia || ""));
    }
  };

  // Save individual intelligence to mentorado
  const handleSaveInteligencia = useCallback(() => {
    if (!mentoradoId || !currentMentorado) {
      toast.error("Selecione um mentorado para salvar");
      return;
    }

    updateMentorado.mutate(
      { id: mentoradoId, inteligencia_ia: inteligenciaIndividual.trim() || null },
      {
        onSuccess: () => {
          toast.success("Inteligência do mentorado salva!");
          setHasUnsavedChanges(false);
        },
      }
    );
  }, [mentoradoId, currentMentorado, inteligenciaIndividual, updateMentorado]);

  // Save global intelligence (admin only)
  const handleSaveInteligenciaGlobal = useCallback(() => {
    if (!isAdmin) return;

    updateInteligenciaGlobal.mutate(
      { titulo: tituloGlobalEdit.trim() || "Método Principal", conteudo: inteligenciaGlobalEdit.trim() },
      {
        onSuccess: () => {
          setHasUnsavedGlobalChanges(false);
        },
      }
    );
  }, [isAdmin, tituloGlobalEdit, inteligenciaGlobalEdit, updateInteligenciaGlobal]);

  // Combine both intelligences for generation
  const getCombinedInteligencia = useCallback(() => {
    let combined = "";
    
    // Para admin, usar valor editado; para usuário, usar dados do banco
    const globalContent = isAdmin ? inteligenciaGlobalEdit : inteligenciaGlobal?.conteudo;
    
    if (globalContent?.trim()) {
      combined += `=== MÉTODO/FRAMEWORK (BASE GLOBAL) ===\n${globalContent.trim()}\n\n`;
    }
    
    if (inteligenciaIndividual.trim()) {
      combined += `=== CONTEXTO DO MENTORADO ===\n${inteligenciaIndividual.trim()}`;
    }
    
    return combined.trim();
  }, [isAdmin, inteligenciaGlobalEdit, inteligenciaGlobal, inteligenciaIndividual]);

  const handleGenerate = useCallback(async () => {
    const combinedInteligencia = getCombinedInteligencia();
    
    if (!combinedInteligencia) {
      toast.error("Preencha a inteligência (global ou individual) primeiro");
      return;
    }

    if (headlines.length === 0) {
      toast.error("Nenhuma headline disponível para adaptar");
      return;
    }

    // Limitar a 50 headlines por vez
    const headlinesToAdapt = headlines.slice(0, 50);

    try {
      const result = await generateMutation.mutateAsync({
        inteligencia: combinedInteligencia,
        headlines: headlinesToAdapt,
      });
      setAdaptedHeadlines(result);
      setSelectedIndices(new Set());
      toast.success(`${result.length} headlines adaptadas com sucesso!`);
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [getCombinedInteligencia, headlines, generateMutation]);

  const handleGenerateMore = useCallback(async () => {
    const combinedInteligencia = getCombinedInteligencia();
    
    if (!combinedInteligencia) {
      toast.error("Preencha a inteligência primeiro");
      return;
    }

    // Pegar as próximas 50 que ainda não foram adaptadas
    const startIndex = adaptedHeadlines.length;
    const headlinesToAdapt = headlines.slice(startIndex, startIndex + 50);

    if (headlinesToAdapt.length === 0) {
      toast.info("Todas as headlines já foram adaptadas");
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        inteligencia: combinedInteligencia,
        headlines: headlinesToAdapt,
      });
      setAdaptedHeadlines((prev) => [...prev, ...result]);
      toast.success(`Mais ${result.length} headlines adaptadas!`);
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [getCombinedInteligencia, headlines, adaptedHeadlines.length, generateMutation]);

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleUseSelected = useCallback(() => {
    const selected = adaptedHeadlines
      .filter((_, index) => selectedIndices.has(index))
      .map((h) => h.adaptada);
    
    if (selected.length > 0) {
      onUseHeadlines(selected);
      onClose();
    } else {
      toast.error("Selecione pelo menos uma headline");
    }
  }, [adaptedHeadlines, selectedIndices, onUseHeadlines, onClose]);

  const remainingHeadlines = headlines.length - adaptedHeadlines.length;
  const globalContent = isAdmin ? inteligenciaGlobalEdit : inteligenciaGlobal?.conteudo;
  const hasAnyInteligencia = !!(globalContent?.trim() || inteligenciaIndividual.trim());

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-poppins flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gere para mim
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[320px_1fr_180px] gap-6 flex-1 min-h-0">
          {/* Coluna 1: Inteligência (Global + Individual) */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* Inteligência Global (somente leitura) */}
            <Collapsible open={isGlobalOpen} onOpenChange={setIsGlobalOpen}>
              <div className="border rounded-lg">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-poppins italic text-sm text-muted-foreground">
                      Inteligência Global (Admin)
                    </span>
                    {inteligenciaGlobal?.conteudo && (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    )}
                  </div>
                  {isGlobalOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-3">
                    {isLoadingGlobal ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    ) : isAdmin ? (
                      // Admin: campos editáveis
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Título</Label>
                          <Input
                            value={tituloGlobalEdit}
                            onChange={(e) => {
                              setTituloGlobalEdit(e.target.value);
                              setHasUnsavedGlobalChanges(true);
                            }}
                            placeholder="Ex: Método Principal"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Conteúdo</Label>
                          <Textarea
                            value={inteligenciaGlobalEdit}
                            onChange={(e) => {
                              setInteligenciaGlobalEdit(e.target.value);
                              setHasUnsavedGlobalChanges(true);
                            }}
                            placeholder="Descreva o método, regras de copywriting, framework..."
                            className="min-h-[150px] resize-none text-sm mt-1"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveInteligenciaGlobal}
                          disabled={updateInteligenciaGlobal.isPending || !hasUnsavedGlobalChanges}
                          className="w-full"
                        >
                          {updateInteligenciaGlobal.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {hasUnsavedGlobalChanges ? "Salvar Global" : "Salvo"}
                        </Button>
                      </>
                    ) : inteligenciaGlobal?.conteudo ? (
                      // Usuário comum: somente leitura
                      <div className="text-sm bg-muted/30 p-3 rounded-md max-h-[150px] overflow-y-auto">
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          {inteligenciaGlobal.titulo}
                        </p>
                        <p className="whitespace-pre-wrap text-foreground/80">
                          {inteligenciaGlobal.conteudo.substring(0, 500)}
                          {inteligenciaGlobal.conteudo.length > 500 && "..."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhuma inteligência global configurada pelo admin.
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Inteligência Individual (editável) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="font-poppins italic text-muted-foreground">
                  Inteligência do Mentorado
                </Label>
                {currentMentorado && (
                  <span className="text-xs text-muted-foreground">
                    {currentMentorado.nome}
                  </span>
                )}
              </div>
              <Textarea
                placeholder={`Descreva:
• Nicho específico
• Público-alvo
• Produto/serviço
• Tom de voz
• Palavras-chave importantes`}
                value={inteligenciaIndividual}
                onChange={(e) => handleInteligenciaChange(e.target.value)}
                className="min-h-[180px] resize-none text-sm"
              />
              {mentoradoId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveInteligencia}
                  disabled={updateMentorado.isPending || !hasUnsavedChanges}
                  className="self-end"
                >
                  {updateMentorado.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {hasUnsavedChanges ? "Salvar" : "Salvo"}
                </Button>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !hasAnyInteligencia}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar adaptações
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {headlines.length} headlines disponíveis
            </p>
          </div>

          {/* Coluna 2: Headlines Original + Adaptada */}
          <ScrollArea className="h-[60vh] border rounded-lg">
            <div className="p-4 space-y-6">
              {adaptedHeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p>Preencha a inteligência e clique em "Gerar adaptações"</p>
                  <p className="text-sm mt-1">
                    As headlines adaptadas aparecerão aqui
                  </p>
                </div>
              ) : (
                adaptedHeadlines.map((item, index) => (
                  <div
                    key={index}
                    className={`border-b pb-4 last:border-b-0 cursor-pointer transition-colors ${
                      selectedIndices.has(index) ? "bg-primary/5" : ""
                    }`}
                    onClick={() => toggleSelection(index)}
                  >
                    {/* Header com checkbox */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedIndices.has(index)}
                          onCheckedChange={() => toggleSelection(index)}
                        />
                        <p className="font-poppins italic text-sm text-muted-foreground">
                          Headline Original
                        </p>
                      </div>
                    </div>

                    {/* Headline original */}
                    <p className="font-semibold text-sm mb-4 pl-6">
                      {item.original}
                    </p>

                    {/* Headline adaptada */}
                    <div className="pl-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-poppins italic text-sm text-green-600">
                          Headline adaptada
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.adaptada, index);
                          }}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-green-700 dark:text-green-400 font-medium">
                        {item.adaptada}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Coluna 3: Ações */}
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleGenerateMore}
              disabled={generateMutation.isPending || remainingHeadlines <= 0}
              className="font-poppins"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Gerar mais 50 ideias
            </Button>
            
            {remainingHeadlines > 0 && adaptedHeadlines.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {remainingHeadlines} restantes
              </p>
            )}

            <div className="flex-1" />

            {adaptedHeadlines.length > 0 && (
              <Button
                onClick={handleUseSelected}
                disabled={selectedIndices.size === 0}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Usar {selectedIndices.size > 0 && `(${selectedIndices.size})`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
