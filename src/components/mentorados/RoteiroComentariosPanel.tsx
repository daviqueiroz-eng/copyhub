import { useMemo } from "react";
import { MessageSquare, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useRoteiroComentarios,
  useMarcarComentarioResolvido,
  useDeletarComentario,
} from "@/hooks/useRoteiroComentarios";

export const RoteiroComentariosPanel = ({
  mentoradoId,
  guiaNumero,
  open,
  onClose,
}: {
  mentoradoId: string;
  guiaNumero: number;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: comentarios = [] } = useRoteiroComentarios(mentoradoId, guiaNumero);
  const marcar = useMarcarComentarioResolvido();
  const deletar = useDeletarComentario();

  const grupos = useMemo(() => {
    const map = new Map<string, typeof comentarios>();
    comentarios.forEach((c) => {
      const label =
        c.escopo === "headline"
          ? `Headline ${String(c.ordem).padStart(2, "0")}`
          : c.escopo === "estrutura"
          ? `Estrutura ${String(c.ordem).padStart(2, "0")}`
          : `Trecho — bloco ${String(c.ordem).padStart(2, "0")}`;
      const arr = map.get(label) ?? [];
      arr.push(c);
      map.set(label, arr);
    });
    return Array.from(map.entries());
  }, [comentarios]);

  if (!open) return null;

  return (
    <div
      className="hidden lg:flex flex-col border-l bg-background"
      style={{ width: 320, fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: "#B8860B" }} />
          <p className="font-semibold text-sm">Comentários</p>
          <Badge variant="secondary" className="text-xs">
            {comentarios.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {comentarios.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum comentário ainda. Compartilhe a guia para receber comentários.
            </p>
          )}
          {grupos.map(([label, lista]) => (
            <div key={label}>
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "#B8860B" }}
              >
                {label}
              </p>
              <div className="space-y-2">
                {lista.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-md border p-2 text-xs ${
                      c.resolvido ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{c.autor_nome}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {c.trecho_texto && (
                      <p className="italic text-[11px] border-l-2 pl-2 my-1 text-muted-foreground">
                        "{c.trecho_texto}"
                      </p>
                    )}
                    {c.conteudo_texto && (
                      <p className="whitespace-pre-wrap">{c.conteudo_texto}</p>
                    )}
                    {c.audio_url && (
                      <audio controls src={c.audio_url} className="w-full mt-1 h-8" />
                    )}
                    <div className="flex justify-end gap-1 mt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px]"
                        onClick={() =>
                          marcar.mutate({ id: c.id, resolvido: !c.resolvido })
                        }
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {c.resolvido ? "Reabrir" : "Resolver"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-destructive"
                        onClick={() => deletar.mutate(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
