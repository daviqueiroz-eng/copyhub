import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, PlayCircle, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Treinamento } from "@/hooks/useTreinamentos";
import { useModulos, useDeleteModulo } from "@/hooks/useModulos";
import { useAulas, useDeleteAula } from "@/hooks/useAulas";
import { useProgressoAulas } from "@/hooks/useProgressoAulas";
import { useComentariosAulas } from "@/hooks/useComentariosAulas";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useAuth";
import ModuloFormDialog from "./ModuloFormDialog";
import AulaFormDialog from "./AulaFormDialog";
import AulaViewDialog from "./AulaViewDialog";
import TreinamentoFormDialog from "./TreinamentoFormDialog";

interface TreinamentoDetailViewProps {
  treinamento: Treinamento;
  onBack: () => void;
}

const getYouTubeThumbnail = (url: string): string => {
  let videoId = "";
  
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0];
  }
  
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "";
};

const TreinamentoDetailView = ({ treinamento, onBack }: TreinamentoDetailViewProps) => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const isAdmin = role === "admin";

  const [editTreinamentoOpen, setEditTreinamentoOpen] = useState(false);
  const [moduloDialogOpen, setModuloDialogOpen] = useState(false);
  const [aulaDialogOpen, setAulaDialogOpen] = useState(false);
  const [aulaViewOpen, setAulaViewOpen] = useState(false);
  const [selectedModulo, setSelectedModulo] = useState<any>(null);
  const [selectedAula, setSelectedAula] = useState<any>(null);
  const [deleteModuloId, setDeleteModuloId] = useState<string | null>(null);
  const [deleteAulaId, setDeleteAulaId] = useState<{ id: string; moduloId: string } | null>(null);

  const { data: modulos = [] } = useModulos(treinamento.id);
  const { data: progresso = [] } = useProgressoAulas(user?.id);
  const deleteModuloMutation = useDeleteModulo();
  const deleteAulaMutation = useDeleteAula();

  // Calcular progresso geral
  const allAulas = modulos.flatMap(modulo => {
    const { data: aulas = [] } = useAulas(modulo.id);
    return aulas.map(aula => ({ ...aula, moduloId: modulo.id }));
  });

  const totalAulas = allAulas.length;
  const aulasConcluidas = progresso.filter(p => 
    allAulas.some(a => a.id === p.aula_id) && p.concluido
  ).length;
  const progressoGeral = totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0;

  const handleEditModulo = (modulo: any) => {
    setSelectedModulo(modulo);
    setModuloDialogOpen(true);
  };

  const handleAddAula = (moduloId: string) => {
    setSelectedModulo({ id: moduloId });
    setSelectedAula(null);
    setAulaDialogOpen(true);
  };

  const handleEditAula = (aula: any) => {
    setSelectedModulo({ id: aula.modulo_id });
    setSelectedAula(aula);
    setAulaDialogOpen(true);
  };

  const handleViewAula = (aula: any) => {
    const aulaConcluida = progresso.some(p => p.aula_id === aula.id && p.concluido);
    setSelectedAula({ ...aula, concluida: aulaConcluida });
    setAulaViewOpen(true);
  };

  const handleDeleteModulo = async () => {
    if (deleteModuloId) {
      await deleteModuloMutation.mutateAsync({ 
        id: deleteModuloId, 
        treinamentoId: treinamento.id 
      });
      setDeleteModuloId(null);
    }
  };

  const handleDeleteAula = async () => {
    if (deleteAulaId) {
      await deleteAulaMutation.mutateAsync(deleteAulaId);
      setDeleteAulaId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-3xl font-bold text-foreground">{treinamento.titulo}</h2>
          <p className="text-muted-foreground mt-2">{treinamento.descricao}</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {aulasConcluidas} de {totalAulas} aulas concluídas
              </span>
              <span className="font-semibold">{Math.round(progressoGeral)}%</span>
            </div>
            <Progress value={progressoGeral} className="h-2" />
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditTreinamentoOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button onClick={() => { setSelectedModulo(null); setModuloDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Adicionar Módulo
            </Button>
          </div>
        )}
      </div>

      {/* Módulos */}
      <div className="space-y-4">
        {modulos.map((modulo) => {
          const { data: aulas = [] } = useAulas(modulo.id);
          const { data: comentariosCount } = useComentariosAulas("");
          
          const aulasModulo = aulas.length;
          const aulasModuloConcluidas = progresso.filter(p => 
            aulas.some(a => a.id === p.aula_id) && p.concluido
          ).length;
          const progressoModulo = aulasModulo > 0 ? (aulasModuloConcluidas / aulasModulo) * 100 : 0;

          return (
            <Collapsible key={modulo.id} defaultOpen>
              <div className="border rounded-lg">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{modulo.titulo}</h3>
                        <Badge variant="secondary">
                          {aulasModuloConcluidas}/{aulasModulo} aulas
                        </Badge>
                      </div>
                      <Progress value={progressoModulo} className="h-1 w-64" />
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditModulo(modulo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteModuloId(modulo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddAula(modulo.id)}
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Aula
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-2">
                    {aulas.map((aula) => {
                      const aulaConcluida = progresso.some(p => p.aula_id === aula.id && p.concluido);
                      const { data: comentarios = [] } = useComentariosAulas(aula.id);
                      
                      return (
                        <div
                          key={aula.id}
                          className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer group"
                          onClick={() => handleViewAula(aula)}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                            <img
                              src={getYouTubeThumbnail(aula.youtube_url)}
                              alt={aula.titulo}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <PlayCircle className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              {aulaConcluida ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium group-hover:text-primary transition-colors">
                                  {aula.titulo}
                                </h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  {aula.duracao && <span>{aula.duracao}</span>}
                                  {comentarios.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      <span>{comentarios.length}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions Admin */}
                          {isAdmin && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditAula(aula)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteAulaId({ id: aula.id, moduloId: modulo.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {aulas.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        Nenhuma aula ainda. {isAdmin && "Adicione a primeira aula!"}
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {modulos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum módulo cadastrado ainda.</p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => { setSelectedModulo(null); setModuloDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Módulo
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TreinamentoFormDialog
        open={editTreinamentoOpen}
        onOpenChange={setEditTreinamentoOpen}
        treinamento={treinamento}
      />

      <ModuloFormDialog
        open={moduloDialogOpen}
        onOpenChange={setModuloDialogOpen}
        treinamentoId={treinamento.id}
        modulo={selectedModulo}
      />

      <AulaFormDialog
        open={aulaDialogOpen}
        onOpenChange={setAulaDialogOpen}
        moduloId={selectedModulo?.id || ""}
        aula={selectedAula}
      />

      <AulaViewDialog
        open={aulaViewOpen}
        onOpenChange={setAulaViewOpen}
        aula={selectedAula}
        concluida={selectedAula?.concluida || false}
      />

      {/* Delete Dialogs */}
      <AlertDialog open={!!deleteModuloId} onOpenChange={() => setDeleteModuloId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Módulo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso também deletará todas as aulas deste módulo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModulo}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAulaId} onOpenChange={() => setDeleteAulaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Aula</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta aula?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAula}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TreinamentoDetailView;
