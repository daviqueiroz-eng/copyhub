import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grupo } from "@/hooks/useGrupos";
import { useGrupoMembros, useAddGrupoMembro, useRemoveGrupoMembro, GrupoMembro } from "@/hooks/useGruposMembros";
import { useGrupoMentorados, useCreateGrupoMentorado, useDeleteGrupoMentorado, GrupoMentorado } from "@/hooks/useGruposMentorados";
import { useGrupoTags, GrupoTag } from "@/hooks/useGruposTags";
import { useAssignTag, useRemoveTag } from "@/hooks/useGruposMentorados";
import { useGrupoMembrosVirais, useAddViral, useRemoveViral, countViralsByMembro, GrupoMembroViral } from "@/hooks/useGruposMembrosVirais";
import { Plus, Trash2, User, Loader2, X, Flame, Zap, History, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GrupoEquipeSectionProps {
  grupo: Grupo;
  isOwner: boolean;
}

interface Profile {
  user_id: string;
  nome: string;
  avatar: string | null;
}

interface ViralDialogState {
  open: boolean;
  membroId: string;
  tipo: "primeira_viral" | "viral_constante";
}

interface HistoryDialogState {
  open: boolean;
  membroId: string;
  membroNome: string;
}

export function GrupoEquipeSection({ grupo, isOwner }: GrupoEquipeSectionProps) {
  const { data: membros = [], isLoading: loadingMembros } = useGrupoMembros(grupo.id);
  const { data: mentorados = [], isLoading: loadingMentorados } = useGrupoMentorados(grupo.id);
  const { data: tags = [] } = useGrupoTags(grupo.id);
  const { data: virais = [] } = useGrupoMembrosVirais(grupo.id);
  
  const addMembro = useAddGrupoMembro();
  const removeMembro = useRemoveGrupoMembro();
  const createMentorado = useCreateGrupoMentorado();
  const deleteMentorado = useDeleteGrupoMentorado();
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();
  const addViral = useAddViral();
  const removeViral = useRemoveViral();

  const [showAddMembro, setShowAddMembro] = useState(false);
  const [showAddMentorado, setShowAddMentorado] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [apelido, setApelido] = useState("");
  const [novoMentoradoNome, setNovoMentoradoNome] = useState("");
  
  // Viral dialog states
  const [viralDialog, setViralDialog] = useState<ViralDialogState>({ open: false, membroId: "", tipo: "primeira_viral" });
  const [viralLinkVideo, setViralLinkVideo] = useState("");
  
  // History dialog state
  const [historyDialog, setHistoryDialog] = useState<HistoryDialogState>({ open: false, membroId: "", membroNome: "" });

  // Fetch all profiles for selection
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-grupo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, avatar")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Filter out already added members
  const availableProfiles = profiles.filter(
    p => !membros.some(m => m.user_id === p.user_id)
  );

  const handleAddMembro = async () => {
    if (!selectedUserId || !apelido.trim()) {
      toast({ title: "Selecione um usuário e digite um apelido", variant: "destructive" });
      return;
    }

    try {
      await addMembro.mutateAsync({
        grupo_id: grupo.id,
        user_id: selectedUserId,
        apelido: apelido.trim(),
      });
      toast({ title: "Membro adicionado!" });
      setShowAddMembro(false);
      setSelectedUserId("");
      setApelido("");
    } catch (error: any) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    }
  };

  const handleAddMentorado = async (membroId: string) => {
    if (!novoMentoradoNome.trim()) {
      toast({ title: "Digite o nome do mentorado", variant: "destructive" });
      return;
    }

    try {
      await createMentorado.mutateAsync({
        grupo_id: grupo.id,
        membro_id: membroId,
        nome: novoMentoradoNome.trim(),
      });
      toast({ title: "Mentorado adicionado!" });
      setShowAddMentorado(null);
      setNovoMentoradoNome("");
    } catch (error: any) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleTag = async (mentorado: GrupoMentorado, tag: { id: string; nome: string; cor: string }) => {
    const hasTag = mentorado.tags?.some(t => t.id === tag.id);
    
    try {
      if (hasTag) {
        await removeTag.mutateAsync({ mentorado_id: mentorado.id, tag_id: tag.id, grupo_id: grupo.id });
      } else {
        await assignTag.mutateAsync({ mentorado_id: mentorado.id, tag_id: tag.id, grupo_id: grupo.id });
      }
    } catch (error: any) {
      toast({ title: "Erro ao atualizar tag", description: error.message, variant: "destructive" });
    }
  };

  const openViralDialog = (membroId: string, tipo: "primeira_viral" | "viral_constante") => {
    setViralDialog({ open: true, membroId, tipo });
    setViralLinkVideo("");
  };

  const handleAddViral = async () => {
    try {
      await addViral.mutateAsync({
        membro_id: viralDialog.membroId,
        tipo: viralDialog.tipo,
        grupo_id: grupo.id,
        link_video: viralLinkVideo.trim() || undefined,
      });
      toast({ title: viralDialog.tipo === "primeira_viral" ? "Primeira Viral registrada!" : "Viral Constante registrado!" });
      setViralDialog({ open: false, membroId: "", tipo: "primeira_viral" });
      setViralLinkVideo("");
    } catch (error: any) {
      toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteViral = async (viralId: string) => {
    try {
      await removeViral.mutateAsync({ id: viralId, grupo_id: grupo.id });
      toast({ title: "Viral removido!" });
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const openHistoryDialog = (membroId: string, membroNome: string) => {
    setHistoryDialog({ open: true, membroId, membroNome });
  };

  const getMembroVirais = (membroId: string): GrupoMembroViral[] => {
    return virais.filter(v => v.membro_id === membroId).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  if (loadingMembros || loadingMentorados) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal grid layout for members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {membros.map((membro) => {
          const membroMentorados = mentorados.filter(m => m.membro_id === membro.id);
          const primeiraViralCount = countViralsByMembro(virais, membro.id, "primeira_viral");
          const viralConstanteCount = countViralsByMembro(virais, membro.id, "viral_constante");
          
          return (
            <Card key={membro.id} className="border-border/50">
              <CardContent className="p-4 space-y-4">
                {/* Member header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">{membro.apelido}</span>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeMembro.mutate({ id: membro.id, grupo_id: grupo.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Viral counters */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-orange-500/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">1ª Viral</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-500">{primeiraViralCount}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-1 h-7 text-xs hover:bg-orange-500/20"
                      onClick={() => openViralDialog(membro.id, "primeira_viral")}
                      disabled={addViral.isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Registrar
                    </Button>
                  </div>
                  <div className="flex-1 bg-blue-500/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Constante</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-500">{viralConstanteCount}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-1 h-7 text-xs hover:bg-blue-500/20"
                      onClick={() => openViralDialog(membro.id, "viral_constante")}
                      disabled={addViral.isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Registrar
                    </Button>
                  </div>
                </div>

                {/* History button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => openHistoryDialog(membro.id, membro.apelido)}
                >
                  <History className="h-3 w-3 mr-1" />
                  Ver Histórico ({getMembroVirais(membro.id).length})
                </Button>

                {/* Mentorados list */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Mentorados</span>
                  {membroMentorados.map((mentorado) => (
                    <div key={mentorado.id} className="flex items-center justify-between gap-2 py-1 px-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm truncate">👤 {mentorado.nome}</span>
                        <div className="flex gap-1 flex-shrink-0">
                          {mentorado.tags?.map((tag) => (
                            <span
                              key={tag.id}
                              className="h-3 w-3 rounded-full cursor-pointer hover:ring-2 ring-offset-1"
                              style={{ backgroundColor: tag.cor }}
                              title={tag.nome}
                              onClick={() => handleToggleTag(mentorado, tag)}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {tags.filter(t => !mentorado.tags?.some(mt => mt.id === t.id)).map((tag) => (
                          <button
                            key={tag.id}
                            className="h-3 w-3 rounded-full opacity-30 hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: tag.cor }}
                            title={`Adicionar: ${tag.nome}`}
                            onClick={() => handleToggleTag(mentorado, { id: tag.id, nome: tag.nome, cor: tag.cor })}
                          />
                        ))}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive hover:text-destructive"
                          onClick={() => deleteMentorado.mutate({ id: mentorado.id, grupo_id: grupo.id })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {showAddMentorado === membro.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={novoMentoradoNome}
                        onChange={(e) => setNovoMentoradoNome(e.target.value)}
                        placeholder="Nome do mentorado"
                        className="h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMentorado(membro.id)}
                      />
                      <Button size="sm" className="h-8" onClick={() => handleAddMentorado(membro.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAddMentorado(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground h-7"
                      onClick={() => setShowAddMentorado(membro.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar mentorado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isOwner && (
        <Button variant="outline" className="w-full" onClick={() => setShowAddMembro(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar membro
        </Button>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddMembro} onOpenChange={setShowAddMembro}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Usuário</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Apelido no grupo</label>
              <Input
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: Potencial do Davi"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAddMembro}
              disabled={addMembro.isPending}
            >
              {addMembro.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Viral Dialog */}
      <Dialog open={viralDialog.open} onOpenChange={(open) => !open && setViralDialog({ open: false, membroId: "", tipo: "primeira_viral" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viralDialog.tipo === "primeira_viral" ? (
                <>
                  <Flame className="h-5 w-5 text-orange-500" />
                  Registrar Primeira Viral
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 text-blue-500" />
                  Registrar Viral Constante
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Link do Vídeo (opcional)</label>
              <Input
                value={viralLinkVideo}
                onChange={(e) => setViralLinkVideo(e.target.value)}
                placeholder="https://instagram.com/reel/..."
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAddViral}
              disabled={addViral.isPending}
            >
              {addViral.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => !open && setHistoryDialog({ open: false, membroId: "", membroNome: "" })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Virais - {historyDialog.membroNome}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-2 pt-4">
            {getMembroVirais(historyDialog.membroId).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum viral registrado ainda.</p>
            ) : (
              getMembroVirais(historyDialog.membroId).map((viral) => (
                <div 
                  key={viral.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    viral.tipo === "primeira_viral" 
                      ? "bg-orange-500/5 border-orange-500/20" 
                      : "bg-blue-500/5 border-blue-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {viral.tipo === "primeira_viral" ? (
                      <Flame className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Zap className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <span className="font-medium text-sm">
                        {viral.tipo === "primeira_viral" ? "Primeira Viral" : "Viral Constante"}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(viral.data_registro), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {viral.link_video && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(viral.link_video!, "_blank")}
                        title="Abrir vídeo"
                      >
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteViral(viral.id)}
                      disabled={removeViral.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
