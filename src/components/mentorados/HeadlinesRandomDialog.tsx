import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAnalysisHeadlines, AnalysisHeadline } from "@/hooks/useAnalysisHeadlines";

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
  const { data: allHeadlines = [], isLoading } = useAnalysisHeadlines();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const countRef = useRef(9);

  // Gerar headlines aleatórias
  const generateRandomHeadlines = useCallback(() => {
    if (allHeadlines.length === 0) return;
    const shuffled = shuffleArray(allHeadlines);
    const newHeadlines = shuffled.slice(0, countRef.current);
    onSaveHeadlines(newHeadlines);
    setSelectedId(null);
  }, [allHeadlines, onSaveHeadlines]);

  // Gerar pela primeira vez se não houver headlines salvas
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold font-poppins">
              Headlines das Análises
            </DialogTitle>
            {hasHeadlines && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleGenerateNew}
                  disabled={isLoading || allHeadlines.length === 0}
                >
                  <RefreshCw className="h-4 w-4" />
                  Gerar novas headlines
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
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : allHeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Você ainda não completou nenhuma análise de roteiro.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete análises para ter headlines disponíveis aqui.
            </p>
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
  );
};
