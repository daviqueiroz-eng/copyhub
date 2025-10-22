import { useState } from "react";
import { Plus, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

type Mentorado = {
  id: number;
  nome: string;
  iniciais: string;
  avatar: string;
  dores: string;
  desejos: string;
  objecoes: string;
  crencas: string;
  plano: string;
  estiloComum: string;
  roteiros: string;
  observacoes: string;
  linksChats: string;
  linkDrive: string;
  referencias: string;
};

const Mentorados = () => {
  const [mentorados, setMentorados] = useState<Mentorado[]>([
    {
      id: 1,
      nome: "João Silva",
      iniciais: "JS",
      avatar: "",
      dores: "Dificuldade em criar headlines que convertem",
      desejos: "Dominar copywriting persuasivo",
      objecoes: "Medo de não ter criatividade suficiente",
      crencas: "Acredita que precisa de dom natural",
      plano: "Plano Pro - 3 meses",
      estiloComum: "Direto, objetivo, gosta de exemplos práticos",
      roteiros: "Roteiro de stories sobre transformação - CTR 12%",
      observacoes: "Progresso excelente, implementa rapidamente",
      linksChats: "https://chat.example.com/joao-silva",
      linkDrive: "https://drive.google.com/folder/joao-silva",
      referencias: "Swipe file de headlines testadas",
    },
    {
      id: 2,
      nome: "Maria Santos",
      iniciais: "MS",
      avatar: "",
      dores: "Baixa conversão em vendas",
      desejos: "Aumentar ticket médio",
      objecoes: "Preço alto demais",
      crencas: "Precisa de mais prova social",
      plano: "Plano Premium - 6 meses",
      estiloComum: "Analítica, gosta de dados e métricas",
      roteiros: "VSL de lançamento - 8.5% conversão",
      observacoes: "Perfeccionista, precisa de validação constante",
      linksChats: "https://chat.example.com/maria-santos",
      linkDrive: "https://drive.google.com/folder/maria-santos",
      referencias: "Cases de sucesso do nicho",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMentoradoName, setNewMentoradoName] = useState("");
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const filteredMentorados = mentorados.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIniciais = (nome: string) => {
    const parts = nome.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleAddMentorado = () => {
    if (!newMentoradoName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome do mentorado.",
        variant: "destructive",
      });
      return;
    }

    const novoMentorado: Mentorado = {
      id: Date.now(),
      nome: newMentoradoName,
      iniciais: getIniciais(newMentoradoName),
      avatar: "",
      dores: "",
      desejos: "",
      objecoes: "",
      crencas: "",
      plano: "",
      estiloComum: "",
      roteiros: "",
      observacoes: "",
      linksChats: "",
      linkDrive: "",
      referencias: "",
    };

    setMentorados([...mentorados, novoMentorado]);
    setIsAddDialogOpen(false);
    setNewMentoradoName("");
    
    toast({
      title: "Mentorado adicionado!",
      description: `${newMentoradoName} foi adicionado com sucesso.`,
    });
  };

  const handleOpenDetail = (mentorado: Mentorado) => {
    setSelectedMentorado(mentorado);
    setIsDetailSheetOpen(true);
  };

  const handleUpdateMentorado = (field: keyof Mentorado, value: string) => {
    if (!selectedMentorado) return;
    
    const updated = { ...selectedMentorado, [field]: value };
    setSelectedMentorado(updated);
    
    setMentorados(mentorados.map(m => 
      m.id === selectedMentorado.id ? updated : m
    ));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Meus Mentorados</h2>
          <p className="text-muted-foreground mt-1">
            Repositório de perfis e diagnósticos
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Mentorado
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mentorado..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMentorados.map((mentorado) => (
          <Card
            key={mentorado.id}
            className="transition-all hover:shadow-lg cursor-pointer hover:border-primary/50"
            onClick={() => handleOpenDetail(mentorado)}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {mentorado.iniciais}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{mentorado.nome}</CardTitle>
                  <CardDescription>{mentorado.plano || "Sem plano definido"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {mentorado.dores || "Clique para adicionar informações"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para adicionar novo mentorado */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Mentorado</DialogTitle>
            <DialogDescription>
              Digite o nome do mentorado para começar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Ex: João Silva"
                value={newMentoradoName}
                onChange={(e) => setNewMentoradoName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMentorado()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMentorado}>Criar Mentorado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet para detalhes do mentorado */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {selectedMentorado?.iniciais}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-2xl">{selectedMentorado?.nome}</SheetTitle>
                <SheetDescription>{selectedMentorado?.plano}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="avatar" className="mt-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
              <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
              <TabsTrigger value="materiais">Materiais</TabsTrigger>
            </TabsList>

            <TabsContent value="avatar" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="plano">Plano</Label>
                <Input
                  id="plano"
                  value={selectedMentorado?.plano || ""}
                  onChange={(e) => handleUpdateMentorado("plano", e.target.value)}
                  placeholder="Ex: Plano Pro - 3 meses"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dores">Principais Dores</Label>
                <Textarea
                  id="dores"
                  value={selectedMentorado?.dores || ""}
                  onChange={(e) => handleUpdateMentorado("dores", e.target.value)}
                  placeholder="Descreva as principais dores e problemas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desejos">Desejos e Objetivos</Label>
                <Textarea
                  id="desejos"
                  value={selectedMentorado?.desejos || ""}
                  onChange={(e) => handleUpdateMentorado("desejos", e.target.value)}
                  placeholder="O que ele realmente quer alcançar..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objecoes">Objeções</Label>
                <Textarea
                  id="objecoes"
                  value={selectedMentorado?.objecoes || ""}
                  onChange={(e) => handleUpdateMentorado("objecoes", e.target.value)}
                  placeholder="Principais objeções e bloqueios..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crencas">Crenças Limitantes</Label>
                <Textarea
                  id="crencas"
                  value={selectedMentorado?.crencas || ""}
                  onChange={(e) => handleUpdateMentorado("crencas", e.target.value)}
                  placeholder="Crenças que limitam o progresso..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="comunicacao" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="estilo">Estilo de Comunicação</Label>
                <Textarea
                  id="estilo"
                  value={selectedMentorado?.estiloComum || ""}
                  onChange={(e) => handleUpdateMentorado("estiloComum", e.target.value)}
                  placeholder="Como se comunicar melhor com este mentorado..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roteiros">Roteiros e Headlines que Performaram</Label>
                <Textarea
                  id="roteiros"
                  value={selectedMentorado?.roteiros || ""}
                  onChange={(e) => handleUpdateMentorado("roteiros", e.target.value)}
                  placeholder="Liste os roteiros e headlines de sucesso..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações do Estrategista</Label>
                <Textarea
                  id="observacoes"
                  value={selectedMentorado?.observacoes || ""}
                  onChange={(e) => handleUpdateMentorado("observacoes", e.target.value)}
                  placeholder="Notas importantes sobre o progresso..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="materiais" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="chats" className="flex items-center gap-2">
                  Links dos Chats
                  {selectedMentorado?.linksChats && (
                    <a
                      href={selectedMentorado.linksChats}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </Label>
                <Textarea
                  id="chats"
                  value={selectedMentorado?.linksChats || ""}
                  onChange={(e) => handleUpdateMentorado("linksChats", e.target.value)}
                  placeholder="Cole os links dos chats usados..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drive" className="flex items-center gap-2">
                  Link do Drive Geral
                  {selectedMentorado?.linkDrive && (
                    <a
                      href={selectedMentorado.linkDrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </Label>
                <Input
                  id="drive"
                  value={selectedMentorado?.linkDrive || ""}
                  onChange={(e) => handleUpdateMentorado("linkDrive", e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencias">Referências</Label>
                <Textarea
                  id="referencias"
                  value={selectedMentorado?.referencias || ""}
                  onChange={(e) => handleUpdateMentorado("referencias", e.target.value)}
                  placeholder="Materiais de referência, swipe files, etc..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button 
              className="w-full" 
              onClick={() => {
                toast({
                  title: "Alterações salvas!",
                  description: "As informações foram atualizadas com sucesso.",
                });
                setIsDetailSheetOpen(false);
              }}
            >
              Salvar Alterações
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Mentorados;
