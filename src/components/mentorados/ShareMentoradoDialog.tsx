import { useEffect, useState } from "react";
import { Copy, Check, Pencil } from "lucide-react";
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
  useMentoradoShare,
  useCriarOuObterMentoradoShare,
  useToggleMentoradoShareAtivo,
  useAtualizarMentoradoShareSlug,
} from "@/hooks/useMentoradoShare";

export const ShareMentoradoDialog = ({
  mentoradoId,
  open,
  onOpenChange,
}: {
  mentoradoId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const { data: share } = useMentoradoShare(mentoradoId);
  const criar = useCriarOuObterMentoradoShare();
  const toggle = useToggleMentoradoShareAtivo();
  const atualizarSlug = useAtualizarMentoradoShareSlug();
  const [editandoSlug, setEditandoSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  useEffect(() => {
    setSlugInput(share?.slug ?? "");
  }, [share?.slug]);

  useEffect(() => {
    if (open && !share) {
      criar
        .mutateAsync(mentoradoId)
        .catch(() => toast({ title: "Erro ao gerar link", variant: "destructive" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, share]);

  const slugAtual = share?.slug || share?.token || "";
  const url = share ? `${window.location.origin}/m/${slugAtual}` : "Gerando...";

  const handleCopy = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 1500);
  };

  const salvarSlug = async () => {
    if (!share) return;
    const limpo = slugInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    if (limpo && limpo.length < 3) {
      toast({ title: "Use ao menos 3 caracteres", variant: "destructive" });
      return;
    }
    try {
      await atualizarSlug.mutateAsync({ id: share.id, slug: limpo || null });
      setSlugInput(limpo);
      setEditandoSlug(false);
      toast({ title: "Link personalizado salvo!" });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "";
      toast({
        title: msg.includes("duplicate") ? "Esse link já está em uso" : "Erro ao salvar link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Compartilhar mentorado</DialogTitle>
          <DialogDescription>
            Um único link com todas as guias que você ativar com o olho.
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
            <div className="space-y-1.5">
              <Label className="text-xs">Personalizar link</Label>
              {editandoSlug ? (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/m/</span>
                  <Input
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    placeholder="mentorado-x"
                    className="text-xs h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={salvarSlug} disabled={atualizarSlug.isPending}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSlugInput(share.slug ?? "");
                      setEditandoSlug(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {share.slug ? `/m/${share.slug}` : "Usando link gerado automaticamente"}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setEditandoSlug(true)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    {share.slug ? "Editar" : "Personalizar"}
                  </Button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Apenas letras, números e hífen. Mín. 3 caracteres.
              </p>
            </div>
          )}
          {share && (
            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="m-share-ativo" className="text-xs">
                Link ativo
              </Label>
              <Switch
                id="m-share-ativo"
                checked={share.ativo}
                onCheckedChange={(v) => toggle.mutate({ id: share.id, ativo: v })}
              />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground border-t pt-2">
            Dica: use o ícone de olho ao lado de cada guia para escolher quais o mentorado verá ao
            abrir este link.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};