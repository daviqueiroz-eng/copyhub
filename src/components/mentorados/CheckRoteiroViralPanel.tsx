import { AlertCircle, Loader2 } from "lucide-react";
import { CheckRoteiroViral } from "@/hooks/useCheckRoteiroViral";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CheckRoteiroViralPanelProps {
  checks: CheckRoteiroViral[];
  iaResults?: Map<string, { passa: boolean; motivo?: string; loading?: boolean }>;
  className?: string;
}

export const CheckRoteiroViralPanel = ({
  checks,
  iaResults,
  className,
}: CheckRoteiroViralPanelProps) => {
  // Filtrar checks que falharam (regras fixas já vêm filtrados, IA verificamos pelo mapa)
  const failedChecks = checks.filter((check) => {
    if (check.regra_tipo === "ia" && iaResults) {
      const result = iaResults.get(check.id);
      // Se está carregando ou não tem resultado, não mostrar
      if (!result || result.loading) return false;
      // Mostrar apenas se não passou
      return !result.passa;
    }
    // Regras fixas já vêm filtradas pelo componente pai
    return true;
  });

  // Verificar se há checks IA carregando
  const loadingIAChecks = checks.filter((check) => {
    if (check.regra_tipo === "ia" && iaResults) {
      const result = iaResults.get(check.id);
      return result?.loading;
    }
    return false;
  });

  if (failedChecks.length === 0 && loadingIAChecks.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-wrap items-center gap-2 mt-3", className)}>
        {/* Checks que falharam */}
        {failedChecks.map((check) => {
          const iaResult = check.regra_tipo === "ia" ? iaResults?.get(check.id) : null;
          const tooltipContent = iaResult?.motivo || check.descricao;

          return (
            <Tooltip key={check.id}>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 cursor-help transition-colors hover:bg-destructive/20"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-medium">{check.nome}</span>
                </div>
              </TooltipTrigger>
              {tooltipContent && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltipContent}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* Checks IA carregando */}
        {loadingIAChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border"
          >
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            <span className="text-xs font-medium">{check.nome}</span>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};
