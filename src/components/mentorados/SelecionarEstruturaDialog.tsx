import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Settings, Copy, ArrowLeft } from "lucide-react";
import { useTiposRoteiro, useCreateTipoRoteiro, TipoRoteiro } from "@/hooks/useTiposRoteiro";
import { TipoRoteiroConfigDialog } from "./TipoRoteiroConfigDialog";
import { toast } from "@/hooks/use-toast";

interface SelecionarEstruturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headlines: { key: string; headline: string; estrutura: string }[];
}

export const SelecionarEstruturaDialog = ({
  open,
  onOpenChange,
  headlines,
}: SelecionarEstruturaDialogProps) => {
  // Estados locais
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedTipos, setSelectedTipos] = useState<Record<string, string>>({});
  const [showNewTipoInput, setShowNewTipoInput] = useState(false);
  const [newTipoNome, setNewTipoNome] = useState("");
  const [configTipo, setConfigTipo] = useState<TipoRoteiro | null>(null);
  
  // Hooks
  const { data: tipos = [] } = useTiposRoteiro();
  const createTipo = useCreateTipoRoteiro();
  
  // Contagem de headlines com tipo selecionado
  const headlinesComTipo = useMemo(() => {
    return headlines.filter(h => selectedTipos[h.key]);
  }, [headlines, selectedTipos]);
  
  // Toggle seleção individual
  const toggleSelection = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  
  // Selecionar/desmarcar todas
  const toggleSelectAll = () => {
    if (selectedKeys.size === headlines.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(headlines.map((h) => h.key)));
    }
  };
  
  // Aplicar tipo em massa para selecionadas
  const applyBulkTipo = (tipoId: string) => {
    if (selectedKeys.size === 0) {
      toast({
        title: "Nenhuma selecionada",
        description: "Selecione pelo menos uma headline para aplicar o tipo.",
        variant: "destructive",
      });
      return;
    }
    
    const updated = { ...selectedTipos };
    selectedKeys.forEach((key) => {
      updated[key] = tipoId;
    });
    setSelectedTipos(updated);
    setSelectedKeys(new Set());
    
    toast({
      title: "Tipo aplicado",
      description: `Tipo aplicado a ${selectedKeys.size} headlines.`,
    });
  };
  
  // Criar novo tipo
  const handleCreateTipo = () => {
    if (!newTipoNome.trim()) return;
    
    createTipo.mutate(
      { nome: newTipoNome.trim() },
      {
        onSuccess: () => {
          toast({ title: "Tipo criado com sucesso!" });
          setNewTipoNome("");
          setShowNewTipoInput(false);
        },
        onError: () => {
          toast({
            title: "Erro ao criar tipo",
            variant: "destructive",
          });
        },
      }
    );
  };
  
  // Copiar formatado
  const handleCopy = () => {
    if (headlinesComTipo.length === 0) {
      toast({
        title: "Nenhum tipo selecionado",
        description: "Selecione um tipo de estrutura para pelo menos uma headline.",
        variant: "destructive",
      });
      return;
    }
    
    const textParts: string[] = [];
    
    headlinesComTipo.forEach((headline, index) => {
      const numero = index + 1;
      const tipoId = selectedTipos[headline.key];
      const tipo = tipos.find((t) => t.id === tipoId);
      
      textParts.push(`Headline ${numero}: ${headline.headline}`);
      textParts.push("");
      textParts.push("Estrutura");
      textParts.push(tipo?.template_estrutura || "(sem estrutura definida)");
      textParts.push("");
    });
    
    const finalText = textParts.join("\n");
    navigator.clipboard.writeText(finalText);
    
    toast({
      title: "Copiado!",
      description: `${headlinesComTipo.length} headlines copiadas com suas estruturas.`,
    });
    
    onOpenChange(false);
  };
  
  // Reset ao fechar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedKeys(new Set());
      setSelectedTipos({});
      setShowNewTipoInput(false);
      setNewTipoNome("");
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar estrutura</DialogTitle>
          </DialogHeader>
          
          {/* Barra de ação em massa */}
          {selectedKeys.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedKeys.size} selecionada(s)
              </span>
              <Select onValueChange={applyBulkTipo}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Aplicar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Checkbox selecionar todas */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selectedKeys.size === headlines.length && headlines.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Selecionar todas ({headlines.length})
            </span>
          </div>
          
          {/* Lista de headlines */}
          <ScrollArea className="flex-1 max-h-[400px]">
            <div className="space-y-3 pr-4">
              {headlines.map((item, index) => {
                const isSelected = selectedKeys.has(item.key);
                const tipoId = selectedTipos[item.key];
                const tipo = tipos.find((t) => t.id === tipoId);
                
                return (
                  <div
                    key={item.key}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(item.key)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#B8860B]">
                          HEADLINE {index + 1}:
                        </p>
                        <p className="text-sm mt-1 line-clamp-2">{item.headline || "(vazio)"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-7">
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <Select
                        value={tipoId || ""}
                        onValueChange={(value) =>
                          setSelectedTipos((prev) => ({ ...prev, [item.key]: value }))
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipos.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {tipo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setConfigTipo(tipo)}
                          title="Configurar tipo"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          {/* Criar novo tipo */}
          {showNewTipoInput ? (
            <div className="flex items-center gap-2">
              <Input
                value={newTipoNome}
                onChange={(e) => setNewTipoNome(e.target.value)}
                placeholder="Nome do novo tipo..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTipo();
                  if (e.key === "Escape") {
                    setShowNewTipoInput(false);
                    setNewTipoNome("");
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleCreateTipo} disabled={createTipo.isPending}>
                Criar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNewTipoInput(false);
                  setNewTipoNome("");
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setShowNewTipoInput(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo tipo
            </Button>
          )}
          
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCopy} disabled={headlinesComTipo.length === 0}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar ({headlinesComTipo.length})
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de configuração de tipo */}
      <TipoRoteiroConfigDialog
        open={!!configTipo}
        onOpenChange={(open) => !open && setConfigTipo(null)}
        tipo={configTipo}
      />
    </>
  );
};
