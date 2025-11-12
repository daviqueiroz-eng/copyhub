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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRoteiros, useCreateRoteiro, useUpdateRoteiro, useDeleteRoteiro } from "@/hooks/useRoteiros";
import { useCoresAnalise, useCreateCorAnalise, useUpdateCorAnalise, useDeleteCorAnalise } from "@/hooks/useCoresAnalise";
import { useMedalhas, useCreateMedalha } from "@/hooks/useMedalhas";
import { useNichos } from "@/hooks/useNichos";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: loadingRole } = useUserRole();
  const { toast } = useToast();

  // Roteiros state
  const { data: roteiros = [], isLoading: loadingRoteiros } = useRoteiros();
  const { data: nichos = [] } = useNichos();
  const createRoteiro = useCreateRoteiro();
  const updateRoteiro = useUpdateRoteiro();
  const deleteRoteiro = useDeleteRoteiro();
  const [isRoteiroDialogOpen, setIsRoteiroDialogOpen] = useState(false);
  const [editingRoteiro, setEditingRoteiro] = useState<any>(null);
  const [roteiroForm, setRoteiroForm] = useState({ 
    titulo: "", 
    conteudo: "", 
    ordem: 0, 
    nicho_id: "", 
    link_video: "" 
  });

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

  // Usuários state
  const queryClient = useQueryClient();
  const [isUsuarioDialogOpen, setIsUsuarioDialogOpen] = useState(false);
  const [usuarioForm, setUsuarioForm] = useState({ email: "", nome: "" });

  const { data: allowedEmails = [], isLoading: loadingEmails } = useQuery({
    queryKey: ["allowed-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allowed_emails")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createEmailMutation = useMutation({
    mutationFn: async ({ email, nome }: { email: string; nome: string }) => {
      const { data, error } = await supabase
        .from("allowed_emails")
        .insert({
          email: email.toLowerCase().trim(),
          nome: nome.trim(),
          cadastrado_por: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      toast({
        title: "Usuário cadastrado",
        description: "Email adicionado à lista de autorizados"
      });
      setIsUsuarioDialogOpen(false);
      setUsuarioForm({ email: "", nome: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("allowed_emails")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      toast({
        title: "Usuário removido",
        description: "Email removido da lista"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive"
      });
    }
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

    const roteiroData = {
      ...roteiroForm,
      nicho_id: roteiroForm.nicho_id || null,
      link_video: roteiroForm.link_video || null,
    };

    if (editingRoteiro) {
      updateRoteiro.mutate(
        { id: editingRoteiro.id, ...roteiroData },
        {
          onSuccess: () => {
            setIsRoteiroDialogOpen(false);
            setEditingRoteiro(null);
            setRoteiroForm({ titulo: "", conteudo: "", ordem: 0, nicho_id: "", link_video: "" });
          },
        }
      );
    } else {
      createRoteiro.mutate(roteiroData, {
        onSuccess: () => {
          setIsRoteiroDialogOpen(false);
          setRoteiroForm({ titulo: "", conteudo: "", ordem: 0, nicho_id: "", link_video: "" });
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
      nicho_id: roteiro.nicho_id || "",
      link_video: roteiro.link_video || "",
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

  // Usuário handlers
  const handleAddAllowedEmail = () => {
    if (!usuarioForm.email || !usuarioForm.nome) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e nome",
        variant: "destructive"
      });
      return;
    }

    createEmailMutation.mutate(usuarioForm);
  };

  const handleDeleteAllowedEmail = (id: string, usado: boolean) => {
    if (usado) {
      toast({
        title: "Não é possível deletar",
        description: "Este email já foi usado para criar uma conta",
        variant: "destructive"
      });
      return;
    }

    if (confirm("Tem certeza que deseja remover este usuário?")) {
      deleteEmailMutation.mutate(id);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Painel de Administração</h1>
          <p className="text-muted-foreground">Gerencie roteiros, cores, medalhas e usuários</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/testes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Tabs defaultValue="roteiros" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roteiros">Roteiros</TabsTrigger>
          <TabsTrigger value="cores">Cores de Análise</TabsTrigger>
          <TabsTrigger value="medalhas">Medalhas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
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
                      setRoteiroForm({ titulo: "", conteudo: "", ordem: 0, nicho_id: "", link_video: "" });
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
                        <Label htmlFor="nicho">Nicho</Label>
                        <Select
                          value={roteiroForm.nicho_id}
                          onValueChange={(value) => setRoteiroForm({ ...roteiroForm, nicho_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um nicho (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {nichos.map((nicho) => (
                              <SelectItem key={nicho.id} value={nicho.id}>
                                {nicho.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="link_video">Link do Vídeo</Label>
                        <Input
                          id="link_video"
                          value={roteiroForm.link_video}
                          onChange={(e) => setRoteiroForm({ ...roteiroForm, link_video: e.target.value })}
                          placeholder="https://youtube.com/..."
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

        {/* Usuários Tab */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>
                    Adicione emails autorizados a fazer login com Google
                  </CardDescription>
                </div>
                <Dialog open={isUsuarioDialogOpen} onOpenChange={setIsUsuarioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Adicione o email e nome da pessoa que poderá acessar a plataforma
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="user-email">Email do Google</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={usuarioForm.email}
                          onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })}
                          placeholder="usuario@gmail.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-nome">Nome Completo</Label>
                        <Input
                          id="user-nome"
                          value={usuarioForm.nome}
                          onChange={(e) => setUsuarioForm({ ...usuarioForm, nome: e.target.value })}
                          placeholder="João Silva"
                        />
                      </div>
                      <Button 
                        onClick={handleAddAllowedEmail} 
                        className="w-full"
                        disabled={createEmailMutation.isPending}
                      >
                        {createEmailMutation.isPending ? "Cadastrando..." : "Cadastrar Usuário"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEmails ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : allowedEmails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum usuário cadastrado ainda.</p>
                  <p className="text-sm mt-2">Clique em "Novo Usuário" para adicionar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allowedEmails.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                        <TableCell>{user.nome}</TableCell>
                        <TableCell>
                          <Badge variant={user.usado ? "secondary" : "default"}>
                            {user.usado ? "✓ Cadastrado" : "⏳ Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAllowedEmail(user.id, user.usado)}
                            disabled={user.usado || deleteEmailMutation.isPending}
                            title={user.usado ? "Não é possível deletar usuário já cadastrado" : "Deletar"}
                          >
                            <Trash2 className={`h-4 w-4 ${user.usado ? 'text-muted-foreground' : 'text-destructive'}`} />
                          </Button>
                        </TableCell>
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
