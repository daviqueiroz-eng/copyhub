import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useMinhasVotacoes,
  useMarcarVotacaoVisualizada,
} from "@/hooks/useHeadlineVotacoes";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export const ResultadosVotacaoDialog = ({ open, onOpenChange }: Props) => {
  const { data = [] } = useMinhasVotacoes();
  const marcar = useMarcarVotacaoVisualizada();

  useEffect(() => {
    if (!open) return;
    data.forEach((d) => {
      if (!d.visualizada && d.votos.length > 0) {
        marcar.mutate(d.votacao.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle>Resultados das votações</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-3">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não disparou nenhuma votação.
            </p>
          ) : (
            <div className="space-y-3">
              {data.map((d) => {
                const expirado =
                  d.votacao.encerrada ||
                  new Date(d.votacao.expira_em).getTime() < Date.now();
                return (
                  <div
                    key={d.votacao.id}
                    className="rounded border p-3 bg-card"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <p className="text-sm font-medium whitespace-pre-wrap break-words flex-1">
                        {d.votacao.headline_texto || "(sem headline)"}
                      </p>
                      <Badge variant={expirado ? "secondary" : "default"}>
                        {expirado ? "Encerrada" : "Ativa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span>
                        <strong className="text-foreground">{d.votos.length}</strong> votos
                      </span>
                      <span>
                        Média:{" "}
                        <strong className="text-foreground">
                          {d.votos.length ? d.media.toFixed(1) : "—"}
                        </strong>
                      </span>
                      <span>
                        {new Date(d.votacao.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {d.votos.length > 0 && (
                      <div className="space-y-1">
                        {d.votos.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-start gap-2 text-xs border-t pt-1"
                          >
                            <span
                              className="font-bold w-6 text-center rounded"
                              style={{ color: "#B8860B" }}
                            >
                              {v.nota}
                            </span>
                            <span className="text-foreground/80 flex-1">
                              {v.comentario || (
                                <span className="italic text-muted-foreground">
                                  sem comentário
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
