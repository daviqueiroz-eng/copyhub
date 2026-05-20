import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  useRoteiroShare,
  useCriarOuObterShare,
  useToggleShareAtivo,
} from "@/hooks/useRoteiroShares";

export const ShareGuiaDialog = ({
  mentoradoId,
  guiaNumero,
  open,
  onOpenChange,
}: {
  mentoradoId: string;
  guiaNumero: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const { data: share } = useRoteiroShare(mentoradoId, guiaNumero);
  const criar = useCriarOuObterShare();
  const toggle = useToggleShareAtivo();

  useEffect(() => {
    if (open && !share) {
      criar
        .mutateAsync({ mentoradoId, guiaNumero })
        .catch(() =>
          toast({ title: "Erro ao gerar link", variant: "destructive" })
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, share]);

  const url = share
    ? `${window.location.origin}/r/${share.token}`
    : "Gerando...";

  const handleCopy = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Compartilhar guia</DialogTitle>
          <DialogDescription>
            Envie esse link para o mentorado comentar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={url} readOnly className="text-xs" />
            <Button size="icon" variant="outline" onClick={handleCopy} disabled={!share}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {share && (
            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="share-ativo" className="text-xs">
                Link ativo
              </Label>
              <Switch
                id="share-ativo"
                checked={share.ativo}
                onCheckedChange={(v) =>
                  toggle.mutate({ id: share.id, ativo: v })
                }
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
