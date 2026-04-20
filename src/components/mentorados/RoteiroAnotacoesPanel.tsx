import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronDown, Loader2, Check, Mic } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AnotacaoCampo,
  useRoteiroAnotacoes,
  useUpsertRoteiroAnotacao,
} from "@/hooks/useRoteiroAnotacoes";

interface RoteiroAnotacoesPanelProps {
  roteiroId: string | undefined;
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
  linkReferencia?: string | null;
  headline?: string;
}

const SECOES: Array<{ key: AnotacaoCampo; label: string; placeholder: string }> = [
  { key: "referencia_texto", label: "Referência", placeholder: "Cole referências, links ou trechos relevantes..." },
  { key: "notas", label: "Notas", placeholder: "Notas rápidas sobre este roteiro..." },
  { key: "estudos", label: "Estudos", placeholder: "Insights, estudos e aprendizados..." },
  { key: "comentario", label: "Comentário", placeholder: "Comentários ou observações..." },
];

const TRANSCRIBE_WEBHOOK_URL =
  "https://eduardocorestudio.app.n8n.cloud/webhook/96d8a870-b483-4863-a854-5ec579bba0d0";

export const RoteiroAnotacoesPanel = ({
  roteiroId,
  className,
  onExpandedChange,
  linkReferencia,
  headline,
}: RoteiroAnotacoesPanelProps) => {
  const { data: anotacao } = useRoteiroAnotacoes(roteiroId);
  const upsert = useUpsertRoteiroAnotacao();
  const [transcribing, setTranscribing] = useState(false);

  const handleTranscribe = async () => {
    if (!roteiroId || !linkReferencia || transcribing) return;
    setTranscribing(true);
    try {
      const res = await fetch(TRANSCRIBE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roteiro_id: roteiroId,
          headline: headline ?? "",
          link_referencia: linkReferencia,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      let texto = "";
      try {
        const json = JSON.parse(raw);
        texto =
          (typeof json === "string" && json) ||
          json?.transcricao ||
          json?.text ||
          json?.texto ||
          json?.output ||
          json?.result ||
          json?.data ||
          (Array.isArray(json) && (json[0]?.transcricao || json[0]?.text || json[0]?.output)) ||
          "";
        if (typeof texto !== "string") texto = JSON.stringify(texto);
      } catch {
        texto = raw;
      }
      if (!texto || !texto.trim()) {
        throw new Error("Resposta vazia do webhook");
      }
      const atual = values.referencia_texto?.trim() ?? "";
      const novoValor = atual ? `${atual}\n\n${texto}` : texto;
      // Abrir o bloco e preencher o campo
      setOpenSections((prev) => ({ ...prev, referencia_texto: true }));
      handleChange("referencia_texto", novoValor);
      toast({ title: "Transcrição concluída" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: "Falha ao transcrever referência",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setTranscribing(false);
    }
  };

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

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {SECOES.map((s) => {
        const isOpen = openSections[s.key];
        const hasContent = (values[s.key] ?? "").trim().length > 0;
        return (
          <div key={s.key} className="border rounded-md bg-muted/20">
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
                  <Check className="h-3 w-3 text-green-500" />
                )}
              </div>
            </button>
            {isOpen && (
              <div className="px-2 pb-2 pt-1">
                {s.key === "referencia_texto" && linkReferencia && (
                  <div className="mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleTranscribe}
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
    </div>
  );
};
