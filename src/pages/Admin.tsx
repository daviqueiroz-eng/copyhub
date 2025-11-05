import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRoteiros, useCreateRoteiro, useUpdateRoteiro, useDeleteRoteiro } from "@/hooks/useRoteiros";
import { useCoresAnalise, useCreateCorAnalise, useUpdateCorAnalise, useDeleteCorAnalise } from "@/hooks/useCoresAnalise";
import { useMedalhas, useCreateMedalha } from "@/hooks/useMedalhas";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: loadingRole } = useUserRole();
  const { toast } = useToast();

  // Roteiros state
  const { data: roteiros = [], isLoading: loadingRoteiros } = useRoteiros();
  const createRoteiro = useCreateRoteiro();
  const updateRoteiro = useUpdateRoteiro();
  const deleteRoteiro = useDeleteRoteiro();
  const [isRoteiroDialogOpen, setIsRoteiroDialogOpen] = useState(false);
  const [editingRoteiro, setEditingRoteiro] = useState<any>(null);
  const [roteiroForm, setRoteiroForm] = useState({ titulo: "", conteudo: "", ordem: 0 });

  // Cores state
  const { data: cores = [], isLoading: loadingCores } = useCoresAnalise();
  const createCor = useCreateCorAnalise();
  const updateCor = useUpdateCorAnalise();
  const deleteCor = useDeleteCorAnalise();
  const [isCorDialogOpen, setIsCorDialogOpen] = useState(false);
  const [editingCor, setEditingCor] = useState<any>(null);
  const [corForm, setCorForm] = useState({ nome: "", cor: "#3b82f6", ordem: 0 });

  // Medalhas state
  const { data: medalhas = [], isLoading: loadingMedalhas } = useMedalhas();
  const createMedalha = useCreateMedalha();
  const [isMedalhaDialogOpen, setIsMedalhaDialogOpen] = useState(false);
  const [medalhaForm, setMedalhaForm] = useState({ 
    nome: "", 
    descricao: "", 
    icone: "🏆", 
    roteiros_necessarios: 1,
    ordem: 0 
  });

  if (loading || loadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "admin") {
    toast({
      title: "Acesso negado",
      description: "Você não tem permissão para acessar esta página.",
      variant: "destructive",
    });
    navigate("/testes");
    return null;
  }

  // Roteiro handlers
  const handleSaveRoteiro = () => {
    if (!roteiroForm.titulo.trim() || !roteiroForm.conteudo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo do roteiro.",
        variant: "destructive",
      });
      return;
    }

    if (editingRoteiro) {
      updateRoteiro.mutate(
        { id: editingRoteiro.id, ...roteiroForm },
        {
          onSuccess: () => {
            setIsRoteiroDialogOpen(false);
            setEditingRoteiro(null);
            setRoteiroForm({ titulo: "", conteudo: "", ordem: 0 });
          },
        }
      );
    } else {
      createRoteiro.mutate(roteiroForm, {
        onSuccess: () => {
          setIsRoteiroDialogOpen(false);
          setRoteiroForm({ titulo: "", conteudo: "", ordem: 0 });
        },
      });
    }
  };

  const handleEditRoteiro = (roteiro: any) => {
    setEditingRoteiro(roteiro);
    setRoteiroForm({
      titulo: roteiro.titulo,
      conteudo: roteiro.conteudo,
      ordem: roteiro.ordem,
    });
    setIsRoteiroDialogOpen(true);
  };

  const handleDeleteRoteiro = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este roteiro?")) {
      deleteRoteiro.mutate(id);
    }
  };

  // Cor handlers
  const handleSaveCor = () => {
    if (!corForm.nome.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha o nome da cor.",
        variant: "destructive",
      });
      return;
    }

    if (editingCor) {
      updateCor.mutate(
        { id: editingCor.id, ...corForm },
        {
          onSuccess: () => {
            setIsCorDialogOpen(false);
            setEditingCor(null);
            setCorForm({ nome: "", cor: "#3b82f6", ordem: 0 });
          },
        }
      );
    } else {
      createCor.mutate(corForm, {
        onSuccess: () => {
          setIsCorDialogOpen(false);
          setCorForm({ nome: "", cor: "#3b82f6", ordem: 0 });
        },
      });
    }
  };

  const handleEditCor = (cor: any) => {
    setEditingCor(cor);
    setCorForm({
      nome: cor.nome,
      cor: cor.cor,
      ordem: cor.ordem,
    });
    setIsCorDialogOpen(true);
  };

  const handleDeleteCor = (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta cor?")) {
      deleteCor.mutate(id);
    }
  };

  // Medalha handlers
  const handleSaveMedalha = () => {
    if (!medalhaForm.nome.trim() || !medalhaForm.descricao.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e descrição da medalha.",
        variant: "destructive",
      });
      return;
    }

    createMedalha.mutate(medalhaForm, {
      onSuccess: () => {
        setIsMedalhaDialogOpen(false);
        setMedalhaForm({ 
          nome: "", 
          descricao: "", 
          icone: "🏆", 
          roteiros_necessarios: 1,
          ordem: 0 
        });
      },
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Painel de Administração</h1>
          <p className="text-muted-foreground">Gerencie roteiros, cores e medalhas</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/testes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="roteiros" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roteiros">Roteiros</TabsTrigger>
          <TabsTrigger value="cores">Cores de Análise</TabsTrigger>
          <TabsTrigger value="medalhas">Medalhas</TabsTrigger>
        </TabsList>

        {/* Roteiros Tab */}
        <TabsContent value="roteiros" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roteiros</CardTitle>
                  <CardDescription>Gerencie os roteiros do jogo de Análise de Roteiro</CardDescription>
                </div>
                <Dialog open={isRoteiroDialogOpen} onOpenChange={setIsRoteiroDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingRoteiro(null);
                      setRoteiroForm({ titulo: "", conteudo: "", ordem: 0 });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Roteiro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingRoteiro ? "Editar Roteiro" : "Novo Roteiro"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="titulo">Título</Label>
                        <Input
                          id="titulo"
                          value={roteiroForm.titulo}
                          onChange={(e) => setRoteiroForm({ ...roteiroForm, titulo: e.target.value })}
                          placeholder="Ex: Roteiro de Vendas - Produto X"
                        />
                      </div>
                      <div>
                        <Label htmlFor="conteudo">Conteúdo do Roteiro</Label>
                        <Textarea
                          id="conteudo"
                          value={roteiroForm.conteudo}
                          onChange={(e) => setRoteiroForm({ ...roteiroForm, conteudo: e.target.value })}
                          placeholder="Cole o roteiro completo aqui..."
                          className="min-h-[300px] font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ordem">Ordem de Exibição</Label>
                        <Input
                          id="ordem"
                          type="number"
                          value={roteiroForm.ordem}
                          onChange={(e) => setRoteiroForm({ ...roteiroForm, ordem: parseInt(e.target.value) })}
                        />
                      </div>
                      <Button onClick={handleSaveRoteiro} className="w-full">
                        {editingRoteiro ? "Atualizar" : "Criar"} Roteiro
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRoteiros ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : roteiros.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum roteiro cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roteiros.map((roteiro) => (
                      <TableRow key={roteiro.id}>
                        <TableCell className="font-medium">{roteiro.titulo}</TableCell>
                        <TableCell>{roteiro.ordem}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRoteiro(roteiro)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRoteiro(roteiro.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cores Tab */}
        <TabsContent value="cores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cores de Análise</CardTitle>
                  <CardDescription>Defina as cores e categorias para sublinhamento</CardDescription>
                </div>
                <Dialog open={isCorDialogOpen} onOpenChange={setIsCorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingCor(null);
                      setCorForm({ nome: "", cor: "#3b82f6", ordem: 0 });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Cor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCor ? "Editar Cor" : "Nova Cor"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="nome-cor">Nome da Categoria</Label>
                        <Input
                          id="nome-cor"
                          value={corForm.nome}
                          onChange={(e) => setCorForm({ ...corForm, nome: e.target.value })}
                          placeholder="Ex: Gatilho Mental"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cor">Cor</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cor"
                            type="color"
                            value={corForm.cor}
                            onChange={(e) => setCorForm({ ...corForm, cor: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            value={corForm.cor}
                            onChange={(e) => setCorForm({ ...corForm, cor: e.target.value })}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ordem-cor">Ordem</Label>
                        <Input
                          id="ordem-cor"
                          type="number"
                          value={corForm.ordem}
                          onChange={(e) => setCorForm({ ...corForm, ordem: parseInt(e.target.value) })}
                        />
                      </div>
                      <Button onClick={handleSaveCor} className="w-full">
                        {editingCor ? "Atualizar" : "Criar"} Cor
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCores ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : cores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma cor cadastrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cores.map((cor) => (
                      <TableRow key={cor.id}>
                        <TableCell className="font-medium">{cor.nome}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: cor.cor }}
                            />
                            <span className="text-sm text-muted-foreground">{cor.cor}</span>
                          </div>
                        </TableCell>
                        <TableCell>{cor.ordem}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCor(cor)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCor(cor.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medalhas Tab */}
        <TabsContent value="medalhas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Medalhas</CardTitle>
                  <CardDescription>Configure as medalhas de conquista</CardDescription>
                </div>
                <Dialog open={isMedalhaDialogOpen} onOpenChange={setIsMedalhaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Medalha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Medalha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="nome-medalha">Nome</Label>
                        <Input
                          id="nome-medalha"
                          value={medalhaForm.nome}
                          onChange={(e) => setMedalhaForm({ ...medalhaForm, nome: e.target.value })}
                          placeholder="Ex: Bronze"
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={medalhaForm.descricao}
                          onChange={(e) => setMedalhaForm({ ...medalhaForm, descricao: e.target.value })}
                          placeholder="Ex: Complete 5 roteiros"
                        />
                      </div>
                      <div>
                        <Label htmlFor="icone">Ícone (Emoji)</Label>
                        <Input
                          id="icone"
                          value={medalhaForm.icone}
                          onChange={(e) => setMedalhaForm({ ...medalhaForm, icone: e.target.value })}
                          placeholder="🏆"
                        />
                      </div>
                      <div>
                        <Label htmlFor="roteiros-necessarios">Roteiros Necessários</Label>
                        <Input
                          id="roteiros-necessarios"
                          type="number"
                          min="1"
                          value={medalhaForm.roteiros_necessarios}
                          onChange={(e) => setMedalhaForm({ ...medalhaForm, roteiros_necessarios: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ordem-medalha">Ordem</Label>
                        <Input
                          id="ordem-medalha"
                          type="number"
                          value={medalhaForm.ordem}
                          onChange={(e) => setMedalhaForm({ ...medalhaForm, ordem: parseInt(e.target.value) })}
                        />
                      </div>
                      <Button onClick={handleSaveMedalha} className="w-full">
                        Criar Medalha
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMedalhas ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : medalhas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma medalha cadastrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ícone</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Roteiros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medalhas.map((medalha) => (
                      <TableRow key={medalha.id}>
                        <TableCell className="text-2xl">{medalha.icone}</TableCell>
                        <TableCell className="font-medium">{medalha.nome}</TableCell>
                        <TableCell>{medalha.descricao}</TableCell>
                        <TableCell>{medalha.roteiros_necessarios}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
