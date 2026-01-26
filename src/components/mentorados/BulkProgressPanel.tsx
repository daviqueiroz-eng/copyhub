import { X, Minus, CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface BulkProgressResult {
  key: string;
  success: boolean;
  error?: string;
}

export interface BulkProgressState {
  isProcessing: boolean;
  total: number;
  current: number;
  currentKey: string;
  results: BulkProgressResult[];
}

interface BulkProgressPanelProps {
  progress: BulkProgressState;
  headlines: Array<{ key: string; headline: string }>;
  onClose: () => void;
}

export const BulkProgressPanel = ({
  progress,
  headlines,
  onClose,
}: BulkProgressPanelProps) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const getResultIcon = (key: string) => {
    const result = progress.results.find((r) => r.key === key);
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
    const result = progress.results.find((r) => r.key === key);
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

  const successCount = progress.results.filter((r) => r.success).length;
  const isDone = !progress.isProcessing && progress.results.length > 0;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {progress.isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-medium">
            {progress.isProcessing
              ? `Gerando ${progress.current}/${progress.total}...`
              : `${successCount}/${progress.total} gerados`}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsMinimized(false)}
        >
          <Minus className="h-3 w-3 rotate-90" />
        </Button>
        {isDone && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg flex flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">
          {progress.isProcessing ? "Gerando Roteiros" : "Geração Concluída"}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
            title="Minimizar"
          >
            <Minus className="h-3 w-3" />
          </Button>
          {isDone && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
              title="Fechar"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b shrink-0 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            Progresso: {progress.current}/{progress.total}
          </span>
          <span className="text-muted-foreground font-medium">
            {getProgressPercentage()}%
          </span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-2">
          {headlines.map((headline, index) => (
            <div
              key={headline.key}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border text-sm",
                progress.currentKey === headline.key
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/30"
              )}
            >
              {getResultIcon(headline.key)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {headline.key}: {headline.headline || "(sem headline)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getResultStatus(headline.key)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          {successCount} de {progress.total} roteiros gerados com sucesso
        </p>
      </div>
    </div>
  );
};
