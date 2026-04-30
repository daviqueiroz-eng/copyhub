import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNichos, useCreateNicho } from "@/hooks/useNichos";
import {
  FORMATOS_VIRAL,
  NewViralInput,
  useCreateViraisBulk,
} from "@/hooks/useVirais";
import { toast } from "sonner";
import { ViralAprovadoToast } from "./ViralAprovadoToast";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

type Bloco = {
  uid: string;
  nicho_id: string;
  headline: string;
  formato: string;
  estrutura: string;
  views: string;
  link: string;
};

const blocoVazio = (): Bloco => ({
  uid: crypto.randomUUID(),
  nicho_id: "",
  headline: "",
  formato: "",
  estrutura: "",
  views: "",
  link: "",
});

export const ViralRegistrarDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { data: nichos = [] } = useNichos();
  const createNicho = useCreateNicho();
  const createBulk = useCreateViraisBulk();

  const [blocos, setBlocos] = useState<Bloco[]>([blocoVazio()]);
  const [novoNichoTextoPorBloco, setNovoNichoTextoPorBloco] = useState<
    Record<string, string>
  >({});
  const [criandoNichoBloco, setCriandoNichoBloco] = useState<string | null>(
    null
  );

  const updateBloco = (uid: string, patch: Partial<Bloco>) => {
    setBlocos((b) => b.map((x) => (x.uid === uid ? { ...x, ...patch } : x)));
  };

  const removeBloco = (uid: string) => {
    setBlocos((b) => (b.length > 1 ? b.filter((x) => x.uid !== uid) : b));
  };

  const addBloco = () => setBlocos((b) => [...b, blocoVazio()]);

  const handleCreateNichoBloco = async (uid: string) => {
    const nome = (novoNichoTextoPorBloco[uid] || "").trim();
    if (!nome) return;
    const created = await createNicho.mutateAsync(nome);
    if (created?.id) {
      updateBloco(uid, { nicho_id: created.id });
    }
    setNovoNichoTextoPorBloco((s) => ({ ...s, [uid]: "" }));
    setCriandoNichoBloco(null);
  };

  const validar = (b: Bloco): string | null => {
    if (!b.nicho_id) return "Selecione o nicho";
    if (!b.headline.trim()) return "Headline obrigatória";
    if (!b.formato) return "Formato obrigatório";
    const v = parseInt(b.views, 10);
    if (isNaN(v) || v < 0) return "Views inválido";
    if (!b.link.trim()) return "Link obrigatório";
    try {
      new URL(b.link.trim());
    } catch {
      return "Link inválido";
    }
    return null;
  };

  const submit = async () => {
    for (const b of blocos) {
      const err = validar(b);
      if (err) {
        toast.error(`Bloco inválido: ${err}`);
        return;
      }
    }
    const payload: NewViralInput[] = blocos.map((b) => ({
      nicho_id: b.nicho_id,
      headline: b.headline.trim(),
      formato: b.formato,
      estrutura: b.estrutura.trim() || null,
      views: parseInt(b.views, 10) || 0,
      link: b.link.trim(),
    }));
    const created = await createBulk.mutateAsync(payload);
    // Toast de viral aprovado para o autor (1 por viral, com stagger leve)
    (created || payload).forEach((_, i) => {
      setTimeout(() => {
        toast.custom(
          () => <ViralAprovadoToast onClick={() => navigate("/virais")} />,
          { duration: 6000 }
        );
      }, i * 250);
    });
    setBlocos([blocoVazio()]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar novo viral</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {blocos.map((b, idx) => (
            <div
              key={b.uid}
              className="border rounded-lg p-4 relative bg-card"
            >
              {blocos.length > 1 && (
                <button
                  className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded text-destructive"
                  onClick={() => removeBloco(b.uid)}
                  title="Remover este viral"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="grid grid-cols-3 gap-3">
                {/* Nicho */}
                <div className="col-span-1">
                  <Label className="text-xs">Nicho *</Label>
                  <div className="flex gap-1">
                    <Select
                      value={b.nicho_id}
                      onValueChange={(v) => updateBloco(b.uid, { nicho_id: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {nichos.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-2"
                      onClick={() =>
                        setCriandoNichoBloco(
                          criandoNichoBloco === b.uid ? null : b.uid
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {criandoNichoBloco === b.uid && (
                    <div className="flex gap-1 mt-1">
                      <Input
                        placeholder="Novo nicho"
                        className="h-8 text-sm"
                        value={novoNichoTextoPorBloco[b.uid] || ""}
                        onChange={(e) =>
                          setNovoNichoTextoPorBloco((s) => ({
                            ...s,
                            [b.uid]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateNichoBloco(b.uid);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => handleCreateNichoBloco(b.uid)}
                      >
                        OK
                      </Button>
                    </div>
                  )}
                </div>

                {/* Headline */}
                <div className="col-span-1">
                  <Label className="text-xs">Headline *</Label>
                  <Input
                    value={b.headline}
                    onChange={(e) =>
                      updateBloco(b.uid, { headline: e.target.value })
                    }
                    className="h-9"
                  />
                </div>

                {/* Formato */}
                <div className="col-span-1">
                  <Label className="text-xs">Formato *</Label>
                  <Select
                    value={b.formato}
                    onValueChange={(v) => updateBloco(b.uid, { formato: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATOS_VIRAL.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1">
                  <Label className="text-xs">Estrutura (opcional)</Label>
                  <Input
                    value={b.estrutura}
                    onChange={(e) =>
                      updateBloco(b.uid, { estrutura: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Views *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={b.views}
                    onChange={(e) =>
                      updateBloco(b.uid, { views: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Link *</Label>
                  <Input
                    placeholder="https://"
                    value={b.link}
                    onChange={(e) => updateBloco(b.uid, { link: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addBloco}
            className="border-2 border-dashed rounded-lg p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Registrar mais um viral
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={createBulk.isPending}>
            {createBulk.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};