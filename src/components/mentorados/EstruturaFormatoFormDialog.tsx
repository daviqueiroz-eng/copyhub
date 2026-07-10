import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateFormato, useUpdateFormato, EstruturaFormato } from "@/hooks/useEstruturaFormatos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formato?: EstruturaFormato | null;
}

export const EstruturaFormatoFormDialog = ({ open, onOpenChange, formato }: Props) => {
  const [nome, setNome] = useState("");
  const [ordem, setOrdem] = useState("0");
  const create = useCreateFormato();
  const update = useUpdateFormato();

  useEffect(() => {
    if (open) {
      setNome(formato?.nome ?? "");
      setOrdem(String(formato?.ordem ?? 0));
    }
  }, [open, formato]);

  const save = async () => {
    if (!nome.trim()) return;
    if (formato) {
      await update.mutateAsync({ id: formato.id, nome: nome.trim(), ordem: parseInt(ordem) || 0 });
    } else {
      await create.mutateAsync({ nome: nome.trim(), ordem: parseInt(ordem) || 0 });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formato ? "Editar formato" : "Novo formato"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Lista útil" />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!nome.trim() || create.isPending || update.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};