import { useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import type { RevisaoError, RevisaoErrorTipo } from "@/hooks/useRevisaoInteligente";

const CATEGORIAS: Array<{
  tipo: RevisaoErrorTipo;
  label: string;
  dot: string;
  underline: string;
}> = [
  { tipo: "ortografico", label: "Erros ortográficos", dot: "bg-red-500", underline: "decoration-red-500" },
  { tipo: "gramatical", label: "Sugestões gramaticais", dot: "bg-blue-500", underline: "decoration-blue-500" },
  { tipo: "nome_cliente", label: "Nome do cliente", dot: "bg-orange-500", underline: "decoration-orange-500" },
  { tipo: "mentorado", label: "Mentorado já pontuou", dot: "bg-emerald-500", underline: "decoration-emerald-500" },
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
  onApplySuggestion: (error: RevisaoError, suggestion: string) => void;
  onIgnore: (errorId: string) => void;
  onRevalidar: () => void;
  mostrarSublinhados: boolean;
  onToggleSublinhados: () => void;
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
  onApplySuggestion,
  onIgnore,
  onRevalidar,
  mostrarSublinhados,
  onToggleSublinhados,
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

  // Scroll automático para o erro ativo dentro da lista do painel
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeErrorId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-panel-error-id="${activeErrorId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeErrorId]);

  const handleCategoriaClick = (tipo: RevisaoErrorTipo) => {
    setCategoriaAtiva(tipo);
    if (!open) onToggleOpen();
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 z-30 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-[1400px] rounded-xl border bg-background/95 backdrop-blur-md shadow-lg overflow-hidden transition-all",
          open ? "max-h-[320px]" : "max-h-14"
        )}
      >
        {/* Barra compacta — sempre visível */}
        <div className="flex items-center justify-between gap-3 px-4 h-12">
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-none">
            {CATEGORIAS.map((cat) => {
              const isActive = categoriaAtiva === cat.tipo && open;
              return (
                <button
                  key={cat.tipo}
                  onClick={() => handleCategoriaClick(cat.tipo)}
                  className={cn(
                    "flex items-center gap-2 text-xs whitespace-nowrap transition-opacity hover:opacity-100 group",
                    isActive ? "opacity-100" : "opacity-80"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", cat.dot)} />
                  <span className="font-semibold tabular-nums text-foreground">
                    {counts[cat.tipo]}
                  </span>
                  <span
                    className={cn(
                      "text-muted-foreground group-hover:text-foreground transition-colors",
                      isActive && "text-foreground underline underline-offset-4 decoration-2",
                      isActive && cat.underline
                    )}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAnalyzing && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleSublinhados}
              title={mostrarSublinhados ? "Ocultar marcações no texto" : "Mostrar marcações no texto"}
            >
              {mostrarSublinhados ? (
                <Eye className="h-3.5 w-3.5 text-primary" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleOpen}
              title={open ? "Recolher" : "Expandir"}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRevalidar}
              title="Reanalisar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Painel expandido */}
        {open && (
          <div className="border-t grid grid-cols-1 md:grid-cols-[280px_1fr] max-h-[272px]">
            {/* Lista da categoria */}
            <div className="border-b md:border-b-0 md:border-r flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold text-foreground">
                  {CATEGORIAS.find((c) => c.tipo === categoriaAtiva)?.label}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {errorsCategoria.length > 0 && (
                    <>
                      <span>
                        {Math.max(activeIndex + 1, 1)} de {errorsCategoria.length}
                      </span>
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
                    </>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1 max-h-[230px]">
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
                            : "border-border/60 hover:bg-accent/50"
                        )}
                      >
                        <div className="text-[10px] font-semibold text-muted-foreground tracking-wide">
                          {e.posicao.field === "headline" ? "HEADLINE" : "ESTRUTURA"}{" "}
                          {String(e.posicao.ordem).padStart(2, "0")}
                        </div>
                        <div className="truncate font-medium">{e.texto}</div>
                      </button>
                    );
                  })}
                  {errorsCategoria.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      {isAnalyzing ? "Analisando..." : "Nada a revisar nessa categoria."}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Detalhe / contexto / ação */}
            <div className="flex flex-col min-h-0 max-h-[230px] overflow-y-auto">
              {activeError ? (
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wide">
                      Contexto
                    </span>
                    <p className="text-sm mt-1">
                      <span className="bg-yellow-200/60 dark:bg-yellow-500/20 px-1 rounded">
                        {activeError.texto}
                      </span>
                    </p>
                  </div>

                  {activeError.sugestoes.length > 0 && (
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wide">
                        Sugestão
                      </span>
                      <div className="mt-1 space-y-1">
                        {activeError.sugestoes.map((s) => (
                          <button
                            key={s}
                            onClick={() => onApplySuggestion(activeError, s)}
                            className="w-full text-left text-sm px-3 py-2 rounded-md border hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700 dark:text-emerald-400">{s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeError.mensagem && (
                    <div>
                      <span className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wide">
                        Explicação
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{activeError.mensagem}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => onIgnore(activeError.id)}
                    >
                      Ignorar
                    </Button>
                    {activeError.sugestoes[0] && (
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => onApplySuggestion(activeError, activeError.sugestoes[0])}
                      >
                        Corrigir
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-xs text-muted-foreground">
                  Selecione um item da lista ao lado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
