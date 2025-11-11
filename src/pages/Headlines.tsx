import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Copy, Settings, TrendingUp, Calendar, CalendarDays, CalendarRange, CalendarClock } from "lucide-react";
import { usePlanilhas, useCreatePlanilha, useUpdatePlanilha, useDeletePlanilha } from "@/hooks/usePlanilhas";
import { useControleProducao, useCreateControleProducao, useUpdateControleProducao, useDeleteControleProducao } from "@/hooks/useControleProducao";
import { useMentoradosControle, useCreateMentoradoControle, useDeleteMentoradoControle } from "@/hooks/useMentoradosControle";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isToday, isThisWeek, isThisMonth, isThisYear, startOfDay } from "date-fns";
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
  const [controlePlataformas, setControlePlataformas] = useState("");

  // Estados para Gerenciar Mentorados
  const [isMentoradosOpen, setIsMentoradosOpen] = useState(false);
  const [novoMentorado, setNovoMentorado] = useState("");
  
  // Estado para seleção de mentorado
  const [mentoradoSelecionado, setMentoradoSelecionado] = useState<string | null>(null);
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
    const mentoradoParaUsar = mentoradoSelecionado || controleMentorado;
    
    if (!controleData || !mentoradoParaUsar || !controleQuantidade || !controleHoras) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    createControle.mutate({
      data: controleData,
      mentorado: mentoradoParaUsar,
      quantidade_roteiros: controleQuantidade,
      maiores_dificuldades: controleDificuldades || null,
      horas_trabalhadas: controleHoras,
      plataformas: controlePlataformas || ""
    }, {
      onSuccess: () => {
        resetControleForm();
        setIsControleOpen(false);
      }
    });
  };
  const handleUpdateControle = () => {
    const mentoradoParaUsar = mentoradoSelecionado || controleMentorado;
    
    if (!editingControleId || !controleData || !mentoradoParaUsar || !controleQuantidade || !controleHoras) {
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
      mentorado: mentoradoParaUsar,
      quantidade_roteiros: controleQuantidade,
      maiores_dificuldades: controleDificuldades || null,
      horas_trabalhadas: controleHoras,
      plataformas: controlePlataformas || ""
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
    setControlePlataformas(registro.plataformas || "");
  };
  const resetControleForm = () => {
    setControleData("");
    setControleMentorado("");
    setControleQuantidade("");
    setControleDificuldades("");
    setControleHoras("");
    setControlePlataformas("");
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

  // Função para calcular status do mentorado
  const calcularStatusMentorado = (nomeMentorado: string) => {
    const registros = controleProducao?.filter(r => r.mentorado === nomeMentorado) || [];
    
    if (registros.length === 0) {
      return { status: "sem registros", variant: "outline" as const, dias: null };
    }

    // Pegar o registro mais recente (já está ordenado por data DESC)
    const ultimoRegistro = registros[0];
    const dataRegistro = startOfDay(new Date(ultimoRegistro.data));
    const hoje = startOfDay(new Date());
    const diasDiff = differenceInDays(hoje, dataRegistro);

    if (diasDiff === 0) {
      return { status: "atualizado", variant: "default" as const, dias: 0 };
    } else {
      return { status: "atrasado", variant: "destructive" as const, dias: diasDiff };
    }
  };

  // Função para calcular estatísticas de produção
  const calcularEstatisticas = (nomeMentorado: string) => {
    const registros = controleProducao?.filter(r => r.mentorado === nomeMentorado) || [];
    
    const hoje = registros
      .filter(r => isToday(new Date(r.data)))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);
    
    const semana = registros
      .filter(r => isThisWeek(new Date(r.data), { weekStartsOn: 0 }))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);
    
    const mes = registros
      .filter(r => isThisMonth(new Date(r.data)))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);
    
    const ano = registros
      .filter(r => isThisYear(new Date(r.data)))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);

    return { hoje, semana, mes, ano };
  };

  // Função para calcular estatísticas gerais (todos os mentorados)
  const calcularEstatisticasGerais = () => {
    if (!controleProducao) return { hoje: 0, semana: 0, mes: 0, ano: 0 };

    const todosRegistros = controleProducao;

    const hoje = todosRegistros
      .filter((r) => isToday(new Date(r.data)))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);

    const semana = todosRegistros
      .filter((r) => isThisWeek(new Date(r.data), { weekStartsOn: 0 }))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);

    const mes = todosRegistros
      .filter((r) => isThisMonth(new Date(r.data)))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);

    const ano = todosRegistros
      .filter((r) => isThisYear(new Date(r.data)))
      .reduce((acc, r) => acc + parseInt(r.quantidade_roteiros || "0"), 0);

    return { hoje, semana, mes, ano };
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
          {!mentoradoSelecionado ? (
            // Tela de seleção de mentorados
            <div>
              <div className="mb-6">
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

              {/* Estatísticas Gerais - Todos os Mentorados */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Estatísticas Gerais - Todos os Mentorados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const stats = calcularEstatisticasGerais();
                    return (
                      <>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Hoje
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.hoje}</div>
                            <p className="text-xs text-muted-foreground">
                              roteiros produzidos
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Esta Semana
                            </CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.semana}</div>
                            <p className="text-xs text-muted-foreground">
                              roteiros produzidos
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Este Mês
                            </CardTitle>
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.mes}</div>
                            <p className="text-xs text-muted-foreground">
                              roteiros produzidos
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Este Ano
                            </CardTitle>
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stats.ano}</div>
                            <p className="text-xs text-muted-foreground">
                              roteiros produzidos
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mentorados?.map((mentorado) => {
                  const statusInfo = calcularStatusMentorado(mentorado.nome);
                  
                  return (
                    <Card 
                      key={mentorado.id} 
                      className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-primary/10 to-primary/5 relative"
                      onClick={() => setMentoradoSelecionado(mentorado.nome)}
                    >
                      <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                        <Badge variant={statusInfo.variant} className="absolute top-2 right-2">
                          {statusInfo.status}
                        </Badge>
                        <h3 className="text-xl font-bold text-center">{mentorado.nome}</h3>
                        {statusInfo.dias !== null && statusInfo.dias > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {statusInfo.dias} {statusInfo.dias === 1 ? 'dia' : 'dias'}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            // Tela de controle individual do mentorado
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setMentoradoSelecionado(null)}>
                    ← Voltar
                  </Button>
                  <h2 className="text-2xl font-bold">Controle de Produção - {mentoradoSelecionado}</h2>
                </div>
                
                <Dialog open={isControleOpen} onOpenChange={setIsControleOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Registro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Novo Registro de Produção - {mentoradoSelecionado}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="controle-data">Data *</Label>
                          <Input id="controle-data" type="date" value={controleData} onChange={e => setControleData(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="controle-quantidade">Quantidade de roteiros *</Label>
                          <Input id="controle-quantidade" value={controleQuantidade} onChange={e => setControleQuantidade(e.target.value)} placeholder="Ex: 5" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="controle-horas">Horas trabalhadas *</Label>
                        <Input id="controle-horas" value={controleHoras} onChange={e => setControleHoras(e.target.value)} placeholder="Ex: 8h" />
                      </div>
                      <div>
                        <Label htmlFor="controle-plataformas">Plataformas em que você fez o roteiro</Label>
                        <Input id="controle-plataformas" value={controlePlataformas} onChange={e => setControlePlataformas(e.target.value)} placeholder="Ex: YouTube, Instagram, TikTok" />
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
              </div>

              {/* Seção de Estatísticas */}
              {(() => {
                const stats = calcularEstatisticas(mentoradoSelecionado);
                return (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Estatísticas de Produção
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                        <CardContent className="p-6 flex flex-col items-center">
                          <Calendar className="h-8 w-8 text-green-600 mb-2" />
                          <p className="text-3xl font-bold text-green-700">{stats.hoje}</p>
                          <p className="text-sm text-muted-foreground">Hoje</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                        <CardContent className="p-6 flex flex-col items-center">
                          <CalendarDays className="h-8 w-8 text-blue-600 mb-2" />
                          <p className="text-3xl font-bold text-blue-700">{stats.semana}</p>
                          <p className="text-sm text-muted-foreground">Esta Semana</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                        <CardContent className="p-6 flex flex-col items-center">
                          <CalendarRange className="h-8 w-8 text-purple-600 mb-2" />
                          <p className="text-3xl font-bold text-purple-700">{stats.mes}</p>
                          <p className="text-sm text-muted-foreground">Este Mês</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                        <CardContent className="p-6 flex flex-col items-center">
                          <Calendar className="h-8 w-8 text-orange-600 mb-2" />
                          <p className="text-3xl font-bold text-orange-700">{stats.ano}</p>
                          <p className="text-sm text-muted-foreground">Este Ano</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })()}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]">
                      <TableHead className="text-primary-foreground font-semibold">Data</TableHead>
                      <TableHead className="text-primary-foreground font-semibold">Quantidade</TableHead>
                      <TableHead className="text-primary-foreground font-semibold">Plataformas</TableHead>
                      <TableHead className="text-primary-foreground font-semibold">Dificuldades</TableHead>
                      <TableHead className="text-primary-foreground font-semibold">Horas</TableHead>
                      <TableHead className="text-primary-foreground font-semibold w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {controleProducao
                      ?.filter(registro => registro.mentorado === mentoradoSelecionado)
                      .map(registro => <TableRow key={registro.id}>
                        <TableCell className="font-medium">{format(new Date(registro.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{registro.quantidade_roteiros}</TableCell>
                        <TableCell>{registro.plataformas || "-"}</TableCell>
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
              
              {/* Dialog de Edição */}
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
                        <Label htmlFor="edit-controle-quantidade">Quantidade de roteiros *</Label>
                        <Input id="edit-controle-quantidade" value={controleQuantidade} onChange={e => setControleQuantidade(e.target.value)} placeholder="Ex: 5" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-controle-horas">Horas trabalhadas *</Label>
                      <Input id="edit-controle-horas" value={controleHoras} onChange={e => setControleHoras(e.target.value)} placeholder="Ex: 8h" />
                    </div>
                    <div>
                      <Label htmlFor="edit-controle-plataformas">Plataformas em que você fez o roteiro</Label>
                      <Input id="edit-controle-plataformas" value={controlePlataformas} onChange={e => setControlePlataformas(e.target.value)} placeholder="Ex: YouTube, Instagram, TikTok" />
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
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>;
};
export default Headlines;