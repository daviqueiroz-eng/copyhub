import { useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  compareHeadlines,
  type SimilarHeadlineMatch,
} from "@/lib/headlineSimilarity";

type GuiaInfo = {
  numero: number;
  nome_customizado?: string | null;
  isOverdelivery?: boolean;
};

type RoteiroLike = {
  headline: string;
};

interface SimilarHeadlinesBadgeProps {
  currentKey: string;
  currentHeadline: string;
  allRoteiros: Map<string, RoteiroLike>;
  guias: GuiaInfo[];
  onJumpTo: (guiaNumero: number, ordem: number) => void;
}

function truncate(text: string, max = 50): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "...";
}

function guiaLabel(guias: GuiaInfo[], numero: number): string {
  const g = guias.find((x) => x.numero === numero);
  if (!g) return `Guia ${numero}`;
  if (g.nome_customizado && g.nome_customizado.trim().length > 0) {
    return g.nome_customizado;
  }
  return g.isOverdelivery ? `Overdelivery ${numero}` : `Guia ${numero}`;
}

export const SimilarHeadlinesBadge = ({
  currentKey,
  currentHeadline,
  allRoteiros,
  guias,
  onJumpTo,
}: SimilarHeadlinesBadgeProps) => {
  const [debounced, setDebounced] = useState(currentHeadline);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [closeTimer, setCloseTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      setCloseTimer(null);
    }
    setHoverOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer) clearTimeout(closeTimer);
    const t = setTimeout(() => setHoverOpen(false), 150);
    setCloseTimer(t);
  };

  useEffect(() => {
    const id = setTimeout(() => setDebounced(currentHeadline), 300);
    return () => clearTimeout(id);
  }, [currentHeadline]);

  const candidates = useMemo(() => {
    const list: { key: string; headline: string; guia: number; ordem: number }[] = [];
    allRoteiros.forEach((value, key) => {
      const [g, o] = key.split("-").map(Number);
      if (!Number.isFinite(g) || !Number.isFinite(o)) return;
      list.push({
        key,
        headline: value.headline || "",
        guia: g,
        ordem: o,
      });
    });
    return list;
  }, [allRoteiros]);

  const matches: SimilarHeadlineMatch[] = useMemo(
    () => compareHeadlines(debounced, candidates, { selfKey: currentKey }),
    [debounced, candidates, currentKey]
  );

  if (matches.length === 0) return null;

  const preview = matches.slice(0, 3);

  return (
    <>
      <Popover open={hoverOpen} onOpenChange={setHoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onMouseEnter={openNow}
            onMouseLeave={scheduleClose}
            onFocus={openNow}
            onBlur={scheduleClose}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoverOpen((v) => !v);
            }}
            className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#FF7A00] text-white text-[11px] font-semibold font-poppins shadow-sm hover:opacity-90 transition-opacity"
            title={`${matches.length} headline${matches.length > 1 ? "s" : ""} muito parecida${matches.length > 1 ? "s" : ""}`}
            aria-label="Headlines parecidas"
          >
            {matches.length}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="w-72 p-3 font-poppins"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <p className="text-sm font-semibold mb-2">
            {matches.length} headline{matches.length > 1 ? "s" : ""} muito parecida{matches.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-2">
            {preview.map((m) => (
              <li key={m.key} className="text-xs">
                <div className="leading-snug">{truncate(m.headline, 50)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {guiaLabel(guias, m.guia)} · Headline {String(m.ordem).padStart(2, "0")}
                </div>
              </li>
            ))}
          </ul>
          {matches.length > 0 && (
            <button
              type="button"
              className="mt-3 w-full text-xs text-primary hover:underline border-t pt-2"
              onClick={() => setExpandedOpen(true)}
            >
              Ver todas ({matches.length})
            </button>
          )}
        </PopoverContent>
      </Popover>

      {expandedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setExpandedOpen(false)}
        >
          <div
            className="bg-background border-2 border-[#FF7A00] rounded-lg shadow-xl max-w-lg w-full mx-4 p-4 font-poppins"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {matches.length} headline{matches.length > 1 ? "s" : ""} muito parecida{matches.length > 1 ? "s" : ""}
              </h3>
              <button
                onClick={() => setExpandedOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
              {matches.map((m) => (
                <li key={m.key} className="flex items-start gap-2 border-b pb-3 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{m.headline}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {guiaLabel(guias, m.guia)} · Bloco: Headline {String(m.ordem).padStart(2, "0")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() => {
                      onJumpTo(m.guia, m.ordem);
                      setExpandedOpen(false);
                    }}
                  >
                    Ir até <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};