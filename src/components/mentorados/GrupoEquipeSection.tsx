import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grupo } from "@/hooks/useGrupos";
import { useGrupoMembros, useAddGrupoMembro, useRemoveGrupoMembro, GrupoMembro } from "@/hooks/useGruposMembros";
import { useGrupoMentorados, useCreateGrupoMentorado, useDeleteGrupoMentorado, GrupoMentorado } from "@/hooks/useGruposMentorados";
import { useGrupoTags, GrupoTag } from "@/hooks/useGruposTags";
import { useAssignTag, useRemoveTag } from "@/hooks/useGruposMentorados";
import { Plus, Trash2, User, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface GrupoEquipeSectionProps {
  grupo: Grupo;
  isOwner: boolean;
}

interface Profile {
  user_id: string;
  nome: string;
  avatar: string | null;
}

export function GrupoEquipeSection({ grupo, isOwner }: GrupoEquipeSectionProps) {
  const { data: membros = [], isLoading: loadingMembros } = useGrupoMembros(grupo.id);
  const { data: mentorados = [], isLoading: loadingMentorados } = useGrupoMentorados(grupo.id);
  const { data: tags = [] } = useGrupoTags(grupo.id);
  
  const addMembro = useAddGrupoMembro();
  const removeMembro = useRemoveGrupoMembro();
  const createMentorado = useCreateGrupoMentorado();
  const deleteMentorado = useDeleteGrupoMentorado();
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();

  const [showAddMembro, setShowAddMembro] = useState(false);
  const [showAddMentorado, setShowAddMentorado] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [apelido, setApelido] = useState("");
  const [novoMentoradoNome, setNovoMentoradoNome] = useState("");

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

  if (loadingMembros || loadingMentorados) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {membros.map((membro) => {
        const membroMentorados = mentorados.filter(m => m.membro_id === membro.id);
        
        return (
          <div key={membro.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{membro.apelido}</span>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeMembro.mutate({ id: membro.id, grupo_id: grupo.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="pl-10 space-y-2">
              {membroMentorados.map((mentorado) => (
                <div key={mentorado.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm">👤 {mentorado.nome}</span>
                    <div className="flex gap-1 flex-wrap">
                      {mentorado.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="h-4 w-4 rounded-full cursor-pointer hover:ring-2 ring-offset-1"
                          style={{ backgroundColor: tag.cor }}
                          title={tag.nome}
                          onClick={() => handleToggleTag(mentorado, tag)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {tags.filter(t => !mentorado.tags?.some(mt => mt.id === t.id)).map((tag) => (
                      <button
                        key={tag.id}
                        className="h-4 w-4 rounded-full opacity-30 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: tag.cor }}
                        title={`Adicionar: ${tag.nome}`}
                        onClick={() => handleToggleTag(mentorado, { id: tag.id, nome: tag.nome, cor: tag.cor })}
                      />
                    ))}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
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
                  className="text-xs text-muted-foreground"
                  onClick={() => setShowAddMentorado(membro.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar mentorado
                </Button>
              )}
            </div>
          </div>
        );
      })}

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
    </div>
  );
}
