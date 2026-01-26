import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Check, Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

export interface HeadlineParaGerar {
  key: string;
  headline: string;
  estrutura: string;
}

export interface HeadlineComTipo {
  key: string;
  headline: string;
  estrutura: string;
  tipoId: string;
  tipoNome: string;
  tipoConfig: {
    prompt: string | null;
    template_estrutura: string | null;
    config_extra: unknown;
  };
}

export interface WebhookResponse {
  roteiros: Array<{
    key: string;
    estrutura: string;
  }>;
}

interface ProcessResult {
  key: string;
  success: boolean;
  estrutura?: string;
  error?: string;
}

interface ProgressState {
  total: number;
  current: number;
  currentKey: string;
  results: ProcessResult[];
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
  onConfirm: (headlines: HeadlineComTipo[], webhookResponse: WebhookResponse | null) => void;
  onPartialResult?: (key: string, estrutura: string) => void;
}

export const TipoRoteiroDialog = ({
  open,
  onOpenChange,
  headlines,
  mentoradoData,
  onConfirm,
  onPartialResult,
}: TipoRoteiroDialogProps) => {
  const [selectedTipos, setSelectedTipos] = useState<Record<string, string>>({});
  const [novoTipo, setNovoTipo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [tipoParaConfigurar, setTipoParaConfigurar] = useState<TipoRoteiro | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    total: 0,
    current: 0,
    currentKey: "",
    results: [],
  });

  const { data: tipos = [] } = useTiposRoteiro();
  const createTipo = useCreateTipoRoteiro();

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

  const allHeadlinesHaveTipo = headlines.every(h => selectedTipos[h.key]);

  const processQueue = async (queue: HeadlineComTipo[]) => {
    setIsProcessing(true);
    setProgress({ total: queue.length, current: 0, currentKey: "", results: [] });

    const results: ProcessResult[] = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setProgress(prev => ({ ...prev, current: i + 1, currentKey: item.key }));

      try {
        // Enviar 1 roteiro por vez
        const { data, error } = await supabase.functions.invoke("n8n-webhook", {
          body: {
            mentorado: {
              nome: mentoradoData.nome,
              informacoes_mentorado: mentoradoData.informacoes_mentorado,
              apresentacao: mentoradoData.apresentacao,
            },
            roteiros: [{
              key: item.key,
              headline: item.headline,
              estrutura: item.estrutura,
              tipo_roteiro: item.tipoNome,
              tipo_config: item.tipoConfig,
            }],
          },
        });

        if (error) {
          console.error("Erro na Edge Function:", error);
          results.push({ key: item.key, success: false, error: error.message });
        } else if (data?.roteiros?.[0]) {
          const estrutura = data.roteiros[0].estrutura;
          results.push({ key: item.key, success: true, estrutura });
          // Callback parcial para atualizar UI em tempo real
          onPartialResult?.(item.key, estrutura);
        } else {
          results.push({ key: item.key, success: false, error: "Sem resposta do webhook" });
        }
      } catch (err) {
        console.error("Erro ao processar roteiro:", err);
        results.push({ 
          key: item.key, 
          success: false, 
          error: err instanceof Error ? err.message : "Erro desconhecido" 
        });
      }

      setProgress(prev => ({ ...prev, results: [...results] }));
    }

    setIsProcessing(false);

    // Construir resposta final
    const webhookResponse: WebhookResponse = {
      roteiros: results
        .filter(r => r.success && r.estrutura)
        .map(r => ({ key: r.key, estrutura: r.estrutura! })),
    };

    onConfirm(queue, webhookResponse.roteiros.length > 0 ? webhookResponse : null);
  };

  const handleConfirm = async () => {
    const result: HeadlineComTipo[] = headlines.map(headline => {
      const tipoId = selectedTipos[headline.key];
      const tipo = tipos.find(t => t.id === tipoId);
      return {
        ...headline,
        tipoId,
        tipoNome: tipo?.nome || "",
        tipoConfig: {
          prompt: tipo?.prompt || null,
          template_estrutura: tipo?.template_estrutura || null,
          config_extra: tipo?.config_extra || null,
        }
      };
    });

    await processQueue(result);
  };

  const handleOpenConfig = (tipo: TipoRoteiro, e: React.MouseEvent) => {
    e.stopPropagation();
    setTipoParaConfigurar(tipo);
    setShowConfigDialog(true);
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      setSelectedTipos({});
      setNovoTipo("");
      setShowAddForm(false);
      setProgress({ total: 0, current: 0, currentKey: "", results: [] });
    }
    if (!isProcessing) {
      onOpenChange(newOpen);
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const getResultIcon = (key: string) => {
    const result = progress.results.find(r => r.key === key);
    if (!result) {
      if (progress.currentKey === key) {
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      }
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
    if (result.success) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const getResultStatus = (key: string) => {
    const result = progress.results.find(r => r.key === key);
    if (!result) {
      if (progress.currentKey === key) {
        return "Processando...";
      }
      return "Aguardando";
    }
    if (result.success) {
      return "Concluído";
    }
    return result.error || "Erro";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isProcessing ? "Gerando Roteiros" : "Gerar Roteiro"}
            </DialogTitle>
          </DialogHeader>

          {isProcessing ? (
            // UI de progresso durante processamento
            <div className="flex-1 py-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Gerando roteiro {progress.current}/{progress.total}...</span>
                  <span className="text-muted-foreground font-medium">{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>

              <ScrollArea className="flex-1 max-h-[300px]">
                <div className="space-y-2 pr-4">
                  {headlines.map((headline, index) => (
                    <div 
                      key={headline.key} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        progress.currentKey === headline.key 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-muted/30"
                      }`}
                    >
                      {getResultIcon(headline.key)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Roteiro {index + 1}: {headline.headline || "(sem headline)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getResultStatus(headline.key)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  {progress.results.filter(r => r.success).length} de {progress.total} roteiros gerados com sucesso
                </p>
              </div>
            </div>
          ) : (
            // UI de seleção de tipos
            <>
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="py-4 space-y-4">
                  {headlines.map((headline, index) => (
                    <div key={headline.key} className="border rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground font-medium">
                          HEADLINE {index + 1}:
                        </span>
                        <p className="text-sm font-medium mt-1 line-clamp-2">
                          {headline.headline || "(sem headline)"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
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

              <div className="border-t pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo tipo
                  </Button>
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
            </>
          )}
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
