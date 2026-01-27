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
  useTiposChatRevisao,
  useCreateTipoChatRevisao,
  useUpdateTipoChatRevisao,
  useDeleteTipoChatRevisao,
  TipoChatRevisao,
} from "@/hooks/useTiposChatRevisao";

interface TiposChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TiposChatDialog = ({ open, onOpenChange }: TiposChatDialogProps) => {
  const { data: tiposChat = [], isLoading } = useTiposChatRevisao();
  const createTipoChat = useCreateTipoChatRevisao();
  const updateTipoChat = useUpdateTipoChatRevisao();
  const deleteTipoChat = useDeleteTipoChatRevisao();

  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoPrompt, setNovoPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  const handleCreate = async () => {
    if (!novoNome.trim()) {
      toast({ title: "Digite um nome para o tipo de chat", variant: "destructive" });
      return;
    }

    try {
      await createTipoChat.mutateAsync({
        nome: novoNome.trim(),
        descricao: novaDescricao.trim() || undefined,
        prompt_sistema: novoPrompt.trim() || undefined,
      });
      setNovoNome("");
      setNovaDescricao("");
      setNovoPrompt("");
      toast({ title: "Tipo de chat criado!" });
    } catch {
      toast({ title: "Erro ao criar tipo de chat", variant: "destructive" });
    }
  };

  const handleStartEdit = (tipo: TipoChatRevisao) => {
    setEditingId(tipo.id);
    setEditNome(tipo.nome);
    setEditDescricao(tipo.descricao || "");
    setEditPrompt(tipo.prompt_sistema || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editNome.trim()) return;

    try {
      await updateTipoChat.mutateAsync({
        id: editingId,
        nome: editNome.trim(),
        descricao: editDescricao.trim() || null,
        prompt_sistema: editPrompt.trim() || null,
      });
      setEditingId(null);
      toast({ title: "Tipo de chat atualizado!" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTipoChat.mutateAsync(id);
      toast({ title: "Tipo de chat removido!" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Tipos de Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Form para criar novo */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30 shrink-0">
            <div>
              <Label htmlFor="novo-nome">Nome do tipo</Label>
              <Input
                id="novo-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Objetivo, Criativo, Corretor"
              />
            </div>
            <div>
              <Label htmlFor="nova-descricao">Descrição (opcional)</Label>
              <Input
                id="nova-descricao"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Breve descrição do comportamento"
              />
            </div>
            <div>
              <Label htmlFor="novo-prompt">Prompt do Sistema (opcional)</Label>
              <Textarea
                id="novo-prompt"
                value={novoPrompt}
                onChange={(e) => setNovoPrompt(e.target.value)}
                placeholder="Instruções de como a IA deve se comportar neste modo"
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={createTipoChat.isPending || !novoNome.trim()}
              className="w-full"
            >
              {createTipoChat.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </div>

          {/* Lista de tipos existentes */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {isLoading && (
                <div className="text-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              )}

              {tiposChat.map((tipo) => (
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
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="Prompt do sistema"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateTipoChat.isPending}
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
                        {tipo.prompt_sistema && (
                          <p className="text-xs text-muted-foreground/70 truncate mt-1">
                            Prompt: {tipo.prompt_sistema.substring(0, 50)}...
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
                          disabled={deleteTipoChat.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!isLoading && tiposChat.length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum tipo de chat cadastrado. O modo "Padrão" será usado.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
