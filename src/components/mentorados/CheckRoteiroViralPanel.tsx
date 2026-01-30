import { CheckRoteiroViral } from "@/hooks/useCheckRoteiroViral";
import { cn } from "@/lib/utils";

interface CheckRoteiroViralPanelProps {
  checks: CheckRoteiroViral[];
  className?: string;
}

export const CheckRoteiroViralPanel = ({
  checks,
  className,
}: CheckRoteiroViralPanelProps) => {
  if (checks.length === 0) return null;

  return (
    <div
      className={cn(
        "border rounded-xl p-4 bg-background w-48 shrink-0",
        className
      )}
    >
      <h4 className="font-bold text-center mb-4 text-sm leading-tight">
        Check do
        <br />
        roteiro viral
      </h4>
      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-2 border rounded-lg p-2.5 bg-muted/30"
            title={check.descricao || undefined}
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-destructive mt-0.5 shrink-0" />
            <span className="text-xs font-medium leading-tight">
              {check.nome}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
