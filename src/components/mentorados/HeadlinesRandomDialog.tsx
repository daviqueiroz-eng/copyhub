import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnalysisHeadlines, AnalysisHeadline } from "@/hooks/useAnalysisHeadlines";
import { useUserHeadlinesExcel } from "@/hooks/useUserHeadlinesExcel";
import { ExcelUploadDialog } from "./ExcelUploadDialog";

interface HeadlinesRandomDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (headline: string) => void;
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
  onSelect,
  savedHeadlines,
  onSaveHeadlines,
}: HeadlinesRandomDialogProps) => {
  const { data: analysisHeadlines = [], isLoading: isLoadingAnalysis } = useAnalysisHeadlines();
  const { data: excelHeadlines = [], isLoading: isLoadingExcel } = useUserHeadlinesExcel();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useExcelSource, setUseExcelSource] = useState(() => {
    const saved = localStorage.getItem("headlines-source-preference");
    return saved === "excel";
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  const countRef = useRef(9);

  // Salvar preferência
  useEffect(() => {
    localStorage.setItem("headlines-source-preference", useExcelSource ? "excel" : "analysis");
  }, [useExcelSource]);

  // Converter Excel headlines para o formato esperado
  const excelHeadlinesFormatted: AnalysisHeadline[] = excelHeadlines.map((h) => ({
    id: h.id,
    headline: h.headline,
    estrutura: h.estrutura || "",
  }));

  // Usar headlines baseado no toggle
  const allHeadlines = useExcelSource ? excelHeadlinesFormatted : analysisHeadlines;
  const isLoading = useExcelSource ? isLoadingExcel : isLoadingAnalysis;

  // Gerar headlines aleatórias
  const generateRandomHeadlines = useCallback(() => {
    if (allHeadlines.length === 0) return;
    const shuffled = shuffleArray(allHeadlines);
    const newHeadlines = shuffled.slice(0, countRef.current);
    onSaveHeadlines(newHeadlines);
    setSelectedId(null);
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
      setSelectedId(null);
    }
  }, [open]);

  // Regerar ao trocar fonte
  const handleSourceChange = (checked: boolean) => {
    setUseExcelSource(checked);
    onSaveHeadlines([]);
  };

  const handleGenerateNew = () => {
    generateRandomHeadlines();
  };

  const handleUse = () => {
    const selected = savedHeadlines.find((h) => h.id === selectedId);
    if (selected && selected.estrutura) {
      onSelect(selected.estrutura);
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
                      disabled={!selectedId}
                    >
                      <Check className="h-4 w-4" />
                      Usar
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
                {savedHeadlines.map((item) => (
                  <div
                    key={item.id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                      selectedId === item.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "bg-card"
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 right-3">
                      <Checkbox
                        checked={selectedId === item.id}
                        onCheckedChange={() => setSelectedId(item.id)}
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
