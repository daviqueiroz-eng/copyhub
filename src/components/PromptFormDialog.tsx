import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreatePrompt, useUpdatePrompt, type Prompt } from "@/hooks/usePrompts";
import { useToast } from "@/hooks/use-toast";

interface PromptFormDialogProps {
  prompt?: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptFormDialog = ({ prompt, open, onOpenChange }: PromptFormDialogProps) => {
  const { toast } = useToast();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    nicho: "",
    youtube_url: "",
    comentarios: "",
    conteudo: "",
  });

  useEffect(() => {
    if (prompt) {
      setFormData({
        titulo: prompt.titulo,
        descricao: prompt.descricao,
        nicho: prompt.nicho,
        youtube_url: prompt.youtube_url,
        comentarios: prompt.comentarios || "",
        conteudo: prompt.conteudo,
      });
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        nicho: "",
        youtube_url: "",
        comentarios: "",
        conteudo: "",
      });
    }
  }, [prompt, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.descricao || !formData.nicho || !formData.youtube_url || !formData.conteudo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (prompt) {
        await updatePrompt.mutateAsync({ id: prompt.id, ...formData });
      } else {
        await createPrompt.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prompt ? "Editar Prompt" : "Novo Prompt"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Prompt de Headlines Emocionais"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Breve descrição do que o prompt faz"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="nicho">Nicho *</Label>
            <Input
              id="nicho"
              value={formData.nicho}
              onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
              placeholder="Ex: Geral, Instagram, Email Marketing"
            />
          </div>

          <div>
            <Label htmlFor="youtube_url">Link do YouTube *</Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <Label htmlFor="comentarios">Comentários do Instrutor</Label>
            <Textarea
              id="comentarios"
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              placeholder="Dicas, observações e instruções sobre como usar este prompt..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="conteudo">Conteúdo do Prompt *</Label>
            <Textarea
              id="conteudo"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Cole aqui o prompt completo..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPrompt.isPending || updatePrompt.isPending}>
              {prompt ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
