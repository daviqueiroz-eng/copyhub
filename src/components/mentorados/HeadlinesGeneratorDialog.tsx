import { useState, useCallback, useEffect, useMemo } from "react";
import { Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGenerateHeadlines } from "@/hooks/useGenerateHeadlines";
import { useInteligenciaGlobal, useUpdateInteligenciaGlobal } from "@/hooks/useInteligenciaGlobal";
import { useMentorados, useUpdateMentorado } from "@/hooks/useMentorados";
import { useUserRole } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AdaptedHeadline {
  original: string;
  adaptada: string;
}

interface PageData {
  headlines: AdaptedHeadline[];
  termo: string;
}

interface HeadlinesGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  headlines: string[];
  mentoradoId?: string;
  onUseHeadlines: (headlines: string[]) => void;
}

// Fisher-Yates shuffle function
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const HeadlinesGeneratorDialog = ({
  open,
  onClose,
  headlines,
  mentoradoId,
  onUseHeadlines,
}: HeadlinesGeneratorDialogProps) => {
  const [inteligenciaIndividual, setInteligenciaIndividual] = useState("");
  
  // Pagination: array of pages, each page has headlines + termo used
  const [headlinePages, setHeadlinePages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Selection per page: Map<pageIndex, Set<itemIndex>>
  const [selectedByPage, setSelectedByPage] = useState<Map<number, Set<number>>>(new Map());
  
  // Track last used termo for detecting changes
  const [lastUsedTermo, setLastUsedTermo] = useState<string>("");
  
  // Alert dialog for term change options
  const [showTermoChangeDialog, setShowTermoChangeDialog] = useState(false);
  const [pendingTermo, setPendingTermo] = useState<string>("");
  
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

  // Current page headlines and selection
  const currentPageData = headlinePages[currentPage];
  const currentPageHeadlines = currentPageData?.headlines || [];
  const currentPageSelection = selectedByPage.get(currentPage) || new Set<number>();

  // Total selected across all pages
  const totalSelected = useMemo(() => {
    let count = 0;
    selectedByPage.forEach((set) => {
      count += set.size;
    });
    return count;
  }, [selectedByPage]);

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

  // Reset pages when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedByPage(new Map());
      setCurrentPage(0);
    }
  }, [open]);

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

  // Get current termo (individual intelligence)
  const getCurrentTermo = useCallback(() => {
    return inteligenciaIndividual.trim().substring(0, 50) || "Sem termo";
  }, [inteligenciaIndividual]);

  // Execute generation with given termo
  const executeGeneration = useCallback(async (termo: string, addAsNewPage: boolean) => {
    const combinedInteligencia = getCombinedInteligencia();
    
    if (!combinedInteligencia) {
      toast.error("Preencha a inteligência (global ou individual) primeiro");
      return;
    }

    if (headlines.length === 0) {
      toast.error("Nenhuma headline disponível para adaptar");
      return;
    }

    // Randomize and take 50 random headlines
    const shuffledHeadlines = shuffleArray(headlines);
    const headlinesToAdapt = shuffledHeadlines.slice(0, 50);

    try {
      const result = await generateMutation.mutateAsync({
        inteligencia: combinedInteligencia,
        headlines: headlinesToAdapt,
      });
      
      const newPageData: PageData = {
        headlines: result,
        termo: termo,
      };

      if (addAsNewPage && headlinePages.length > 0) {
        // Add as new page
        const newPageIndex = headlinePages.length;
        setHeadlinePages(prev => [...prev, newPageData]);
        setCurrentPage(newPageIndex);
        toast.success(`Guia ${newPageIndex + 1}: ${result.length} headlines adaptadas!`);
      } else {
        // Create first page or reset
        setHeadlinePages([newPageData]);
        setCurrentPage(0);
        setSelectedByPage(new Map());
        toast.success(`${result.length} headlines adaptadas com sucesso!`);
      }
      
      setLastUsedTermo(termo);
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [getCombinedInteligencia, headlines, generateMutation, headlinePages.length]);

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

    const currentTermo = getCurrentTermo();
    
    // If pages exist and termo changed, show options dialog
    if (headlinePages.length > 0 && currentTermo !== lastUsedTermo && lastUsedTermo !== "") {
      setPendingTermo(currentTermo);
      setShowTermoChangeDialog(true);
      return;
    }

    // Generate normally
    await executeGeneration(currentTermo, false);
  }, [getCombinedInteligencia, headlines, getCurrentTermo, headlinePages.length, lastUsedTermo, executeGeneration]);

  const handleGenerateMore = useCallback(async () => {
    const combinedInteligencia = getCombinedInteligencia();
    
    if (!combinedInteligencia) {
      toast.error("Preencha a inteligência primeiro");
      return;
    }

    if (headlines.length === 0) {
      toast.error("Nenhuma headline disponível para adaptar");
      return;
    }

    const currentTermo = getCurrentTermo();
    await executeGeneration(currentTermo, true);
  }, [getCombinedInteligencia, headlines, getCurrentTermo, executeGeneration]);

  // Handle termo change dialog options
  const handleAddNewPage = useCallback(async () => {
    setShowTermoChangeDialog(false);
    await executeGeneration(pendingTermo, true);
  }, [pendingTermo, executeGeneration]);

  const handleRestart = useCallback(async () => {
    setShowTermoChangeDialog(false);
    setHeadlinePages([]);
    setSelectedByPage(new Map());
    setCurrentPage(0);
    await executeGeneration(pendingTermo, false);
  }, [pendingTermo, executeGeneration]);

  // Clear all pages (restart button)
  const handleClearAll = useCallback(() => {
    setHeadlinePages([]);
    setSelectedByPage(new Map());
    setCurrentPage(0);
    setLastUsedTermo("");
    toast.success("Guias limpas!");
  }, []);

  const toggleSelection = useCallback((index: number) => {
    setSelectedByPage(prev => {
      const newMap = new Map(prev);
      const pageSet = new Set(newMap.get(currentPage) || []);
      
      if (pageSet.has(index)) {
        pageSet.delete(index);
      } else {
        pageSet.add(index);
      }
      
      newMap.set(currentPage, pageSet);
      return newMap;
    });
  }, [currentPage]);

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleUseSelected = useCallback(() => {
    const allSelected: string[] = [];
    
    // Collect selected headlines from all pages
    headlinePages.forEach((page, pageIndex) => {
      const pageSelection = selectedByPage.get(pageIndex) || new Set();
      page.headlines.forEach((item, itemIndex) => {
        if (pageSelection.has(itemIndex)) {
          allSelected.push(item.adaptada);
        }
      });
    });
    
    if (allSelected.length > 0) {
      onUseHeadlines(allSelected);
      setSelectedByPage(new Map()); // Apenas limpar seleções, manter headlines
      toast.success(`${allSelected.length} headlines usadas!`);
      // NÃO fechar dialog automaticamente
    } else {
      toast.error("Selecione pelo menos uma headline");
    }
  }, [headlinePages, selectedByPage, onUseHeadlines]);

  const globalContent = isAdmin ? inteligenciaGlobalEdit : inteligenciaGlobal?.conteudo;
  const hasAnyInteligencia = !!(globalContent?.trim() || inteligenciaIndividual.trim());

  return (
    <>
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
            <div className="flex flex-col h-[60vh] border rounded-lg">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {currentPageHeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                      <p>Preencha a inteligência e clique em "Gerar adaptações"</p>
                      <p className="text-sm mt-1">
                        As headlines adaptadas aparecerão aqui
                      </p>
                    </div>
                  ) : (
                    currentPageHeadlines.map((item, index) => (
                      <div
                        key={index}
                        className={`border-b pb-4 last:border-b-0 cursor-pointer transition-colors ${
                          currentPageSelection.has(index) ? "bg-primary/5" : ""
                        }`}
                        onClick={() => toggleSelection(index)}
                      >
                        {/* Header com checkbox */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={currentPageSelection.has(index)}
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

              {/* Pagination footer with termo labels */}
              {headlinePages.length > 0 && (
                <div className="flex items-center justify-center gap-3 py-3 border-t bg-muted/30">
                  {headlinePages.map((page, pageIndex) => (
                    <div key={pageIndex} className="flex flex-col items-center gap-1">
                      <Button
                        variant={currentPage === pageIndex ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageIndex)}
                      >
                        {pageIndex + 1}
                      </Button>
                      <span 
                        className="text-[10px] text-muted-foreground max-w-[60px] truncate text-center"
                        title={page.termo}
                      >
                        {page.termo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna 3: Ações */}
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                onClick={handleGenerateMore}
                disabled={generateMutation.isPending || headlinePages.length === 0}
                className="font-poppins"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar mais 50 ideias
              </Button>
              
              {headlinePages.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    {headlinePages.length} guia{headlinePages.length > 1 ? "s" : ""} gerada{headlinePages.length > 1 ? "s" : ""}
                  </p>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Recomeçar
                  </Button>
                </>
              )}

              <div className="flex-1" />

              {headlinePages.length > 0 && (
                <Button
                  onClick={handleUseSelected}
                  disabled={totalSelected === 0}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Usar {totalSelected > 0 && `(${totalSelected})`}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para mudança de termo */}
      <AlertDialog open={showTermoChangeDialog} onOpenChange={setShowTermoChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termo alterado</AlertDialogTitle>
            <AlertDialogDescription>
              Você alterou a "Inteligência do Mentorado". O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddNewPage}>
              <Sparkles className="h-4 w-4 mr-2" />
              Adicionar nova guia
            </AlertDialogAction>
            <Button onClick={handleRestart} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Recomeçar do zero
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
