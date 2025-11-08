import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, MessageCircle, Trash2 } from "lucide-react";
import { Aula } from "@/hooks/useAulas";
import { useComentariosAulas, useCreateComentario, useDeleteComentario } from "@/hooks/useComentariosAulas";
import { useToggleProgressoAula } from "@/hooks/useProgressoAulas";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AulaViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aula: Aula | null;
  concluida: boolean;
}

const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = "";
  
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0];
  }
  
  return `https://www.youtube.com/embed/${videoId}`;
};

const AulaViewDialog = ({ open, onOpenChange, aula, concluida }: AulaViewDialogProps) => {
  const [novoComentario, setNovoComentario] = useState("");
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const isAdmin = role === "admin";

  const { data: comentarios = [] } = useComentariosAulas(aula?.id || "");
  const createComentario = useCreateComentario();
  const deleteComentario = useDeleteComentario();
  const toggleProgresso = useToggleProgressoAula();

  if (!aula) return null;

  const handleToggleConcluida = () => {
    if (!user) return;
    toggleProgresso.mutate({
      aulaId: aula.id,
      userId: user.id,
      concluido: !concluida,
    });
  };

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !novoComentario.trim()) return;

    await createComentario.mutateAsync({
      aula_id: aula.id,
      user_id: user.id,
      comentario: novoComentario,
    });

    setNovoComentario("");
  };

  const handleDeleteComentario = (comentarioId: string) => {
    deleteComentario.mutate({ id: comentarioId, aulaId: aula.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Coluna Esquerda - Vídeo */}
          <div className="bg-black flex items-center justify-center p-4">
            <iframe
              src={getYouTubeEmbedUrl(aula.youtube_url)}
              className="w-full aspect-video rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Coluna Direita - Conteúdo */}
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-2xl mb-2">{aula.titulo}</DialogTitle>
                  {aula.duracao && (
                    <Badge variant="secondary">{aula.duracao}</Badge>
                  )}
                </div>
                <Button
                  variant={concluida ? "default" : "outline"}
                  onClick={handleToggleConcluida}
                  className="gap-2"
                >
                  {concluida ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Concluída
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4" />
                      Marcar como concluída
                    </>
                  )}
                </Button>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6">
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{aula.descricao}</p>
                </div>

                {aula.conteudo && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Materiais e Notas</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{aula.conteudo}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Seção de Comentários */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-5 w-5" />
                    <h3 className="font-semibold">
                      Comentários ({comentarios.length})
                    </h3>
                  </div>

                  {/* Formulário de Novo Comentário */}
                  <form onSubmit={handleAddComentario} className="space-y-2 mb-4">
                    <Textarea
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      placeholder="Adicione um comentário..."
                      rows={3}
                    />
                    <Button type="submit" disabled={!novoComentario.trim()}>
                      Comentar
                    </Button>
                  </form>

                  {/* Lista de Comentários */}
                  <div className="space-y-4">
                    {comentarios.map((comentario) => (
                      <div key={comentario.id} className="bg-muted rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">
                              {comentario.profiles?.nome || "Usuário"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(comentario.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          {(user?.id === comentario.user_id || isAdmin) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteComentario(comentario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm">{comentario.comentario}</p>
                      </div>
                    ))}

                    {comentarios.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        Nenhum comentário ainda. Seja o primeiro a comentar!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AulaViewDialog;
