import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Copy, Settings } from "lucide-react";
import { usePlanilhas, useCreatePlanilha, useUpdatePlanilha, useDeletePlanilha } from "@/hooks/usePlanilhas";
import { useControleProducao, useCreateControleProducao, useUpdateControleProducao, useDeleteControleProducao } from "@/hooks/useControleProducao";
import { useMentoradosControle, useCreateMentoradoControle, useDeleteMentoradoControle } from "@/hooks/useMentoradosControle";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
const Headlines = () => {
  // Estados para Planilhas
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");

  // Estados para Controle de Produção
  const [isControleOpen, setIsControleOpen] = useState(false);
  const [editingControleId, setEditingControleId] = useState<string | null>(null);
  const [controleData, setControleData] = useState("");
  const [controleMentorado, setControleMentorado] = useState("");
  const [controleQuantidade, setControleQuantidade] = useState("");
  const [controleDificuldades, setControleDificuldades] = useState("");
  const [controleHoras, setControleHoras] = useState("");

  // Estados para Gerenciar Mentorados
  const [isMentoradosOpen, setIsMentoradosOpen] = useState(false);
  const [novoMentorado, setNovoMentorado] = useState("");
  const {
    data: planilhas,
    isLoading
  } = usePlanilhas();
  const createPlanilha = useCreatePlanilha();
  const updatePlanilha = useUpdatePlanilha();
  const deletePlanilha = useDeletePlanilha();
  const {
    data: controleProducao,
    isLoading: isLoadingControle
  } = useControleProducao();
  const createControle = useCreateControleProducao();
  const updateControle = useUpdateControleProducao();
  const deleteControle = useDeleteControleProducao();
  
  const {
    data: mentorados,
    isLoading: isLoadingMentorados
  } = useMentoradosControle();
  const createMentorado = useCreateMentoradoControle();
  const deleteMentorado = useDeleteMentoradoControle();
  
  const {
    toast
  } = useToast();
  const handleCopyLink = (link: string, nome: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: `O link de "${nome}" foi copiado para a área de transferência.`
    });
  };
  const handleCreate = () => {
    if (!nome || !link) return;
    const maxOrdem = planilhas?.reduce((max, p) => Math.max(max, p.ordem), 0) || 0;
    createPlanilha.mutate({
      nome,
      link,
      ordem: maxOrdem + 1
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNome("");
        setLink("");
      }
    });
  };
  const handleUpdate = () => {
    if (!editingId || !nome || !link) return;
    updatePlanilha.mutate({
      id: editingId,
      nome,
      link
    }, {
      onSuccess: () => {
        setEditingId(null);
        setNome("");
        setLink("");
      }
    });
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
  const handleCreateControle = () => {
    if (!controleData || !controleMentorado || !controleQuantidade || !controleHoras) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    createControle.mutate({
      data: controleData,
      mentorado: controleMentorado,
      quantidade_roteiros: controleQuantidade,
      maiores_dificuldades: controleDificuldades || null,
      horas_trabalhadas: controleHoras,
      plataformas: ""
    }, {
      onSuccess: () => {
        resetControleForm();
        setIsControleOpen(false);
      }
    });
  };
  const handleUpdateControle = () => {
    if (!editingControleId || !controleData || !controleMentorado || !controleQuantidade || !controleHoras) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    updateControle.mutate({
      id: editingControleId,
      data: controleData,
      mentorado: controleMentorado,
      quantidade_roteiros: controleQuantidade,
      maiores_dificuldades: controleDificuldades || null,
      horas_trabalhadas: controleHoras,
      plataformas: ""
    }, {
      onSuccess: () => {
        resetControleForm();
        setEditingControleId(null);
      }
    });
  };
  const openEditControle = (registro: any) => {
    setEditingControleId(registro.id);
    setControleData(registro.data);
    setControleMentorado(registro.mentorado);
    setControleQuantidade(registro.quantidade_roteiros);
    setControleDificuldades(registro.maiores_dificuldades || "");
    setControleHoras(registro.horas_trabalhadas);
  };
  const resetControleForm = () => {
    setControleData("");
    setControleMentorado("");
    setControleQuantidade("");
    setControleDificuldades("");
    setControleHoras("");
    setEditingControleId(null);
  };
  const handleCreateMentorado = () => {
    if (!novoMentorado.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o nome do mentorado.",
        variant: "destructive"
      });
      return;
    }
    createMentorado.mutate({ nome: novoMentorado }, {
      onSuccess: () => {
        setNovoMentorado("");
        setIsMentoradosOpen(false);
      }
    });
  };

  if (isLoading || isLoadingControle || isLoadingMentorados) {
    return <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>;
  }
  return <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Planilhas Importantes</h1>
        <p className="text-muted-foreground">
          Gerencie suas planilhas e controle de produção
        </p>
      </div>

      <Tabs defaultValue="planilhas" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="planilhas">Planilhas</TabsTrigger>
          <TabsTrigger value="controle">Controle de Produção</TabsTrigger>
        </TabsList>

        {/* Aba de Planilhas */}
        <TabsContent value="planilhas">
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
                    <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Planilha dos Virais" />
                  </div>
                  <div>
                    <Label htmlFor="link">Link</Label>
                    <Input id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    Registrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {planilhas?.map((planilha, index) => <Card key={planilha.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{planilha.nome}</h3>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-sm text-primary hover:underline" onClick={() => handleCopyLink(planilha.link, planilha.nome)}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar link
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(planilha.id, planilha.nome, planilha.link)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePlanilha.mutate(planilha.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>

          <Dialog open={!!editingId} onOpenChange={open => !open && closeEditDialog()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Planilha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-nome">Nome da Planilha</Label>
                  <Input id="edit-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Planilha dos Virais" />
                </div>
                <div>
                  <Label htmlFor="edit-link">Link</Label>
                  <Input id="edit-link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                </div>
                <Button onClick={handleUpdate} className="w-full">
                  Salvar Alterações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Nova Aba de Controle de Produção */}
        <TabsContent value="controle">
          <div className="mb-6 flex gap-2">
            <Dialog open={isControleOpen} onOpenChange={setIsControleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Registro de Produção</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="controle-data">Data *</Label>
                      <Input id="controle-data" type="date" value={controleData} onChange={e => setControleData(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="controle-mentorado">Mentorado *</Label>
                      <Select value={controleMentorado} onValueChange={setControleMentorado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mentorado" />
                        </SelectTrigger>
                        <SelectContent>
                          {mentorados?.map((mentorado) => (
                            <SelectItem key={mentorado.id} value={mentorado.nome}>
                              {mentorado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="controle-quantidade">Quantidade de roteiros *</Label>
                      <Input id="controle-quantidade" value={controleQuantidade} onChange={e => setControleQuantidade(e.target.value)} placeholder="Ex: 5 roteiros" />
                    </div>
                    <div>
                      <Label htmlFor="controle-horas">Horas trabalhadas *</Label>
                      <Input id="controle-horas" value={controleHoras} onChange={e => setControleHoras(e.target.value)} placeholder="Ex: 8h" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="controle-dificuldades">Maiores dificuldades</Label>
                    <Input id="controle-dificuldades" value={controleDificuldades} onChange={e => setControleDificuldades(e.target.value)} placeholder="Descreva as dificuldades encontradas" />
                  </div>
                  <Button onClick={handleCreateControle} className="w-full">
                    Registrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isMentoradosOpen} onOpenChange={setIsMentoradosOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Mentorados
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerenciar Mentorados</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="novo-mentorado">Adicionar Novo Mentorado</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="novo-mentorado" 
                        value={novoMentorado} 
                        onChange={e => setNovoMentorado(e.target.value)} 
                        placeholder="Nome do mentorado" 
                      />
                      <Button onClick={handleCreateMentorado}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Mentorados Cadastrados</h4>
                    <div className="space-y-2">
                      {mentorados?.map((mentorado) => (
                        <div key={mentorado.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span>{mentorado.nome}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMentorado.mutate(mentorado.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]">
                  <TableHead className="text-primary-foreground font-semibold">Data</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Mentorado</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Quantidade de roteiros</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Maiores dificuldades</TableHead>
                  <TableHead className="text-primary-foreground font-semibold">Horas trabalhadas</TableHead>
                  <TableHead className="text-primary-foreground font-semibold w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {controleProducao?.map(registro => <TableRow key={registro.id}>
                    <TableCell className="font-medium">{format(new Date(registro.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{registro.mentorado}</TableCell>
                    <TableCell>{registro.quantidade_roteiros}</TableCell>
                    <TableCell>{registro.maiores_dificuldades || "-"}</TableCell>
                    <TableCell>{registro.horas_trabalhadas}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditControle(registro)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteControle.mutate(registro.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>

          <Dialog open={!!editingControleId} onOpenChange={open => !open && resetControleForm()}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Registro de Produção</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-controle-data">Data *</Label>
                    <Input id="edit-controle-data" type="date" value={controleData} onChange={e => setControleData(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="edit-controle-mentorado">Mentorado *</Label>
                      <Select value={controleMentorado} onValueChange={setControleMentorado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mentorado" />
                        </SelectTrigger>
                        <SelectContent>
                          {mentorados?.map((mentorado) => (
                            <SelectItem key={mentorado.id} value={mentorado.nome}>
                              {mentorado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-controle-quantidade">Quantidade de roteiros *</Label>
                    <Input id="edit-controle-quantidade" value={controleQuantidade} onChange={e => setControleQuantidade(e.target.value)} placeholder="Ex: 5 roteiros" />
                  </div>
                  <div>
                    <Label htmlFor="edit-controle-horas">Horas trabalhadas *</Label>
                    <Input id="edit-controle-horas" value={controleHoras} onChange={e => setControleHoras(e.target.value)} placeholder="Ex: 8h" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-controle-dificuldades">Maiores dificuldades</Label>
                  <Input id="edit-controle-dificuldades" value={controleDificuldades} onChange={e => setControleDificuldades(e.target.value)} placeholder="Descreva as dificuldades encontradas" />
                </div>
                <Button onClick={handleUpdateControle} className="w-full">
                  Salvar Alterações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>;
};
export default Headlines;