import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Grupo } from "@/hooks/useGrupos";
import { useGrupoAtividades, useCreateGrupoAtividade, useUpdateGrupoAtividade, useDeleteGrupoAtividade } from "@/hooks/useGruposAtividades";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GrupoAtividadesSectionProps {
  grupo: Grupo;
  isOwner: boolean;
}

export function GrupoAtividadesSection({ grupo, isOwner }: GrupoAtividadesSectionProps) {
  const { data: atividades = [], isLoading } = useGrupoAtividades(grupo.id);
  const createAtividade = useCreateGrupoAtividade();
  const updateAtividade = useUpdateGrupoAtividade();
  const deleteAtividade = useDeleteGrupoAtividade();

  const [showAddForm, setShowAddForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDataLimite, setNovaDataLimite] = useState("");

  const handleCreate = async () => {
    if (!novoTitulo.trim()) {
      toast({ title: "Digite o título da atividade", variant: "destructive" });
      return;
    }

    try {
      await createAtividade.mutateAsync({
        grupo_id: grupo.id,
        titulo: novoTitulo.trim(),
        data_limite: novaDataLimite || undefined,
      });
      toast({ title: "Atividade criada!" });
      setShowAddForm(false);
      setNovoTitulo("");
      setNovaDataLimite("");
    } catch (error: any) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleConcluida = async (id: string, concluida: boolean) => {
    try {
      await updateAtividade.mutateAsync({
        id,
        grupo_id: grupo.id,
        concluida: !concluida,
      });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Atividades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {atividades.map((atividade) => (
          <div
            key={atividade.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              atividade.concluida ? 'bg-muted/50' : 'bg-background'
            }`}
          >
            <Checkbox
              checked={atividade.concluida}
              onCheckedChange={() => handleToggleConcluida(atividade.id, atividade.concluida)}
            />
            <div className="flex-1">
              <span className={atividade.concluida ? 'line-through text-muted-foreground' : ''}>
                {atividade.titulo}
              </span>
              {atividade.data_limite && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (até {format(parseISO(atividade.data_limite), "dd/MM", { locale: ptBR })})
                </span>
              )}
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteAtividade.mutate({ id: atividade.id, grupo_id: grupo.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {atividades.length === 0 && !showAddForm && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma atividade cadastrada
          </p>
        )}

        {showAddForm ? (
          <div className="flex gap-2 pt-2">
            <Input
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              placeholder="Título da atividade"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Input
              type="date"
              value={novaDataLimite}
              onChange={(e) => setNovaDataLimite(e.target.value)}
              className="w-36"
            />
            <Button onClick={handleCreate} disabled={createAtividade.isPending}>
              {createAtividade.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : isOwner && (
          <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova atividade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
