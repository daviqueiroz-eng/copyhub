import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Calendar, AlertCircle } from "lucide-react";
import { useAtividadesGerais, useCreateAtividadeGeral, useUpdateAtividadeGeral, useDeleteAtividadeGeral, useMarcarTodasComoVistas } from "@/hooks/useAtividadesGerais";
import { useUserRole } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AtividadeFormData {
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  data_limite: string;
}

export const AtividadesGerais = () => {
  const { data: atividades, isLoading } = useAtividadesGerais();
  const { data: userRole } = useUserRole();
  const createMutation = useCreateAtividadeGeral();
  const updateMutation = useUpdateAtividadeGeral();
  const deleteMutation = useDeleteAtividadeGeral();
  const marcarTodasMutation = useMarcarTodasComoVistas();
  const isAdmin = userRole === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AtividadeFormData>({
    titulo: "",
    descricao: "",
    tipo: "geral",
    prioridade: "media",
    data_limite: "",
  });

  // Marcar todas como visualizadas quando entrar na aba
  useEffect(() => {
    if (atividades && atividades.length > 0) {
      const ids = atividades.map((a) => a.id);
      marcarTodasMutation.mutate(ids);
    }
  }, [atividades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
        data_limite: formData.data_limite || null,
      });
    } else {
      await createMutation.mutateAsync({
        ...formData,
        data_limite: formData.data_limite || null,
        anexos: [],
      });
    }

    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      titulo: "",
      descricao: "",
      tipo: "geral",
      prioridade: "media",
      data_limite: "",
    });
  };

  const handleEdit = (atividade: any) => {
    setEditingId(atividade.id);
    setFormData({
      titulo: atividade.titulo,
      descricao: atividade.descricao || "",
      tipo: atividade.tipo,
      prioridade: atividade.prioridade,
      data_limite: atividade.data_limite || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta atividade?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      baixa: "secondary",
      media: "default",
      alta: "destructive",
    };
    return <Badge variant={variants[prioridade] || "default"}>{prioridade.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando atividades...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Atividades Gerais</h2>
          <p className="text-muted-foreground">
            Atividades criadas pela administração para toda a equipe
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setFormData({
                  titulo: "",
                  descricao: "",
                  tipo: "geral",
                  prioridade: "media",
                  data_limite: "",
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Atividade" : "Nova Atividade Geral"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger id="tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral</SelectItem>
                        <SelectItem value="tarefa">Tarefa</SelectItem>
                        <SelectItem value="aviso">Aviso</SelectItem>
                        <SelectItem value="evento">Evento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select value={formData.prioridade} onValueChange={(value) => setFormData({ ...formData, prioridade: value })}>
                      <SelectTrigger id="prioridade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="data_limite">Data Limite</Label>
                  <Input
                    id="data_limite"
                    type="date"
                    value={formData.data_limite}
                    onChange={(e) => setFormData({ ...formData, data_limite: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingId ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!atividades || atividades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma atividade geral foi criada ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {atividades.map((atividade) => (
            <Card key={atividade.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{atividade.titulo}</CardTitle>
                    <div className="flex gap-2">
                      {getPrioridadeBadge(atividade.prioridade)}
                      <Badge variant="outline">{atividade.tipo}</Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(atividade)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(atividade.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {atividade.descricao && (
                  <CardDescription className="mb-3">
                    {atividade.descricao}
                  </CardDescription>
                )}
                {atividade.data_limite && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(atividade.data_limite), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
