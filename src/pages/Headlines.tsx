import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus, Trash2, Pencil, Copy } from "lucide-react";
import { usePlanilhas, useCreatePlanilha, useUpdatePlanilha, useDeletePlanilha } from "@/hooks/usePlanilhas";
import { useToast } from "@/hooks/use-toast";

const Headlines = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");

  const { data: planilhas, isLoading } = usePlanilhas();
  const createPlanilha = useCreatePlanilha();
  const updatePlanilha = useUpdatePlanilha();
  const deletePlanilha = useDeletePlanilha();
  const { toast } = useToast();

  const handleCopyLink = (link: string, nome: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: `O link de "${nome}" foi copiado para a área de transferência.`,
    });
  };

  const handleCreate = () => {
    if (!nome || !link) return;

    const maxOrdem = planilhas?.reduce((max, p) => Math.max(max, p.ordem), 0) || 0;
    
    createPlanilha.mutate(
      { nome, link, ordem: maxOrdem + 1 },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNome("");
          setLink("");
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editingId || !nome || !link) return;

    updatePlanilha.mutate(
      { id: editingId, nome, link },
      {
        onSuccess: () => {
          setEditingId(null);
          setNome("");
          setLink("");
        },
      }
    );
  };

  const openEditDialog = (id: string, currentNome: string, currentLink: string) => {
    setEditingId(id);
    setNome(currentNome);
    setLink(currentLink);
  };

  const closeEditDialog = () => {
    setEditingId(null);
    setNome("");
    setLink("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando planilhas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Planilhas Importantes</h1>
        <p className="text-muted-foreground">
          Gerencie e acesse suas planilhas essenciais
        </p>
      </div>

      <div className="mb-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Planilha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Planilha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="nome">Nome da Planilha</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Planilha dos Virais"
                />
              </div>
              <div>
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {planilhas?.map((planilha, index) => (
          <Card key={planilha.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{planilha.nome}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-sm text-primary hover:underline"
                      onClick={() => handleCopyLink(planilha.link, planilha.nome)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar link
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(planilha.id, planilha.nome, planilha.link)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlanilha.mutate(planilha.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Planilha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-nome">Nome da Planilha</Label>
              <Input
                id="edit-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Planilha dos Virais"
              />
            </div>
            <div>
              <Label htmlFor="edit-link">Link</Label>
              <Input
                id="edit-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Headlines;
