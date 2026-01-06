import { cn } from "@/lib/utils";

interface RoteiroProgressBarProps {
  headlinesPreenchidas: number;
  roteirosPreenchidos: number;
  total: number;
}

export const RoteiroProgressBar = ({
  headlinesPreenchidas,
  roteirosPreenchidos,
  total,
}: RoteiroProgressBarProps) => {
  const headlinePercent = total > 0 ? (headlinesPreenchidas / total) * 50 : 0;
  const roteiroPercent = total > 0 ? (roteirosPreenchidos / total) * 50 : 0;
  const totalPercent = headlinePercent + roteiroPercent;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/60"></span>
            Headlines: {headlinesPreenchidas}/{total}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Roteiros: {roteirosPreenchidos}/{total}
          </span>
        </div>
        <span className="font-medium">{Math.round(totalPercent)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        {/* Headlines progress (first half) */}
        <div
          className="h-full bg-primary/60 transition-all duration-300"
          style={{ width: `${headlinePercent}%` }}
        />
        {/* Roteiros progress (second half) */}
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${roteiroPercent}%` }}
        />
      </div>
    </div>
  );
};
