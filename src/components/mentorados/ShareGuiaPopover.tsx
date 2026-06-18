import { useEffect, useState } from "react";
import { Copy, Check, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  useAtualizarShareSlug,
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
  const [copiedConteudo, setCopiedConteudo] = useState(false);
  const [copiandoConteudo, setCopiandoConteudo] = useState(false);
  const { data: share } = useRoteiroShare(mentoradoId, guiaNumero);
  const criar = useCriarOuObterShare();
  const toggle = useToggleShareAtivo();
  const atualizarSlug = useAtualizarShareSlug();
  const [editandoSlug, setEditandoSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  useEffect(() => {
    setSlugInput(share?.slug ?? "");
  }, [share?.slug]);

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

  const slugAtual = share?.slug || share?.token || "";
  const url = share
    ? `${window.location.origin}/r/${slugAtual}`
    : "Gerando...";

  const handleCopy = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyConteudo = async () => {
    try {
      setCopiandoConteudo(true);
      const { data, error } = await supabase
        .from("mentorados_roteiros")
        .select("ordem, headline, estrutura, link_referencia")
        .eq("mentorado_id", mentoradoId)
        .eq("guia_numero", guiaNumero)
        .order("ordem", { ascending: true });
      if (error) throw error;

      const rows = (data ?? []).filter(
        (r) => (r.headline ?? "").trim() || (r.estrutura ?? "").trim()
      );
      if (rows.length === 0) {
        toast({ title: "Nenhum roteiro nesta guia", variant: "destructive" });
        return;
      }

      const GOLD = "#B8860B";
      const pad = (n: number) => String(n).padStart(2, "0");

      const htmlParts: string[] = [];
      const textParts: string[] = [];

      rows.forEach((r, idx) => {
        const n = pad(idx + 1);
        const headline = (r.headline ?? "").trim();
        const estrutura = (r.estrutura ?? "").trim();
        const linkRef = (r.link_referencia ?? "").trim();

        htmlParts.push(
          `<p><strong style="color:${GOLD}">HEADLINE ${n}</strong></p>` +
            `<p>${headline.replace(/\n/g, "<br>")}</p>`
        );
        textParts.push(`HEADLINE ${n}`, headline);

        if (linkRef) {
          htmlParts.push(
            `<p><strong style="color:${GOLD}">REFERÊNCIA ${n}</strong></p>` +
              `<p>${linkRef}</p>`
          );
          textParts.push("", `REFERÊNCIA ${n}`, linkRef);
        }

        if (estrutura) {
          htmlParts.push(
            `<p><strong style="color:${GOLD}">ESTRUTURA ${n}</strong></p>` +
              `<p>${estrutura.replace(/\n/g, "<br>")}</p>`
          );
          textParts.push("", `ESTRUTURA ${n}`, estrutura);
        }

        htmlParts.push("<p><br></p>");
        textParts.push("", "");
      });

      const html = htmlParts.join("");
      const text = textParts.join("\n");

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } catch {
        await navigator.clipboard.writeText(text);
      }

      setCopiedConteudo(true);
      toast({ title: "Conteúdo copiado com referências!" });
      setTimeout(() => setCopiedConteudo(false), 2000);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "Erro ao copiar";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setCopiandoConteudo(false);
    }
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
      await atualizarSlug.mutateAsync({
        id: share.id,
        slug: limpo || null,
      });
      setSlugInput(limpo);
      setEditandoSlug(false);
      toast({ title: "Link personalizado salvo!" });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || "";
      toast({
        title: msg.includes("duplicate")
          ? "Esse link já está em uso"
          : "Erro ao salvar link",
        variant: "destructive",
      });
    }
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
            <div className="space-y-1.5">
              <Label className="text-xs">Personalizar link</Label>
              {editandoSlug ? (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    /r/
                  </span>
                  <Input
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    placeholder="meu-mentorado"
                    className="text-xs h-8"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={salvarSlug}
                    disabled={atualizarSlug.isPending}
                  >
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
                    {share.slug
                      ? `/r/${share.slug}`
                      : "Usando link gerado automaticamente"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditandoSlug(true)}
                  >
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
          <div className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCopyConteudo}
              disabled={copiandoConteudo}
              style={{ borderColor: "#B8860B", color: "#B8860B" }}
            >
              {copiedConteudo ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {copiedConteudo
                ? "Copiado com referências"
                : "Copiar conteúdo com referências"}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              Copia headlines, referências e estruturas desta guia.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
