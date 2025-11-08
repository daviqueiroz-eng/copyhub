import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTreinamento, useUpdateTreinamento, Treinamento } from "@/hooks/useTreinamentos";

interface TreinamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treinamento?: Treinamento;
}

const TreinamentoFormDialog = ({ open, onOpenChange, treinamento }: TreinamentoFormDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [ordem, setOrdem] = useState(0);

  const createMutation = useCreateTreinamento();
  const updateMutation = useUpdateTreinamento();

  useEffect(() => {
    if (treinamento) {
      setTitulo(treinamento.titulo);
      setDescricao(treinamento.descricao);
      setThumbnailUrl(treinamento.thumbnail_url || "");
      setOrdem(treinamento.ordem);
    } else {
      setTitulo("");
      setDescricao("");
      setThumbnailUrl("");
      setOrdem(0);
    }
  }, [treinamento, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      titulo,
      descricao,
      thumbnail_url: thumbnailUrl || null,
      ordem,
    };

    if (treinamento) {
      await updateMutation.mutateAsync({ id: treinamento.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {treinamento ? "Editar Treinamento" : "Novo Treinamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">URL da Thumbnail (opcional)</Label>
            <Input
              id="thumbnail"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
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
              {treinamento ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TreinamentoFormDialog;
