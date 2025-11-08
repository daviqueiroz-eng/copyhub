import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateModulo, useUpdateModulo, Modulo } from "@/hooks/useModulos";

interface ModuloFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treinamentoId: string;
  modulo?: Modulo;
}

const ModuloFormDialog = ({ open, onOpenChange, treinamentoId, modulo }: ModuloFormDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [ordem, setOrdem] = useState(0);

  const createMutation = useCreateModulo();
  const updateMutation = useUpdateModulo();

  useEffect(() => {
    if (modulo) {
      setTitulo(modulo.titulo);
      setOrdem(modulo.ordem);
    } else {
      setTitulo("");
      setOrdem(0);
    }
  }, [modulo, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      titulo,
      ordem,
      treinamento_id: treinamentoId,
    };

    if (modulo) {
      await updateMutation.mutateAsync({ id: modulo.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {modulo ? "Editar Módulo" : "Novo Módulo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Módulo</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem</Label>
            <Input
              id="ordem"
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {modulo ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuloFormDialog;
