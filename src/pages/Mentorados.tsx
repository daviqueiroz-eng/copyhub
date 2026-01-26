import { useState, useCallback } from "react";
import { Plus, Search, ExternalLink, Instagram, Trash2, FileText, LayoutGrid } from "lucide-react";
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
import { GrupoView } from "@/components/mentorados/GrupoView";
import { OrdemPrioridadeView } from "@/components/mentorados/OrdemPrioridadeView";
import { MentoradoRoteirosView } from "@/components/mentorados/MentoradoRoteirosView";
import { MapaAvatarSection } from "@/components/mentorados/MapaAvatarSection";
import { useAuth } from "@/contexts/AuthContext";

interface AvatarCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  items: string[];
}

const parseAvatarCategories = (mentorado: Mentorado | null): AvatarCategory[] => {
  if (!mentorado) return [];
  try {
    // Store categories in the 'observacoes' field as JSON
    const stored = mentorado.observacoes;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Not valid JSON, return empty
  }
  return [];
};

const Mentorados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMentoradoName, setNewMentoradoName] = useState("");
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isRoteirosViewOpen, setIsRoteirosViewOpen] = useState(false);

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
        tiktok: null,
        link_trello: null,
        inteligencia_ia: null,
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

  const handleUpdateAvatarCategories = useCallback((categories: AvatarCategory[]) => {
    if (!selectedMentorado) return;
    
    const jsonStr = JSON.stringify(categories);
    const updated = { ...selectedMentorado, observacoes: jsonStr };
    setSelectedMentorado(updated);
    
    updateMentorado.mutate({
      id: selectedMentorado.id,
      observacoes: jsonStr,
    });
  }, [selectedMentorado, updateMentorado]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full">
      {/* Header com Títulos lado a lado */}
      <div className="flex items-start justify-between gap-4 md:gap-6 shrink-0 pb-3 md:pb-4">
        {/* Lado esquerdo - Meus Mentorados */}
        <div className="xl:w-[320px] 2xl:w-[360px] shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Meus Mentorados</h2>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            Repositório de perfis e diagnósticos
          </p>
        </div>
        
        {/* Lado direito - Ordem de Prioridade (título) - escondido em mobile */}
        <div className="flex-1 hidden xl:block">
          <h2 className="text-3xl font-bold text-foreground">Ordem de Prioridade</h2>
          <p className="text-muted-foreground mt-1">
            Entregas organizadas por data
          </p>
        </div>
      </div>

      {/* Área principal com scroll interno */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 md:gap-6 min-h-0">
        {/* Lado esquerdo: Tabs Geral/Grupo com mentorados */}
        <div className="xl:w-[320px] 2xl:w-[360px] shrink-0 flex flex-col min-h-0">
          {/* Busca + Botão Novo */}
          <div className="flex items-center gap-2 shrink-0 pb-3 md:pb-4">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="sm" className="gap-1 shrink-0" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </div>

          <Tabs defaultValue="geral" className="flex flex-col flex-1 min-h-0">
            <TabsList className="grid w-full max-w-xs grid-cols-2 shrink-0">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="grupo">Grupo</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="mt-3 md:mt-4 flex-1 min-h-0 overflow-y-auto">
              <GeralView 
                mentorados={mentorados}
                searchTerm={searchTerm}
                onMentoradoClick={handleOpenDetail}
              />
            </TabsContent>

            <TabsContent value="grupo" className="mt-3 md:mt-4 flex-1 min-h-0 overflow-y-auto">
              <GrupoView />
            </TabsContent>
          </Tabs>
        </div>

        {/* Lado direito: Ordem de Prioridade sempre visível (desktop) */}
        <div className="flex-1 min-w-0 border-l pl-4 md:pl-6 hidden xl:flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <OrdemPrioridadeView />
          </div>
        </div>
      </div>

      {/* Ordem de Prioridade em mobile/tablet (abaixo) */}
      <div className="xl:hidden mt-4 md:mt-6 pt-4 md:pt-6 border-t">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Ordem de Prioridade</h3>
        <OrdemPrioridadeView />
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

          <Tabs defaultValue="avatar" className="mt-4 md:mt-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 md:mb-6 gap-1">
              <TabsTrigger value="avatar" className="text-xs sm:text-sm">Avatar</TabsTrigger>
              <TabsTrigger value="comunicacao" className="text-xs sm:text-sm">Comunicação</TabsTrigger>
              <TabsTrigger value="materiais" className="text-xs sm:text-sm">Materiais</TabsTrigger>
              <TabsTrigger value="roteiros" className="text-xs sm:text-sm">Roteiros</TabsTrigger>
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
                <Label htmlFor="tiktok" className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  TikTok
                  {selectedMentorado?.tiktok && (
                    <a
                      href={`https://tiktok.com/@${selectedMentorado.tiktok.replace(/^@/, "")}`}
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
                  id="tiktok"
                  value={selectedMentorado?.tiktok || ""}
                  onChange={(e) => handleUpdateMentorado("tiktok", e.target.value)}
                  placeholder="@usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_trello" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-blue-500" />
                  Trello
                  {selectedMentorado?.link_trello && (
                    <a
                      href={selectedMentorado.link_trello}
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
                  id="link_trello"
                  value={selectedMentorado?.link_trello || ""}
                  onChange={(e) => handleUpdateMentorado("link_trello", e.target.value)}
                  placeholder="https://trello.com/c/..."
                />
              </div>

              <MapaAvatarSection
                categories={parseAvatarCategories(selectedMentorado)}
                onUpdateCategories={(cats) => handleUpdateAvatarCategories(cats)}
              />
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

            <TabsContent value="roteiros" className="space-y-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Criar e Gerenciar Roteiros</h3>
                <p className="text-muted-foreground mb-4">
                  Crie roteiros organizados em guias para este mentorado
                </p>
                <Button
                  className="gap-2"
                  onClick={() => {
                    setIsDetailSheetOpen(false);
                    setIsRoteirosViewOpen(true);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Abrir Criador de Roteiros
                </Button>
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

      {/* View de Roteiros em Tela Cheia */}
      {isRoteirosViewOpen && selectedMentorado && (
        <MentoradoRoteirosView
          mentoradoId={selectedMentorado.id}
          mentoradoNome={selectedMentorado.nome}
          onClose={() => setIsRoteirosViewOpen(false)}
        />
      )}
    </div>
  );
};

export default Mentorados;
