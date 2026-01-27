import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, Loader2, Edit2, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useTiposAjuste,
  useCreateTipoAjuste,
  useUpdateTipoAjuste,
  useDeleteTipoAjuste,
  TipoAjuste,
} from "@/hooks/useTiposAjuste";

interface TiposAjusteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TiposAjusteDialog = ({ open, onOpenChange }: TiposAjusteDialogProps) => {
  const { data: tiposAjuste = [], isLoading } = useTiposAjuste();
  const createTipoAjuste = useCreateTipoAjuste();
  const updateTipoAjuste = useUpdateTipoAjuste();
  const deleteTipoAjuste = useDeleteTipoAjuste();

  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novasInstrucoes, setNovasInstrucoes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editInstrucoes, setEditInstrucoes] = useState("");

  const handleCreate = async () => {
    if (!novoNome.trim()) {
      toast({ title: "Digite um nome para o ajuste", variant: "destructive" });
      return;
    }

    try {
      await createTipoAjuste.mutateAsync({
        nome: novoNome.trim(),
        descricao: novaDescricao.trim() || undefined,
        instrucoes: novasInstrucoes.trim() || undefined,
      });
      setNovoNome("");
      setNovaDescricao("");
      setNovasInstrucoes("");
      toast({ title: "Tipo de ajuste criado!" });
    } catch {
      toast({ title: "Erro ao criar tipo de ajuste", variant: "destructive" });
    }
  };

  const handleStartEdit = (tipo: TipoAjuste) => {
    setEditingId(tipo.id);
    setEditNome(tipo.nome);
    setEditDescricao(tipo.descricao || "");
    setEditInstrucoes(tipo.instrucoes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editNome.trim()) return;

    try {
      await updateTipoAjuste.mutateAsync({
        id: editingId,
        nome: editNome.trim(),
        descricao: editDescricao.trim() || null,
        instrucoes: editInstrucoes.trim() || null,
      });
      setEditingId(null);
      toast({ title: "Tipo de ajuste atualizado!" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTipoAjuste.mutateAsync(id);
      toast({ title: "Tipo de ajuste removido!" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Tipos de Ajuste</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form para criar novo */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="novo-nome">Nome do ajuste</Label>
              <Input
                id="novo-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Falta valor prático"
              />
            </div>
            <div>
              <Label htmlFor="nova-descricao">Descrição (opcional)</Label>
              <Input
                id="nova-descricao"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Breve descrição do ajuste"
              />
            </div>
            <div>
              <Label htmlFor="novas-instrucoes">Instruções para IA (opcional)</Label>
              <Textarea
                id="novas-instrucoes"
                value={novasInstrucoes}
                onChange={(e) => setNovasInstrucoes(e.target.value)}
                placeholder="Instruções detalhadas para a IA executar o ajuste"
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={createTipoAjuste.isPending || !novoNome.trim()}
              className="w-full"
            >
              {createTipoAjuste.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </div>

          {/* Lista de tipos existentes */}
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {isLoading && (
                <div className="text-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              )}

              {tiposAjuste.map((tipo) => (
                <div
                  key={tipo.id}
                  className="p-3 border rounded-lg bg-background"
                >
                  {editingId === tipo.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        placeholder="Nome"
                      />
                      <Input
                        value={editDescricao}
                        onChange={(e) => setEditDescricao(e.target.value)}
                        placeholder="Descrição"
                      />
                      <Textarea
                        value={editInstrucoes}
                        onChange={(e) => setEditInstrucoes(e.target.value)}
                        placeholder="Instruções para IA"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateTipoAjuste.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{tipo.nome}</p>
                        {tipo.descricao && (
                          <p className="text-sm text-muted-foreground truncate">
                            {tipo.descricao}
                          </p>
                        )}
                        {tipo.instrucoes && (
                          <p className="text-xs text-muted-foreground/70 truncate mt-1">
                            IA: {tipo.instrucoes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(tipo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(tipo.id)}
                          disabled={deleteTipoAjuste.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!isLoading && tiposAjuste.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum tipo de ajuste cadastrado
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
