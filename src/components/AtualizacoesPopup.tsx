import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Rocket, Wrench, Lightbulb } from "lucide-react";
import { useAtualizacoesNaoLidas, useMarcarComoLida } from "@/hooks/useAtualizacoes";

const tipoIcons: Record<string, React.ReactNode> = {
  feature: <Rocket className="h-4 w-4" />,
  fix: <Wrench className="h-4 w-4" />,
  improvement: <Lightbulb className="h-4 w-4" />,
};

const tipoLabels: Record<string, string> = {
  feature: "Nova Funcionalidade",
  fix: "Correção",
  improvement: "Melhoria",
};

const tipoColors: Record<string, string> = {
  feature: "bg-green-500/20 text-green-400 border-green-500/30",
  fix: "bg-red-500/20 text-red-400 border-red-500/30",
  improvement: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function AtualizacoesPopup() {
  const [open, setOpen] = useState(false);
  const { data: atualizacoes, isLoading } = useAtualizacoesNaoLidas();
  const marcarComoLida = useMarcarComoLida();

  useEffect(() => {
    if (!isLoading && atualizacoes && atualizacoes.length > 0) {
      setOpen(true);
    }
  }, [atualizacoes, isLoading]);

  const handleEntendi = async () => {
    if (atualizacoes && atualizacoes.length > 0) {
      const ids = atualizacoes.map((a) => a.id);
      await marcarComoLida.mutateAsync(ids);
    }
    setOpen(false);
  };

  if (!atualizacoes || atualizacoes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            Novidades!
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {atualizacoes.map((atualizacao) => (
              <div
                key={atualizacao.id}
                className="p-4 rounded-lg border border-border bg-card/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={tipoColors[atualizacao.tipo] || tipoColors.feature}
                    >
                      {tipoIcons[atualizacao.tipo] || tipoIcons.feature}
                      <span className="ml-1">
                        {tipoLabels[atualizacao.tipo] || "Atualização"}
                      </span>
                    </Badge>
                    {atualizacao.versao && (
                      <Badge variant="secondary" className="text-xs">
                        {atualizacao.versao}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(atualizacao.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground">{atualizacao.titulo}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {atualizacao.conteudo}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleEntendi}
            disabled={marcarComoLida.isPending}
            className="w-full sm:w-auto"
          >
            ✓ Entendi!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
