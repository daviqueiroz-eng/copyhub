import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import {
  useTiposRoteiro,
  useCreateTipoRoteiro,
  useDeleteTipoRoteiro,
} from "@/hooks/useTiposRoteiro";

interface TipoRoteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headlinesCount: number;
  onConfirm: (tipoId: string, tipoNome: string) => void;
}

export const TipoRoteiroDialog = ({
  open,
  onOpenChange,
  headlinesCount,
  onConfirm,
}: TipoRoteiroDialogProps) => {
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [novoTipo, setNovoTipo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: tipos = [] } = useTiposRoteiro();
  const createTipo = useCreateTipoRoteiro();
  const deleteTipo = useDeleteTipoRoteiro();

  const handleAddTipo = () => {
    if (!novoTipo.trim()) return;
    createTipo.mutate({ nome: novoTipo.trim() });
    setNovoTipo("");
    setShowAddForm(false);
  };

  const handleConfirm = () => {
    const tipoSelecionado = tipos.find((t) => t.id === selectedTipo);
    if (tipoSelecionado) {
      onConfirm(selectedTipo, tipoSelecionado.nome);
    }
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTipo("");
      setNovoTipo("");
      setShowAddForm(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Roteiro</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            📝 {headlinesCount} headline{headlinesCount > 1 ? "s" : ""}{" "}
            selecionada{headlinesCount > 1 ? "s" : ""}
          </p>

          {tipos.length > 0 ? (
            <div className="space-y-3">
              <Label>Selecione o tipo de roteiro:</Label>
              <RadioGroup
                value={selectedTipo}
                onValueChange={setSelectedTipo}
                className="space-y-2"
              >
                {tipos.map((tipo) => (
                  <div
                    key={tipo.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={tipo.id} id={tipo.id} />
                      <Label htmlFor={tipo.id} className="cursor-pointer">
                        {tipo.nome}
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTipo.mutate(tipo.id);
                        if (selectedTipo === tipo.id) {
                          setSelectedTipo("");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum tipo cadastrado. Adicione um tipo abaixo.
            </p>
          )}

          <div className="border-t pt-4">
            {showAddForm ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do tipo..."
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddTipo}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setNovoTipo("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo tipo
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedTipo}>
            Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
