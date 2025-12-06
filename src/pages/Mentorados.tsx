import { useState } from "react";
import { Plus, Search, ExternalLink, Instagram, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  useMentorados, 
  useCreateMentorado, 
  useUpdateMentorado,
  useDeleteMentorado,
  type Mentorado 
} from "@/hooks/useMentorados";
import { GeralView } from "@/components/mentorados/GeralView";
import { CalendarioView } from "@/components/mentorados/CalendarioView";
import { OrdemPrioridadeView } from "@/components/mentorados/OrdemPrioridadeView";
import { useAuth } from "@/contexts/AuthContext";

const Mentorados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMentoradoName, setNewMentoradoName] = useState("");
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const { user } = useAuth();
  const { data: mentorados = [] } = useMentorados();
  const createMentorado = useCreateMentorado();
  const updateMentorado = useUpdateMentorado();
  const deleteMentorado = useDeleteMentorado();

  const getIniciais = (nome: string) => {
    const parts = nome.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleAddMentorado = () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar mentorados.",
        variant: "destructive",
      });
      return;
    }

    if (!newMentoradoName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira o nome do mentorado.",
        variant: "destructive",
      });
      return;
    }

    createMentorado.mutate(
      {
        nome: newMentoradoName,
        iniciais: getIniciais(newMentoradoName),
        user_id: user.id,
        avatar: null,
        dores: null,
        desejos: null,
        objecoes: null,
        crencas: null,
        plano: null,
        estilo_comum: null,
        roteiros: null,
        observacoes: null,
        links_chats: null,
        link_drive: null,
        referencias: null,
        instagram: null,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setNewMentoradoName("");
        },
      }
    );
  };

  const handleOpenDetail = (mentorado: Mentorado) => {
    setSelectedMentorado(mentorado);
    setIsDetailSheetOpen(true);
  };

  const handleUpdateMentorado = (field: keyof Mentorado, value: string) => {
    if (!selectedMentorado) return;
    
    const updated = { ...selectedMentorado, [field]: value };
    setSelectedMentorado(updated);
    
    // Salva automaticamente no banco
    updateMentorado.mutate({
      id: selectedMentorado.id,
      [field]: value,
    });
  };

  const handleDeleteMentorado = () => {
    if (!selectedMentorado) return;
    
    deleteMentorado.mutate(selectedMentorado.id, {
      onSuccess: () => {
        setIsDetailSheetOpen(false);
        setSelectedMentorado(null);
      },
    });
  };

  return (
    <div className="space-y-6 w-full">
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

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="prioridade">Ordem de Prioridade</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <GeralView 
            mentorados={mentorados}
            searchTerm={searchTerm}
            onMentoradoClick={handleOpenDetail}
          />
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <CalendarioView mentorados={mentorados} />
        </TabsContent>

        <TabsContent value="prioridade" className="mt-6">
          <OrdemPrioridadeView />
        </TabsContent>
      </Tabs>

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
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                  {selectedMentorado?.instagram && (
                    <a
                      href={`https://instagram.com/${selectedMentorado.instagram.replace(/^@/, "")}`}
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
                  id="instagram"
                  value={selectedMentorado?.instagram || ""}
                  onChange={(e) => handleUpdateMentorado("instagram", e.target.value)}
                  placeholder="@usuario"
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
                  value={selectedMentorado?.estilo_comum || ""}
                  onChange={(e) => handleUpdateMentorado("estilo_comum", e.target.value)}
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
                  {selectedMentorado?.links_chats && (
                    <a
                      href={selectedMentorado.links_chats}
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
                  value={selectedMentorado?.links_chats || ""}
                  onChange={(e) => handleUpdateMentorado("links_chats", e.target.value)}
                  placeholder="Cole os links dos chats usados..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drive" className="flex items-center gap-2">
                  Link do Drive Geral
                  {selectedMentorado?.link_drive && (
                    <a
                      href={selectedMentorado.link_drive}
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
                  value={selectedMentorado?.link_drive || ""}
                  onChange={(e) => handleUpdateMentorado("link_drive", e.target.value)}
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

          <div className="mt-6 space-y-3">
            <Button 
              className="w-full" 
              onClick={() => {
                setIsDetailSheetOpen(false);
              }}
            >
              Fechar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir Mentorado
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir mentorado?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os dados de "{selectedMentorado?.nome}" serão permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteMentorado}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Mentorados;
