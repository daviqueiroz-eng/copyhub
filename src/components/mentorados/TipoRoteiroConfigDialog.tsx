import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTipoRoteiro, TipoRoteiro } from "@/hooks/useTiposRoteiro";
import { toast } from "sonner";

interface TipoRoteiroConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoRoteiro | null;
}

export const TipoRoteiroConfigDialog = ({
  open,
  onOpenChange,
  tipo,
}: TipoRoteiroConfigDialogProps) => {
  const [prompt, setPrompt] = useState("");
  const [template, setTemplate] = useState("");

  const updateTipo = useUpdateTipoRoteiro();

  // Sync state when tipo changes
  useEffect(() => {
    if (tipo) {
      setPrompt(tipo.prompt || "");
      setTemplate(tipo.template_estrutura || "");
    }
  }, [tipo]);

  const handleSave = () => {
    if (!tipo) return;
    updateTipo.mutate(
      {
        id: tipo.id,
        prompt: prompt || null,
        template_estrutura: template || null,
      },
      {
        onSuccess: () => {
          toast.success("Configurações salvas!");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Erro ao salvar configurações");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar: {tipo?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt / Instruções para IA</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite as instruções que serão enviadas para a IA gerar o roteiro..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Este prompt será enviado junto com as headlines selecionadas para gerar o roteiro.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Template de Estrutura (opcional)</Label>
            <Textarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="GANCHO:&#10;DESENVOLVIMENTO:&#10;CTA:"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Modelo de estrutura padrão que será usado como referência.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateTipo.isPending}>
            {updateTipo.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
