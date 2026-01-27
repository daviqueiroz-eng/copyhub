import { useState } from "react";
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
import { Plus, Settings, Check, Loader2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
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
  
  // Loading da geração de insumos
  const [isGeneratingInsumos, setIsGeneratingInsumos] = useState(false);
  
  const [selectedTipos, setSelectedTipos] = useState<Record<string, string>>({});
  const [novoTipo, setNovoTipo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [tipoParaConfigurar, setTipoParaConfigurar] = useState<TipoRoteiro | null>(null);
  
  // Estados para seleção múltipla
  const [selectedHeadlines, setSelectedHeadlines] = useState<Set<string>>(new Set());
  const [bulkTipoId, setBulkTipoId] = useState<string>("");

  const { data: tipos = [] } = useTiposRoteiro();
  const createTipo = useCreateTipoRoteiro();

  // Gerar insumos via Edge Function
  const handleGenerateInsumos = async () => {
    setIsGeneratingInsumos(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-insumos", {
        body: {
          mentorado: mentoradoData,
          headlines: headlines.map(h => ({ key: h.key, headline: h.headline }))
        }
      });
      
      if (error) throw error;
      
      const newInsumos: Record<string, string> = {};
      if (data?.insumos) {
        data.insumos.forEach((item: { key: string; insumo: string }) => {
          newInsumos[item.key] = item.insumo;
        });
      }
      setInsumos(newInsumos);
      
      toast({
        title: "Insumos gerados!",
        description: `${Object.keys(newInsumos).length} insumos extraídos com sucesso.`,
      });
    } catch (err) {
      console.error("Erro ao gerar insumos:", err);
      toast({
        title: "Erro ao gerar insumos",
        description: "Não foi possível gerar os insumos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsumos(false);
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
    }
    onOpenChange(newOpen);
  };

  const isAllSelected = selectedHeadlines.size === headlines.length && headlines.length > 0;
  const isSomeSelected = selectedHeadlines.size > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerar Roteiro</DialogTitle>
          </DialogHeader>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* COLUNA 1 - Extração de Insumos */}
            <div className={cn(
              "flex-1 flex flex-col border-r pr-6 transition-opacity duration-300",
              currentStep === 2 && "opacity-50 pointer-events-none"
            )}>
              <h3 className="font-medium text-lg mb-4">1: extração do conteúdo notável</h3>
              
              <ScrollArea className="flex-1 max-h-[400px]">
                <div className="space-y-4 pr-4">
                  {headlines.map((headline, index) => (
                    <div key={headline.key} className="border rounded-lg p-4">
                      <span className="text-xs text-muted-foreground font-medium">
                        HEADLINE {index + 1}:
                      </span>
                      <p className="text-sm font-medium mt-1 line-clamp-2">
                        {headline.headline || "(sem headline)"}
                      </p>
                      
                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground">Insumo</Label>
                        <Textarea
                          value={insumos[headline.key] || ""}
                          onChange={(e) => handleInsumoChange(headline.key, e.target.value)}
                          placeholder="1: ideia ou referência...&#10;2: fato interessante...&#10;3: dado estatístico..."
                          className="mt-1 min-h-[80px] text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex justify-between pt-4 border-t mt-4">
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
            
            {/* COLUNA 2 - Seleção de Tipos */}
            <div className={cn(
              "flex-1 flex flex-col transition-opacity duration-300",
              currentStep === 1 && "opacity-50 pointer-events-none"
            )}>
              <h3 className="font-medium text-lg mb-4">2: Selecionar estilo do roteiro</h3>

              {/* Barra de ações em massa */}
              <div className="flex items-center gap-3 py-3 border-b flex-wrap">
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

              <ScrollArea className="flex-1 max-h-[320px]">
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

              <div className="border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
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
