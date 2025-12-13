import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useGrupos, useCreateGrupo, Grupo } from "@/hooks/useGrupos";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { GrupoMetaHeader } from "./GrupoMetaHeader";
import { GrupoEquipeSection } from "./GrupoEquipeSection";
import { GrupoAtividadesSection } from "./GrupoAtividadesSection";
import { GrupoTagManager } from "./GrupoTagManager";
import { useGrupoMembrosVirais, countTotalVirais } from "@/hooks/useGruposMembrosVirais";

export function GrupoView() {
  const { user } = useAuth();
  const { data: grupos, isLoading } = useGrupos();
  const createGrupo = useCreateGrupo();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [novoGrupoMeta, setNovoGrupoMeta] = useState("");

  // Use first group or null
  const grupo = grupos?.[0] || null;
  const { data: virais = [] } = useGrupoMembrosVirais(grupo?.id || null);
  const isOwner = grupo?.created_by === user?.id;
  
  // Calculate total virals
  const totalPrimeiraViral = countTotalVirais(virais, "primeira_viral");
  const totalViralConstante = countTotalVirais(virais, "viral_constante");

  const handleCreateGrupo = async () => {
    if (!novoGrupoNome.trim()) {
      toast({ title: "Digite um nome para o grupo", variant: "destructive" });
      return;
    }

    try {
      await createGrupo.mutateAsync({
        nome: novoGrupoNome.trim(),
        descricao_meta: novoGrupoMeta.trim() || undefined,
      });
      toast({ title: "Grupo criado com sucesso!" });
      setShowCreateDialog(false);
      setNovoGrupoNome("");
      setNovoGrupoMeta("");
    } catch (error: any) {
      toast({ title: "Erro ao criar grupo", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!grupo) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie um grupo para gerenciar sua equipe e mentorados
          </p>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Nome do Grupo</label>
                  <Input
                    value={novoGrupoNome}
                    onChange={(e) => setNovoGrupoNome(e.target.value)}
                    placeholder="Ex: Equipe de Roteiristas"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Meta (opcional)</label>
                  <Textarea
                    value={novoGrupoMeta}
                    onChange={(e) => setNovoGrupoMeta(e.target.value)}
                    placeholder="Ex: 25 constantes / 3 primeiros virais / 90% de alinhamento"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateGrupo}
                  disabled={createGrupo.isPending}
                >
                  {createGrupo.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meta Header */}
      <GrupoMetaHeader 
        grupo={grupo} 
        isOwner={isOwner} 
        totalPrimeiraViral={totalPrimeiraViral}
        totalViralConstante={totalViralConstante}
      />

      {/* Equipe Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Equipe</CardTitle>
          {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setShowTagManager(true)}>
              ⚙️ Gerenciar Tags
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <GrupoEquipeSection grupo={grupo} isOwner={isOwner} />
        </CardContent>
      </Card>

      {/* Atividades Section */}
      <GrupoAtividadesSection grupo={grupo} isOwner={isOwner} />

      {/* Tag Manager Dialog */}
      <Dialog open={showTagManager} onOpenChange={setShowTagManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
          </DialogHeader>
          <GrupoTagManager grupoId={grupo.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
