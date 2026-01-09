import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { RefreshCw, Check, Loader2, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalysisHeadlines, AnalysisHeadline } from "@/hooks/useAnalysisHeadlines";
import { useUserHeadlinesExcel } from "@/hooks/useUserHeadlinesExcel";
import { ExcelUploadDialog } from "./ExcelUploadDialog";

interface HeadlinesRandomDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectMultiple: (headlines: string[]) => void;
  savedHeadlines: AnalysisHeadline[];
  onSaveHeadlines: (headlines: AnalysisHeadline[]) => void;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const HeadlinesRandomDialog = ({
  open,
  onClose,
  onSelectMultiple,
  savedHeadlines,
  onSaveHeadlines,
}: HeadlinesRandomDialogProps) => {
  const { data: analysisHeadlines = [], isLoading: isLoadingAnalysis } = useAnalysisHeadlines();
  const { data: excelHeadlines = [], isLoading: isLoadingExcel } = useUserHeadlinesExcel();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [useExcelSource, setUseExcelSource] = useState(() => {
    const saved = localStorage.getItem("headlines-source-preference");
    return saved === "excel";
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNicho, setSelectedNicho] = useState<string | null>(null);
  
  const countRef = useRef(9);

  // Salvar preferência
  useEffect(() => {
    localStorage.setItem("headlines-source-preference", useExcelSource ? "excel" : "analysis");
  }, [useExcelSource]);

  // Converter Excel headlines para o formato esperado (incluindo arquivo_origem para filtro)
  const excelHeadlinesFormatted: (AnalysisHeadline & { arquivo_origem?: string })[] = excelHeadlines.map((h) => ({
    id: h.id,
    headline: h.headline,
    estrutura: h.estrutura || "",
    arquivo_origem: h.arquivo_origem || undefined,
  }));

  // Extrair nichos únicos das headlines do Excel
  const availableNichos = useMemo(() => {
    if (!useExcelSource) return [];
    
    const nichos = new Set<string>();
    excelHeadlines.forEach(h => {
      if (h.arquivo_origem) {
        // Extrair nicho do arquivo_origem (ex: "Arquivo.xlsx - Cristão" => "Cristão")
        const parts = h.arquivo_origem.split(" - ");
        if (parts.length > 1) {
          nichos.add(parts.slice(1).join(" - "));
        }
      }
    });
    
    return Array.from(nichos).sort();
  }, [excelHeadlines, useExcelSource]);

  // Usar headlines baseado no toggle
  const allHeadlines = useExcelSource ? excelHeadlinesFormatted : analysisHeadlines;
  const isLoading = useExcelSource ? isLoadingExcel : isLoadingAnalysis;

  // Toggle seleção
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Gerar headlines aleatórias
  const generateRandomHeadlines = useCallback(() => {
    if (allHeadlines.length === 0) return;
    const shuffled = shuffleArray(allHeadlines);
    const newHeadlines = shuffled.slice(0, countRef.current);
    onSaveHeadlines(newHeadlines);
    setSelectedIds(new Set());
  }, [allHeadlines, onSaveHeadlines]);

  // Gerar pela primeira vez se não houver headlines salvas ou ao trocar fonte
  useEffect(() => {
    if (open && allHeadlines.length > 0 && savedHeadlines.length === 0) {
      generateRandomHeadlines();
    }
  }, [open, allHeadlines.length, savedHeadlines.length, generateRandomHeadlines]);

  // Limpar seleção ao fechar
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  // Regerar ao trocar fonte
  const handleSourceChange = (checked: boolean) => {
    setUseExcelSource(checked);
    setSearchTerm("");
    setSelectedNicho(null);
    onSaveHeadlines([]);
  };

  // Filtrar headlines baseado na busca e nicho
  const filteredHeadlines = useMemo(() => {
    let filtered = savedHeadlines;
    
    // Filtro de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h => 
        h.headline.toLowerCase().includes(term)
      );
    }
    
    // Filtro de nicho (apenas para Excel)
    if (useExcelSource && selectedNicho) {
      const headlineIdsInNicho = new Set(
        excelHeadlinesFormatted
          .filter(h => h.arquivo_origem?.includes(` - ${selectedNicho}`))
          .map(h => h.id)
      );
      filtered = filtered.filter(h => headlineIdsInNicho.has(h.id));
    }
    
    return filtered;
  }, [savedHeadlines, searchTerm, selectedNicho, useExcelSource, excelHeadlinesFormatted]);

  const handleGenerateNew = () => {
    generateRandomHeadlines();
  };

  const handleUse = () => {
    const selected = savedHeadlines
      .filter(h => selectedIds.has(h.id))
      .map(h => h.headline);
    if (selected.length > 0) {
      onSelectMultiple(selected);
      onClose();
    }
  };

  const hasHeadlines = savedHeadlines.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-xl font-bold font-poppins">
                Headlines {useExcelSource ? "dos Excels" : "das Análises"}
              </DialogTitle>
              
              <div className="flex items-center gap-3">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar headline..."
                    className="pl-8 w-44 h-8"
                  />
                </div>

                {/* Filtro de nicho (apenas para Excel) */}
                {useExcelSource && availableNichos.length > 0 && (
                  <Select
                    value={selectedNicho || "all"}
                    onValueChange={(v) => setSelectedNicho(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Todos os nichos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os nichos</SelectItem>
                      {availableNichos.map(nicho => (
                        <SelectItem key={nicho} value={nicho}>
                          {nicho}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Toggle de fonte */}
                <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
                  <Label className="text-xs text-muted-foreground">Análises</Label>
                  <Switch
                    checked={useExcelSource}
                    onCheckedChange={handleSourceChange}
                  />
                  <Label className="text-xs text-muted-foreground">Excels</Label>
                </div>

                {/* Botão upload Excel */}
                {useExcelSource && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Excel
                  </Button>
                )}

                {hasHeadlines && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleGenerateNew}
                      disabled={isLoading || allHeadlines.length === 0}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Gerar novas
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={handleUse}
                      disabled={selectedIds.size === 0}
                    >
                      <Check className="h-4 w-4" />
                      Usar {selectedIds.size > 0 && `(${selectedIds.size})`}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : allHeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {useExcelSource ? (
                <>
                  <p className="text-muted-foreground">
                    Você ainda não importou nenhum Excel com headlines.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Upload Excel" para importar.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Excel
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Você ainda não completou nenhuma análise de roteiro.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete análises para ter headlines disponíveis aqui.
                  </p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredHeadlines.map((item) => (
                  <div
                    key={item.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                      selectedIds.has(item.id)
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "bg-card"
                    }`}
                    onClick={() => toggleSelection(item.id)}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 right-3">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                      />
                    </div>

                    {/* Headline */}
                    <h3 className="font-semibold text-sm pr-8 line-clamp-3 mb-3">
                      {item.headline}
                    </h3>

                    {/* Estrutura */}
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Retire a estrutura da headline
                      </p>
                      <p className="text-sm text-foreground">
                        {item.estrutura || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <ExcelUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
      />
    </>
  );
};
