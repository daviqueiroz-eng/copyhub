import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronDown, Loader2, Check, Mic, LayoutGrid } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AnotacaoCampo,
  useRoteiroAnotacoes,
  useUpsertRoteiroAnotacao,
} from "@/hooks/useRoteiroAnotacoes";
import { useTranscricaoReferencia } from "@/contexts/TranscricaoContext";
import { EstruturaDialog } from "./EstruturaDialog";

interface RoteiroAnotacoesPanelProps {
  roteiroId: string | undefined;
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
  linkReferencia?: string | null;
  headline?: string;
  mentoradoNome?: string;
  layout?: "vertical" | "horizontal";
}

const SECOES: Array<{ key: AnotacaoCampo; label: string; placeholder: string }> = [
  { key: "referencia_texto", label: "Referência", placeholder: "Cole referências, links ou trechos relevantes..." },
  { key: "notas", label: "Notas", placeholder: "Notas rápidas sobre este roteiro..." },
  { key: "estudos", label: "Estudos", placeholder: "Insights, estudos e aprendizados..." },
];

export const RoteiroAnotacoesPanel = ({
  roteiroId,
  className,
  onExpandedChange,
  linkReferencia,
  headline,
  mentoradoNome,
  layout = "vertical",
}: RoteiroAnotacoesPanelProps) => {
  const { data: anotacao } = useRoteiroAnotacoes(roteiroId);
  const upsert = useUpsertRoteiroAnotacao();
  const { start: startTranscricao, isPending } = useTranscricaoReferencia();
  const transcribing = roteiroId ? isPending(roteiroId) : false;
  const [estruturaOpen, setEstruturaOpen] = useState(false);
  const [estruturaVisited, setEstruturaVisited] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("estrutura_visited") === "1";
  });

  const openEstrutura = () => {
    setEstruturaOpen(true);
    if (!estruturaVisited) {
      window.localStorage.setItem("estrutura_visited", "1");
      setEstruturaVisited(true);
    }
  };
  const estruturaBtnClass = !estruturaVisited
    ? "ring-2 ring-[#B8860B] shadow-[0_0_18px_rgba(184,134,11,0.75)] animate-pulse"
    : "";

  // URL detectada dentro do próprio campo de referência
  const URL_REGEX = /(https?:\/\/[^\s]+)/i;

  const [openSections, setOpenSections] = useState<Record<AnotacaoCampo, boolean>>({
    referencia_texto: false,
    notas: false,
    estudos: false,
    comentario: false,
  });

  // Estado local de cada campo para edição fluida
  const [values, setValues] = useState<Record<AnotacaoCampo, string>>({
    referencia_texto: "",
    notas: "",
    estudos: "",
    comentario: "",
  });

  const [savingField, setSavingField] = useState<AnotacaoCampo | null>(null);
  const [savedField, setSavedField] = useState<AnotacaoCampo | null>(null);
  const debouncesRef = useRef<Record<AnotacaoCampo, ReturnType<typeof setTimeout> | null>>({
    referencia_texto: null,
    notas: null,
    estudos: null,
    comentario: null,
  });
  const dirtyRef = useRef<Record<AnotacaoCampo, boolean>>({
    referencia_texto: false,
    notas: false,
    estudos: false,
    comentario: false,
  });

  // Hidratar com dados do banco apenas se o usuário não estiver editando
  useEffect(() => {
    if (!anotacao) return;
    setValues((prev) => ({
      referencia_texto: dirtyRef.current.referencia_texto ? prev.referencia_texto : (anotacao.referencia_texto ?? ""),
      notas: dirtyRef.current.notas ? prev.notas : (anotacao.notas ?? ""),
      estudos: dirtyRef.current.estudos ? prev.estudos : (anotacao.estudos ?? ""),
      comentario: dirtyRef.current.comentario ? prev.comentario : (anotacao.comentario ?? ""),
    }));
  }, [anotacao]);

  const handleChange = (campo: AnotacaoCampo, valor: string) => {
    if (!roteiroId) return;
    setValues((prev) => ({ ...prev, [campo]: valor }));
    dirtyRef.current[campo] = true;

    if (debouncesRef.current[campo]) {
      clearTimeout(debouncesRef.current[campo]!);
    }
    debouncesRef.current[campo] = setTimeout(() => {
      setSavingField(campo);
      upsert.mutate(
        { roteiroId, campo, valor },
        {
          onSuccess: () => {
            dirtyRef.current[campo] = false;
            setSavingField(null);
            setSavedField(campo);
            setTimeout(() => setSavedField((cur) => (cur === campo ? null : cur)), 1500);
          },
          onError: () => {
            setSavingField(null);
          },
        },
      );
    }, 800);
  };

  const toggle = (campo: AnotacaoCampo) =>
    setOpenSections((prev) => ({ ...prev, [campo]: !prev[campo] }));

  const anyOpen = Object.values(openSections).some(Boolean);
  useEffect(() => {
    onExpandedChange?.(anyOpen);
  }, [anyOpen, onExpandedChange]);

  // Link a usar para transcrever: prop (extraído da headline) ou URL detectada no campo de referência
  const linkFromReferencia = (() => {
    const v = values.referencia_texto || "";
    const m = v.match(URL_REGEX);
    return m ? m[0] : null;
  })();
  const linkParaTranscrever = linkReferencia || linkFromReferencia;

  const handleTranscribe = () => {
    if (!roteiroId || !linkParaTranscrever) return;
    startTranscricao({
      roteiroId,
      headline,
      linkReferencia: linkParaTranscrever,
      mentoradoNome,
    });
  };

  // Auto-transcrição: ao detectar link novo (após hidratação inicial), dispara sozinho
  const autoTriggeredRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);
  useEffect(() => {
    hydratedRef.current = false;
    autoTriggeredRef.current = new Set();
  }, [roteiroId]);
  useEffect(() => {
    if (!roteiroId) return;
    if (anotacao === undefined) return; // aguarda fetch inicial
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      if (linkParaTranscrever) {
        autoTriggeredRef.current.add(`${roteiroId}:${linkParaTranscrever}`);
      }
      return;
    }
    if (!linkParaTranscrever || transcribing) return;
    const key = `${roteiroId}:${linkParaTranscrever}`;
    if (autoTriggeredRef.current.has(key)) return;
    autoTriggeredRef.current.add(key);
    handleTranscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roteiroId, linkParaTranscrever, anotacao, transcribing]);

  // Estado visual da Referência: vermelho enquanto transcreve, verde por alguns segundos após concluir
  const [justTranscribed, setJustTranscribed] = useState(false);
  const wasTranscribingRef = useRef(false);
  useEffect(() => {
    if (wasTranscribingRef.current && !transcribing) {
      setJustTranscribed(true);
      const t = setTimeout(() => setJustTranscribed(false), 4000);
      wasTranscribingRef.current = false;
      return () => clearTimeout(t);
    }
    if (transcribing) wasTranscribingRef.current = true;
  }, [transcribing]);
  const referenciaGlowClass = transcribing
    ? "ring-2 ring-red-500 shadow-[0_0_18px_rgba(239,68,68,0.75)] animate-pulse"
    : justTranscribed
      ? "ring-2 ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.75)]"
      : "";

  if (layout === "horizontal") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className={cn("flex flex-col gap-1", className)}>
          <div className="flex flex-wrap items-center gap-1.5">
            {SECOES.map((s) => {
              const isOpen = openSections[s.key];
              const hasContent = (values[s.key] ?? "").trim().length > 0;
              const isReferencia = s.key === "referencia_texto";
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors",
                    isOpen ? "bg-muted border-foreground/20" : "bg-muted/20 hover:bg-muted/40",
                    isReferencia && referenciaGlowClass,
                  )}
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={cn("font-medium", hasContent ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                  {hasContent && !isOpen && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  {savingField === s.key && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                  {savedField === s.key && (
                    <Check className="h-3 w-3 text-emerald-500" />
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={openEstrutura}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors bg-muted/20 hover:bg-muted/40",
                estruturaBtnClass,
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Estrutura</span>
            </button>
          </div>
          {SECOES.map((s) => {
            const isOpen = openSections[s.key];
            if (!isOpen) return null;
            const isReferenciaSection = s.key === "referencia_texto";
            return (
              <div key={`${s.key}-content`} className="border rounded-md bg-muted/20 p-2 mt-1">
                {isReferenciaSection && linkParaTranscrever && (
                  <div className="mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTranscribe();
                      }}
                      disabled={transcribing || !roteiroId}
                      className="h-7 text-xs gap-1.5"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Transcrevendo...
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" />
                          Transcrever referência
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <Textarea
                  value={values[s.key]}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                  placeholder={roteiroId ? s.placeholder : "Digite a headline para habilitar..."}
                  disabled={!roteiroId}
                  className="min-h-[160px] text-sm resize-y h-auto"
                />
              </div>
            );
          })}
        </div>
        <EstruturaDialog open={estruturaOpen} onOpenChange={setEstruturaOpen} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className={cn("flex flex-col gap-1", className)}>
      {SECOES.map((s) => {
        const isOpen = openSections[s.key];
        const hasContent = (values[s.key] ?? "").trim().length > 0;
        const isReferenciaSection = s.key === "referencia_texto";
        return (
          <div
            key={s.key}
            className={cn(
              "border rounded-md bg-muted/20",
              isReferenciaSection && referenciaGlowClass,
            )}
          >
            <button
              type="button"
              onClick={() => toggle(s.key)}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/40 rounded-md transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  hasContent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
                {hasContent && !isOpen && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {savingField === s.key && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
                {savedField === s.key && (
                  <Check className="h-3 w-3 text-emerald-500" />
                )}
                {isReferenciaSection && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (linkParaTranscrever && !transcribing && roteiroId) {
                            handleTranscribe();
                          }
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all border",
                          linkParaTranscrever && !transcribing && roteiroId
                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-pointer"
                            : "bg-muted text-muted-foreground border-border opacity-60 cursor-not-allowed",
                        )}
                      >
                        {transcribing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Mic className="h-3 w-3" />
                        )}
                        <span>{transcribing ? "Transcrevendo" : "Transcrever"}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {linkParaTranscrever
                        ? transcribing
                          ? "Transcrição em andamento..."
                          : "Transcrever vídeo da referência"
                        : "Cole um link na headline ou no campo Referência para habilitar"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </button>
            {isOpen && (
              <div className="px-2 pb-2 pt-1">
                {s.key === "referencia_texto" && linkParaTranscrever && (
                  <div className="mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTranscribe();
                      }}
                      disabled={transcribing || !roteiroId}
                      className="w-full h-8 text-xs gap-1.5"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Transcrevendo...
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" />
                          Transcrever referência
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <Textarea
                  value={values[s.key]}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                  placeholder={roteiroId ? s.placeholder : "Digite a headline para habilitar..."}
                  disabled={!roteiroId}
                  className="min-h-[220px] text-sm resize-y h-auto"
                />
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={openEstrutura}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1.5 border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors",
          estruturaBtnClass,
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">Estrutura</span>
      </button>
    </div>
    <EstruturaDialog open={estruturaOpen} onOpenChange={setEstruturaOpen} />
    </TooltipProvider>
  );
};
