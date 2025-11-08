import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAula, useUpdateAula, Aula } from "@/hooks/useAulas";

interface AulaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduloId: string;
  aula?: Aula;
}

const AulaFormDialog = ({ open, onOpenChange, moduloId, aula }: AulaFormDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ordem, setOrdem] = useState(0);

  const createMutation = useCreateAula();
  const updateMutation = useUpdateAula();

  useEffect(() => {
    if (aula) {
      setTitulo(aula.titulo);
      setDescricao(aula.descricao);
      setYoutubeUrl(aula.youtube_url);
      setConteudo(aula.conteudo || "");
      setDuracao(aula.duracao || "");
      setOrdem(aula.ordem);
    } else {
      setTitulo("");
      setDescricao("");
      setYoutubeUrl("");
      setConteudo("");
      setDuracao("");
      setOrdem(0);
    }
  }, [aula, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      titulo,
      descricao,
      youtube_url: youtubeUrl,
      conteudo: conteudo || null,
      duracao: duracao || null,
      ordem,
      modulo_id: moduloId,
    };

    if (aula) {
      await updateMutation.mutateAsync({ id: aula.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {aula ? "Editar Aula" : "Nova Aula"}
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
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube">URL do YouTube</Label>
            <Input
              id="youtube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (opcional)</Label>
            <Input
              id="duracao"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="Ex: 15 min"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Notas/Materiais (opcional)</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
              placeholder="Notas adicionais, links úteis, etc."
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
              {aula ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AulaFormDialog;
