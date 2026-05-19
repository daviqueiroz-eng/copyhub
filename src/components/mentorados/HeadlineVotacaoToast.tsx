import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Swords, Check, X } from "lucide-react";
import { useRegistrarVoto, type HeadlineVotacao } from "@/hooks/useHeadlineVotacoes";
import { toast } from "sonner";

interface Props {
  votacao: HeadlineVotacao;
  onClose: () => void;
}

export const HeadlineVotacaoToast = ({ votacao, onClose }: Props) => {
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(votacao.expira_em).getTime() - Date.now()) / 1000))
  );
  const registrar = useRegistrarVoto();

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(
        0,
        Math.floor((new Date(votacao.expira_em).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(s);
      if (s <= 0) {
        clearInterval(t);
        onClose();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [votacao.expira_em, onClose]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const handleSubmit = async () => {
    if (!nota) return;
    try {
      await registrar.mutateAsync({
        votacao_id: votacao.id,
        nota,
        comentario: comentario.trim() || null,
      });
      setSubmitted(true);
      toast.success("Voto registrado!");
      setTimeout(onClose, 1500);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao votar");
    }
  };

  return (
    <div
      className="w-[360px] rounded-lg border bg-card text-card-foreground shadow-lg p-4"
      style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4" style={{ color: "#B8860B" }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: "#B8860B" }}>
            VOTAÇÃO RÁPIDA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {mm}:{ss}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm mb-3 whitespace-pre-wrap break-words border-l-2 pl-2" style={{ borderColor: "#B8860B" }}>
        {votacao.headline_texto || "(sem headline)"}
      </p>

      {submitted ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" /> Voto enviado
        </div>
      ) : (
        <>
          <div className="grid grid-cols-10 gap-1 mb-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setNota(n)}
                className={`h-8 rounded text-xs font-semibold border transition ${
                  nota === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent border-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Comentário (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="text-xs min-h-[50px] mb-2"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!nota || registrar.isPending}
            className="w-full"
          >
            Enviar voto
          </Button>
        </>
      )}
    </div>
  );
};
