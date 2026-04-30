import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Viral, useUpdateViral } from "@/hooks/useVirais";

interface Props {
  viral: Viral | null;
  onClose: () => void;
}

export const ViralEditDialog = ({ viral, onClose }: Props) => {
  const update = useUpdateViral();
  const [headline, setHeadline] = useState("");
  const [estrutura, setEstrutura] = useState("");
  const [views, setViews] = useState("0");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (viral) {
      setHeadline(viral.headline || "");
      setEstrutura(viral.estrutura || "");
      setViews(String(viral.views ?? 0));
      setLink(viral.link || "");
    }
  }, [viral]);

  if (!viral) return null;

  const save = async () => {
    await update.mutateAsync({
      id: viral.id,
      headline: headline.trim(),
      estrutura: estrutura.trim() || null,
      views: parseInt(views || "0", 10) || 0,
      link: link.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={!!viral} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar viral</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Headline</Label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label>Estrutura</Label>
            <Input
              value={estrutura}
              onChange={(e) => setEstrutura(e.target.value)}
            />
          </div>
          <div>
            <Label>Views</Label>
            <Input
              type="number"
              min={0}
              value={views}
              onChange={(e) => setViews(e.target.value)}
            />
          </div>
          <div>
            <Label>Link</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={
              update.isPending ||
              !headline.trim() ||
              !link.trim()
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};