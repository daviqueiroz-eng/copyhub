import { useState, useCallback } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateHeadlines } from "@/hooks/useGenerateHeadlines";
import { toast } from "sonner";

interface AdaptedHeadline {
  original: string;
  adaptada: string;
}

interface HeadlinesGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  headlines: string[];
  onUseHeadlines: (headlines: string[]) => void;
}

export const HeadlinesGeneratorDialog = ({
  open,
  onClose,
  headlines,
  onUseHeadlines,
}: HeadlinesGeneratorDialogProps) => {
  const [inteligencia, setInteligencia] = useState("");
  const [adaptedHeadlines, setAdaptedHeadlines] = useState<AdaptedHeadline[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateMutation = useGenerateHeadlines();

  const handleGenerate = useCallback(async () => {
    if (!inteligencia.trim()) {
      toast.error("Preencha a inteligência primeiro");
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
        inteligencia,
        headlines: headlinesToAdapt,
      });
      setAdaptedHeadlines(result);
      setSelectedIndices(new Set());
      toast.success(`${result.length} headlines adaptadas com sucesso!`);
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [inteligencia, headlines, generateMutation]);

  const handleGenerateMore = useCallback(async () => {
    if (!inteligencia.trim()) {
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
        inteligencia,
        headlines: headlinesToAdapt,
      });
      setAdaptedHeadlines((prev) => [...prev, ...result]);
      toast.success(`Mais ${result.length} headlines adaptadas!`);
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [inteligencia, headlines, adaptedHeadlines.length, generateMutation]);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-poppins flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gere para mim
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[280px_1fr_180px] gap-6 flex-1 min-h-0">
          {/* Coluna 1: Inteligência */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-poppins italic text-lg text-muted-foreground mb-2">
                Inteligência
              </h3>
              <Textarea
                placeholder="Descreva o nicho, público-alvo, produto, tom de voz..."
                value={inteligencia}
                onChange={(e) => setInteligencia(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !inteligencia.trim()}
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
