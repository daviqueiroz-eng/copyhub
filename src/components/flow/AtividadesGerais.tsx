import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Calendar, AlertCircle, CheckSquare, X, BarChart3 } from "lucide-react";
import { useAtividadesGerais, useCreateAtividadeGeral, useUpdateAtividadeGeral, useDeleteAtividadeGeral, useMarcarTodasComoVistas, type ChecklistItem } from "@/hooks/useAtividadesGerais";
import { useUserRole } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AtividadesGeraisStatus } from "./AtividadesGeraisStatus";
import { toast } from "sonner";

interface AtividadeFormData {
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  data_limite: string;
  checklist: ChecklistItem[];
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
    checklist: [],
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({
      ...formData,
      checklist: [
        ...formData.checklist,
        {
          id: crypto.randomUUID(),
          texto: newChecklistItem.trim(),
          concluida: false,
        },
      ],
    });
    setNewChecklistItem("");
  };

  const removeChecklistItem = (id: string) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((item) => item.id !== id),
    });
  };

  // Marcar todas como visualizadas quando entrar na aba
  useEffect(() => {
    if (atividades && atividades.length > 0) {
      const ids = atividades.map((a) => a.id);
      marcarTodasMutation.mutate(ids);
    }
  }, [atividades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error("Preencha o título da atividade");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
          data_limite: formData.data_limite || null,
          descricao: formData.descricao || null,
        });
        toast.success("Atividade atualizada!");
      } else {
        await createMutation.mutateAsync({
          ...formData,
          data_limite: formData.data_limite || null,
          descricao: formData.descricao || null,
          anexos: [],
        });
        toast.success("Atividade criada!");
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "geral",
        prioridade: "media",
        data_limite: "",
        checklist: [],
      });
    } catch (error) {
      toast.error("Erro ao salvar atividade");
    }
  };

  const handleEdit = (atividade: any) => {
    setEditingId(atividade.id);
    setFormData({
      titulo: atividade.titulo,
      descricao: atividade.descricao || "",
      tipo: atividade.tipo,
      prioridade: atividade.prioridade,
      data_limite: atividade.data_limite || "",
      checklist: atividade.checklist || [],
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
    <div className="space-y-4">
      <Tabs defaultValue="atividades" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="atividades">
            <CheckSquare className="h-4 w-4 mr-2" />
            Atividades
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="acompanhamento">
              <BarChart3 className="h-4 w-4 mr-2" />
              Acompanhamento
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="atividades" className="space-y-4">
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => {
                  setEditingId(null);
                  setFormData({
                    titulo: "",
                    descricao: "",
                    tipo: "geral",
                    prioridade: "media",
                    data_limite: "",
                    checklist: [],
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Atividade Geral
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

                <div className="space-y-2">
                  <Label>Checklist (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar item no checklist..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addChecklistItem}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.checklist.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{item.texto}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChecklistItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
              {atividades.map((atividade) => {
                const checklistTotal = atividade.checklist?.length || 0;
                const checklistCompleted = atividade.checklist?.filter(item => item.concluida).length || 0;
                const checklistProgress = checklistTotal > 0 
                  ? Math.round((checklistCompleted / checklistTotal) * 100) 
                  : 0;

                return (
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

                  {checklistTotal > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {checklistCompleted}/{checklistTotal} concluídos ({checklistProgress}%)
                      </span>
                    </div>
                  )}

                  {atividade.data_limite && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(new Date(atividade.data_limite), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </TabsContent>

    {isAdmin && (
      <TabsContent value="acompanhamento">
        <AtividadesGeraisStatus />
      </TabsContent>
    )}
  </Tabs>
</div>
);
};
