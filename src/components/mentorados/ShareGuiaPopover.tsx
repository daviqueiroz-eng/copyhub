import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  useRoteiroShare,
  useCriarOuObterShare,
  useToggleShareAtivo,
} from "@/hooks/useRoteiroShares";

export const ShareGuiaPopover = ({
  mentoradoId,
  guiaNumero,
}: {
  mentoradoId: string;
  guiaNumero: number;
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: share } = useRoteiroShare(mentoradoId, guiaNumero);
  const criar = useCriarOuObterShare();
  const toggle = useToggleShareAtivo();

  const handleOpen = async (next: boolean) => {
    setOpen(next);
    if (next && !share) {
      try {
        await criar.mutateAsync({ mentoradoId, guiaNumero });
      } catch (e) {
        toast({ title: "Erro ao gerar link", variant: "destructive" });
      }
    }
  };

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
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex"
          onClick={(e) => e.stopPropagation()}
          title="Compartilhar guia"
        >
          <Share2 className="h-3.5 w-3.5" style={{ color: "#B8860B" }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-sm">Compartilhar guia</p>
            <p className="text-xs text-muted-foreground">
              Envie esse link para o mentorado comentar
            </p>
          </div>
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
      </PopoverContent>
    </Popover>
  );
};
