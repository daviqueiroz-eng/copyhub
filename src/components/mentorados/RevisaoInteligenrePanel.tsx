import { useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Check,
} from "lucide-react";
import type { RevisaoError, RevisaoErrorTipo } from "@/hooks/useRevisaoInteligente";

const CATEGORIAS: Array<{
  tipo: RevisaoErrorTipo;
  label: string;
  dot: string;
  badge: string;
}> = [
  { tipo: "ortografico", label: "Erros ortográficos", dot: "bg-red-500", badge: "text-red-600 bg-red-500/10" },
  { tipo: "gramatical", label: "Sugestões gramaticais", dot: "bg-blue-500", badge: "text-blue-600 bg-blue-500/10" },
  { tipo: "nome_cliente", label: "Nome do cliente", dot: "bg-orange-500", badge: "text-orange-600 bg-orange-500/10" },
  { tipo: "mentorado", label: "Mentorado já pontuou", dot: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-500/10" },
];

interface RevisaoInteligenrePanelProps {
  errors: RevisaoError[];
  isAnalyzing: boolean;
  activeErrorId: string | null;
  setActiveErrorId: (id: string | null) => void;
  categoriaAtiva: RevisaoErrorTipo;
  setCategoriaAtiva: (c: RevisaoErrorTipo) => void;
  open: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onApplySuggestion: (error: RevisaoError, suggestion: string) => void;
  onIgnore: (errorId: string) => void;
  onRevalidar: () => void;
}

export const RevisaoInteligenrePanel = ({
  errors,
  isAnalyzing,
  activeErrorId,
  setActiveErrorId,
  categoriaAtiva,
  setCategoriaAtiva,
  open,
  onToggleOpen,
  onClose,
  onApplySuggestion,
  onIgnore,
  onRevalidar,
}: RevisaoInteligenrePanelProps) => {
  const counts = useMemo(() => {
    const map: Record<RevisaoErrorTipo, number> = {
      ortografico: 0,
      gramatical: 0,
      nome_cliente: 0,
      mentorado: 0,
    };
    errors.forEach((e) => {
      map[e.tipo]++;
    });
    return map;
  }, [errors]);

  const errorsCategoria = useMemo(
    () =>
      errors
        .filter((e) => e.tipo === categoriaAtiva)
        .sort((a, b) => {
          if (a.posicao.ordem !== b.posicao.ordem) return a.posicao.ordem - b.posicao.ordem;
          if (a.posicao.field !== b.posicao.field)
            return a.posicao.field === "headline" ? -1 : 1;
          return a.posicao.inicio - b.posicao.inicio;
        }),
    [errors, categoriaAtiva]
  );

  const activeIndex = errorsCategoria.findIndex((e) => e.id === activeErrorId);
  const activeError = activeIndex >= 0 ? errorsCategoria[activeIndex] : null;

  const goPrev = () => {
    if (errorsCategoria.length === 0) return;
    const idx = activeIndex < 0 ? 0 : (activeIndex - 1 + errorsCategoria.length) % errorsCategoria.length;
    setActiveErrorId(errorsCategoria[idx].id);
  };
  const goNext = () => {
    if (errorsCategoria.length === 0) return;
    const idx = activeIndex < 0 ? 0 : (activeIndex + 1) % errorsCategoria.length;
    setActiveErrorId(errorsCategoria[idx].id);
  };

  // Scroll automático para o erro ativo dentro do painel
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeErrorId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-panel-error-id="${activeErrorId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeErrorId]);

  if (!open) {
    return (
      <div className="hidden lg:flex shrink-0 w-10 border-l bg-muted/30 flex-col items-center pt-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleOpen}
          title="Expandir painel de revisão"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Brain className="h-5 w-5 text-primary" />
        <div className="text-[10px] [writing-mode:vertical-rl] rotate-180 mt-2 text-muted-foreground font-medium">
          {errors.length} {errors.length === 1 ? "item" : "itens"}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex shrink-0 w-[320px] xl:w-[360px] border-l bg-background flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Revisão geral</span>
          {isAnalyzing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRevalidar}
            title="Reanalisar"
          >
            <ChevronUp className="h-3.5 w-3.5 rotate-90" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleOpen}
            title="Recolher painel"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Sair do modo revisão"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Categorias */}
      <div className="px-3 py-2 border-b space-y-1">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.tipo}
            onClick={() => setCategoriaAtiva(cat.tipo)}
            className={cn(
              "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
              categoriaAtiva === cat.tipo
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", cat.dot)} />
              <span className="text-left">{cat.label}</span>
            </div>
            <span
              className={cn(
                "text-xs font-semibold rounded-full px-2 py-0.5 min-w-[24px] text-center",
                cat.badge
              )}
            >
              {counts[cat.tipo]}
            </span>
          </button>
        ))}
      </div>

      {/* Erro selecionado */}
      <div className="px-3 py-3 border-b">
        {activeError ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {activeIndex + 1} de {errorsCategoria.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={goPrev}
                  disabled={errorsCategoria.length <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={goNext}
                  disabled={errorsCategoria.length <= 1}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="text-[11px] font-bold text-muted-foreground tracking-wide mb-1">
              {activeError.posicao.field === "headline" ? "HEADLINE" : "ESTRUTURA"}{" "}
              {String(activeError.posicao.ordem).padStart(2, "0")}
            </div>
            <div className="text-sm mb-2">
              <span className="bg-yellow-200/60 dark:bg-yellow-500/20 px-1 rounded">
                {activeError.texto}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{activeError.mensagem}</p>

            {activeError.sugestoes.length > 0 && (
              <div className="space-y-1 mb-3">
                <span className="text-[11px] uppercase font-semibold text-muted-foreground">
                  Sugestões
                </span>
                {activeError.sugestoes.map((s) => (
                  <button
                    key={s}
                    onClick={() => onApplySuggestion(activeError, s)}
                    className="w-full text-left text-sm px-2 py-1.5 rounded-md border hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => onIgnore(activeError.id)}
              >
                Ignorar
              </Button>
              {activeError.sugestoes[0] && (
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => onApplySuggestion(activeError, activeError.sugestoes[0])}
                >
                  Corrigir
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground">
            {errorsCategoria.length === 0
              ? "Nenhum item nessa categoria."
              : "Selecione um item da lista abaixo."}
          </div>
        )}
      </div>

      {/* Lista da categoria */}
      <ScrollArea className="flex-1">
        <div ref={listRef} className="p-2 space-y-1">
          {errorsCategoria.map((e) => {
            const isActive = e.id === activeErrorId;
            return (
              <button
                key={e.id}
                data-panel-error-id={e.id}
                onClick={() => setActiveErrorId(e.id)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md border text-xs transition-colors",
                  isActive
                    ? "bg-accent border-primary"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <div className="text-[10px] font-semibold text-muted-foreground tracking-wide">
                  {e.posicao.field === "headline" ? "HEADLINE" : "ESTRUTURA"}{" "}
                  {String(e.posicao.ordem).padStart(2, "0")}
                </div>
                <div className="truncate">{e.texto}</div>
              </button>
            );
          })}
          {errorsCategoria.length === 0 && !isAnalyzing && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nada a revisar nessa categoria.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};