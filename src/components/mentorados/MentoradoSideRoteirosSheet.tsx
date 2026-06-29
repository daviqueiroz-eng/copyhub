import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, X } from "lucide-react";
import {
  useMentoradosRoteiros,
  useUpsertMentoradoRoteiro,
  markLocalWrite,
} from "@/hooks/useMentoradosRoteiros";

interface Props {
  mentoradoId: string | null;
  mentoradoNome?: string;
  onClose: () => void;
  onOpenFull?: (mentoradoId: string) => void;
}

type Local = {
  headline: string;
  estrutura: string;
};

export const MentoradoSideRoteirosSheet = ({
  mentoradoId,
  mentoradoNome,
  onClose,
  onOpenFull,
}: Props) => {
  const open = !!mentoradoId;
  const { data: roteiros = [], isLoading } = useMentoradosRoteiros(
    mentoradoId || undefined
  );
  const upsert = useUpsertMentoradoRoteiro();

  const guias = useMemo(() => {
    const set = new Set<number>();
    roteiros.forEach((r) => set.add(r.guia_numero));
    return Array.from(set).sort((a, b) => a - b);
  }, [roteiros]);

  const [guiaAtiva, setGuiaAtiva] = useState<number>(1);
  useEffect(() => {
    if (guias.length > 0 && !guias.includes(guiaAtiva)) {
      setGuiaAtiva(guias[0]);
    }
  }, [guias, guiaAtiva]);

  const [locals, setLocals] = useState<Map<string, Local>>(new Map());
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Hydrate locals when roteiros change
  useEffect(() => {
    setLocals((prev) => {
      const next = new Map(prev);
      roteiros.forEach((r) => {
        const key = `${r.guia_numero}-${r.ordem}`;
        if (debounceRef.current.has(key)) return; // preserve in-flight edits
        next.set(key, {
          headline: r.headline || "",
          estrutura: r.estrutura || "",
        });
      });
      return next;
    });
  }, [roteiros]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      debounceRef.current.forEach((t) => clearTimeout(t));
      debounceRef.current.clear();
      setLocals(new Map());
    }
  }, [open]);

  const itemsDaGuia = useMemo(
    () =>
      roteiros
        .filter((r) => r.guia_numero === guiaAtiva)
        .sort((a, b) => a.ordem - b.ordem),
    [roteiros, guiaAtiva]
  );

  const handleChange = (
    ordem: number,
    field: "headline" | "estrutura",
    value: string
  ) => {
    if (!mentoradoId) return;
    const key = `${guiaAtiva}-${ordem}`;
    setLocals((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) || { headline: "", estrutura: "" };
      next.set(key, { ...existing, [field]: value });
      return next;
    });
    const existing = debounceRef.current.get(key);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      debounceRef.current.delete(key);
      const current = (() => {
        const c = locals.get(key) || { headline: "", estrutura: "" };
        return { ...c, [field]: value };
      })();
      try {
        markLocalWrite();
        await upsert.mutateAsync({
          mentoradoId,
          guiaNumero: guiaAtiva,
          ordem,
          headline: current.headline,
          estrutura: current.estrutura,
        });
      } catch (e) {
        console.error("Erro salvando roteiro lateral", e);
      }
    }, 800);
    debounceRef.current.set(key, t);
  };

  return (
    open ? (
      <div
        className="fixed top-0 right-0 h-screen w-full sm:w-[520px] bg-background border-l shadow-2xl flex flex-col z-40"
        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        <div className="px-5 py-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold truncate">
              {mentoradoNome || "Mentorado"} — roteiros
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              {mentoradoId && onOpenFull && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    onOpenFull(mentoradoId);
                    onClose();
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir perfil
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {guias.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pt-2 -mb-1">
              {guias.map((g) => (
                <button
                  key={g}
                  onClick={() => setGuiaAtiva(g)}
                  className={`text-xs px-3 py-1 rounded-full shrink-0 transition ${
                    g === guiaAtiva
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  Guia {g}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {!isLoading && itemsDaGuia.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhum roteiro nesta guia ainda.
            </p>
          )}

          {itemsDaGuia.map((r) => {
            const key = `${r.guia_numero}-${r.ordem}`;
            const local = locals.get(key) || {
              headline: r.headline || "",
              estrutura: r.estrutura || "",
            };
            return (
              <div key={r.id} className="space-y-2">
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#B8860B" }}
                >
                  Headline {String(r.ordem).padStart(2, "0")}
                </div>
                <Input
                  value={local.headline}
                  onChange={(e) =>
                    handleChange(r.ordem, "headline", e.target.value)
                  }
                  placeholder="Headline..."
                  className="text-sm"
                />
                <div
                  className="text-xs font-semibold uppercase tracking-wider pt-1"
                  style={{ color: "#B8860B" }}
                >
                  Estrutura {String(r.ordem).padStart(2, "0")}
                </div>
                <Textarea
                  value={local.estrutura}
                  onChange={(e) =>
                    handleChange(r.ordem, "estrutura", e.target.value)
                  }
                  placeholder="Estrutura..."
                  className="text-sm min-h-[120px]"
                />
              </div>
            );
          })}
        </div>
      </div>
    ) : null
  );
};