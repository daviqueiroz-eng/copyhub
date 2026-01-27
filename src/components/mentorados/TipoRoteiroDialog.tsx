import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Check, Loader2, ArrowRight, ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTiposRoteiro,
  useCreateTipoRoteiro,
  TipoRoteiro,
} from "@/hooks/useTiposRoteiro";
import { TipoRoteiroConfigDialog } from "./TipoRoteiroConfigDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface HeadlineParaGerar {
  key: string;
  headline: string;
  estrutura: string;
}

export interface HeadlineComTipo {
  key: string;
  headline: string;
  estrutura: string;
  insumo: string;
  tipoId: string;
  tipoNome: string;
  tipoConfig: {
    prompt: string | null;
    template_estrutura: string | null;
    config_extra: unknown;
  };
}

interface TipoRoteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headlines: HeadlineParaGerar[];
  mentoradoData: {
    nome: string;
    informacoes_mentorado: string | null;
    apresentacao: string | null;
  };
  onStartBulkGeneration: (headlines: HeadlineComTipo[]) => void;
}

export const TipoRoteiroDialog = ({
  open,
  onOpenChange,
  headlines,
  mentoradoData,
  onStartBulkGeneration,
}: TipoRoteiroDialogProps) => {
  // Etapa atual (1 = insumos, 2 = tipos)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  // Insumos por headline (editáveis)
  const [insumos, setInsumos] = useState<Record<string, string>>({});
  
  // Loading da geração de insumos (geral e individual)
  const [isGeneratingInsumos, setIsGeneratingInsumos] = useState(false);
  const [loadingInsumoKeys, setLoadingInsumoKeys] = useState<Set<string>>(new Set());
  
  const [selectedTipos, setSelectedTipos] = useState<Record<string, string>>({});
  const [novoTipo, setNovoTipo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [tipoParaConfigurar, setTipoParaConfigurar] = useState<TipoRoteiro | null>(null);
  
  // Estados para seleção múltipla
  const [selectedHeadlines, setSelectedHeadlines] = useState<Set<string>>(new Set());
  const [bulkTipoId, setBulkTipoId] = useState<string>("");

  // Refs para textareas com altura dinâmica
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const { data: tipos = [] } = useTiposRoteiro();
  const createTipo = useCreateTipoRoteiro();

  // Ajustar altura do textarea baseado no conteúdo
  const adjustTextareaHeight = (key: string) => {
    const textarea = textareaRefs.current[key];
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
    }
  };

  // Ajustar alturas quando insumos mudam
  useEffect(() => {
    Object.keys(insumos).forEach(key => {
      adjustTextareaHeight(key);
    });
  }, [insumos]);

  // Gerar insumos um por um via n8n webhook
  const handleGenerateInsumos = async () => {
    setIsGeneratingInsumos(true);
    
    for (const headline of headlines) {
      setLoadingInsumoKeys(prev => new Set(prev).add(headline.key));
      
      try {
        const { data, error } = await supabase.functions.invoke("n8n-insumo", {
          body: {
            mentorado: mentoradoData,
            headline: { key: headline.key, headline: headline.headline }
          }
        });
        
        if (error) throw error;
        
        if (data?.insumo) {
          setInsumos(prev => ({ ...prev, [headline.key]: data.insumo }));
        }
      } catch (err) {
        console.error(`Erro ao gerar insumo para ${headline.key}:`, err);
      } finally {
        setLoadingInsumoKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(headline.key);
          return newSet;
        });
      }
    }
    
    setIsGeneratingInsumos(false);
    
    toast({
      title: "Insumos gerados!",
      description: `Insumos processados para ${headlines.length} headlines.`,
    });
  };

  // Reprocessar um insumo específico
  const handleReprocessInsumo = async (headline: HeadlineParaGerar) => {
    setLoadingInsumoKeys(prev => new Set(prev).add(headline.key));
    
    try {
      const { data, error } = await supabase.functions.invoke("n8n-insumo", {
        body: {
          mentorado: mentoradoData,
          headline: { key: headline.key, headline: headline.headline }
        }
      });
      
      if (error) throw error;
      
      if (data?.insumo) {
        setInsumos(prev => ({ ...prev, [headline.key]: data.insumo }));
      }
      
      toast({
        title: "Insumo reprocessado!",
      });
    } catch (err) {
      console.error(`Erro ao reprocessar insumo para ${headline.key}:`, err);
      toast({
        title: "Erro ao reprocessar",
        description: "Não foi possível reprocessar o insumo.",
        variant: "destructive",
      });
    } finally {
      setLoadingInsumoKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(headline.key);
        return newSet;
      });
    }
  };

  // Editar insumo individual
  const handleInsumoChange = (key: string, value: string) => {
    setInsumos(prev => ({ ...prev, [key]: value }));
  };

  const handleAddTipo = () => {
    if (!novoTipo.trim()) return;
    createTipo.mutate({ nome: novoTipo.trim() });
    setNovoTipo("");
    setShowAddForm(false);
  };

  const handleSelectTipo = (headlineKey: string, tipoId: string) => {
    setSelectedTipos(prev => ({
      ...prev,
      [headlineKey]: tipoId
    }));
  };

  // Toggle seleção de uma headline
  const toggleHeadlineSelection = (key: string) => {
    setSelectedHeadlines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Selecionar todas
  const selectAllHeadlines = () => {
    if (selectedHeadlines.size === headlines.length) {
      setSelectedHeadlines(new Set());
    } else {
      setSelectedHeadlines(new Set(headlines.map(h => h.key)));
    }
  };

  // Aplicar tipo às selecionadas
  const applyBulkTipo = () => {
    if (!bulkTipoId) return;
    
    setSelectedTipos(prev => {
      const newTipos = { ...prev };
      selectedHeadlines.forEach(key => {
        newTipos[key] = bulkTipoId;
      });
      return newTipos;
    });
    
    // Limpar seleção após aplicar
    setSelectedHeadlines(new Set());
    setBulkTipoId("");
  };

  const allHeadlinesHaveTipo = headlines.every(h => selectedTipos[h.key]);

  const handleConfirm = () => {
    const result: HeadlineComTipo[] = headlines.map(headline => {
      const tipoId = selectedTipos[headline.key];
      const tipo = tipos.find(t => t.id === tipoId);
      return {
        ...headline,
        insumo: insumos[headline.key] || "",
        tipoId,
        tipoNome: tipo?.nome || "",
        tipoConfig: {
          prompt: tipo?.prompt || null,
          template_estrutura: tipo?.template_estrutura || null,
          config_extra: tipo?.config_extra || null,
        }
      };
    });

    // Fechar dialog imediatamente e iniciar processamento externo
    onOpenChange(false);
    onStartBulkGeneration(result);
  };

  const handleOpenConfig = (tipo: TipoRoteiro, e: React.MouseEvent) => {
    e.stopPropagation();
    setTipoParaConfigurar(tipo);
    setShowConfigDialog(true);
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTipos({});
      setNovoTipo("");
      setShowAddForm(false);
      setSelectedHeadlines(new Set());
      setBulkTipoId("");
      setCurrentStep(1);
      setInsumos({});
      setIsGeneratingInsumos(false);
      setLoadingInsumoKeys(new Set());
    }
    onOpenChange(newOpen);
  };

  const isAllSelected = selectedHeadlines.size === headlines.length && headlines.length > 0;
  const isSomeSelected = selectedHeadlines.size > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerar Roteiro</DialogTitle>
          </DialogHeader>

          {/* Indicadores de etapa */}
          <div className="flex items-center gap-4 pb-4 border-b shrink-0">
            <button 
              onClick={() => setCurrentStep(1)}
              className={cn(
                "flex items-center gap-2 transition-opacity",
                currentStep === 1 ? "" : "opacity-50 hover:opacity-75"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 1 
                  ? "bg-primary text-primary-foreground" 
                  : "border border-border"
              )}>
                1
              </div>
              <span className={currentStep === 1 ? "font-medium" : ""}>
                extração do conteúdo notável
              </span>
            </button>
            <div className="h-px flex-1 bg-border" />
            <button 
              onClick={() => setCurrentStep(2)}
              className={cn(
                "flex items-center gap-2 transition-opacity",
                currentStep === 2 ? "" : "opacity-50 hover:opacity-75"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 2 
                  ? "bg-primary text-primary-foreground" 
                  : "border border-border"
              )}>
                2
              </div>
              <span className={currentStep === 2 ? "font-medium" : ""}>
                Selecionar estilo
              </span>
            </button>
          </div>

          {/* Container das duas colunas lado a lado */}
          <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
            
            {/* COLUNA 1 - Extração de Insumos */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
              currentStep === 2 && "opacity-50 pointer-events-none"
            )}>
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4 py-2">
                  {headlines.map((headline, index) => (
                    <div key={headline.key} className="border rounded-lg p-4">
                      <span className="text-xs text-muted-foreground font-medium">
                        HEADLINE {index + 1}:
                      </span>
                      <p className="text-sm font-medium mt-1 line-clamp-2">
                        {headline.headline || "(sem headline)"}
                      </p>
                      
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs text-muted-foreground">Insumo</Label>
                          {insumos[headline.key] && !loadingInsumoKeys.has(headline.key) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReprocessInsumo(headline)}
                              className="h-6 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reprocessar
                            </Button>
                          )}
                        </div>
                        
                        {loadingInsumoKeys.has(headline.key) ? (
                          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Gerando insumo...</span>
                          </div>
                        ) : (
                          <Textarea
                            ref={(el) => { textareaRefs.current[headline.key] = el; }}
                            value={insumos[headline.key] || ""}
                            onChange={(e) => {
                              handleInsumoChange(headline.key, e.target.value);
                              adjustTextareaHeight(headline.key);
                            }}
                            placeholder="1: ideia ou referência...&#10;2: fato interessante...&#10;3: dado estatístico..."
                            className="text-sm resize-none overflow-hidden"
                            style={{ minHeight: '80px' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex justify-between pt-4 border-t mt-2 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateInsumos} 
                  disabled={isGeneratingInsumos}
                >
                  {isGeneratingInsumos ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Gerar Insumos
                </Button>
                <Button onClick={() => setCurrentStep(2)}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Divisor vertical */}
            <div className="w-px bg-border shrink-0" />

            {/* COLUNA 2 - Seleção de Tipos */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
              currentStep === 1 && "opacity-50 pointer-events-none"
            )}>
              {/* Barra de ações em massa */}
              <div className="flex items-center gap-3 py-3 border-b flex-wrap shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-tipos"
                    checked={isAllSelected}
                    onCheckedChange={selectAllHeadlines}
                  />
                  <Label htmlFor="select-all-tipos" className="text-sm cursor-pointer">
                    Selecionar todas
                  </Label>
                </div>
                
                {isSomeSelected && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {selectedHeadlines.size} selecionada{selectedHeadlines.size > 1 ? 's' : ''}
                      </span>
                      <Select value={bulkTipoId} onValueChange={setBulkTipoId}>
                        <SelectTrigger className="h-8 w-[160px]">
                          <SelectValue placeholder="Tipo para aplicar" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipos.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id}>
                              <span className="flex items-center gap-2">
                                {tipo.nome}
                                {tipo.prompt && (
                                  <Check className="h-3 w-3 text-primary" />
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        onClick={applyBulkTipo}
                        disabled={!bulkTipoId}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="py-4 space-y-4 pr-4">
                  {headlines.map((headline, index) => (
                    <div key={headline.key} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedHeadlines.has(headline.key)}
                          onCheckedChange={() => toggleHeadlineSelection(headline.key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground font-medium">
                            HEADLINE {index + 1}:
                          </span>
                          <p className="text-sm font-medium mt-1 line-clamp-2">
                            {headline.headline || "(sem headline)"}
                          </p>
                          {insumos[headline.key] && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              📝 Insumo: {insumos[headline.key].split('\n')[0]}...
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pl-7">
                        <Label className="text-xs shrink-0">Tipo:</Label>
                        <Select
                          value={selectedTipos[headline.key] || ""}
                          onValueChange={(value) => handleSelectTipo(headline.key, value)}
                        >
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue placeholder="Selecionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tipos.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                <span className="flex items-center gap-2">
                                  {tipo.nome}
                                  {tipo.prompt && (
                                    <Check className="h-3 w-3 text-primary" />
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedTipos[headline.key] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              const tipo = tipos.find(t => t.id === selectedTipos[headline.key]);
                              if (tipo) handleOpenConfig(tipo, e);
                            }}
                            title="Configurar tipo"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {tipos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum tipo cadastrado. Adicione um tipo abaixo.
                    </p>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2 shrink-0">
                {showAddForm ? (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input
                      placeholder="Nome do tipo..."
                      value={novoTipo}
                      onChange={(e) => setNovoTipo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
                      autoFocus
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddTipo}>
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddForm(false);
                        setNovoTipo("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo tipo
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirm} disabled={!allHeadlinesHaveTipo}>
                    Gerar ({headlines.length})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TipoRoteiroConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        tipo={tipoParaConfigurar}
      />
    </>
  );
};
