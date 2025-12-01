import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Comunicado, useReacoes, useToggleReacao, useComentariosMural, useCreateComentarioMural, useDeleteComentarioMural, useDeleteComunicado } from "@/hooks/useMural";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ComunicadoCardProps {
  comunicado: Comunicado;
}

const EMOJIS = ['👍', '❤️', '🎉', '👏', '🔥'];

export const ComunicadoCard = ({ comunicado }: ComunicadoCardProps) => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const [showComentarios, setShowComentarios] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");

  const { data: reacoes = [] } = useReacoes(comunicado.id);
  const { data: comentarios = [] } = useComentariosMural(comunicado.id);
  const toggleReacaoMutation = useToggleReacao();
  const createComentarioMutation = useCreateComentarioMural();
  const deleteComentarioMutation = useDeleteComentarioMural();
  const deleteComunicadoMutation = useDeleteComunicado();

  const isAdmin = role === "admin";

  // Agrupar reações por emoji
  const reacoesPorEmoji = EMOJIS.map(emoji => ({
    emoji,
    count: reacoes.filter(r => r.emoji === emoji).length,
    userReagiu: reacoes.some(r => r.emoji === emoji && r.user_id === user?.id),
  }));

  const handleReacao = (emoji: string) => {
    if (!user) return;
    toggleReacaoMutation.mutate({
      comunicadoId: comunicado.id,
      emoji,
      userId: user.id,
    });
  };

  const handleEnviarComentario = async () => {
    if (!user || !novoComentario.trim()) return;

    await createComentarioMutation.mutateAsync({
      comunicadoId: comunicado.id,
      comentario: novoComentario.trim(),
      userId: user.id,
    });

    setNovoComentario("");
  };

  const handleDeletarComentario = (comentarioId: string) => {
    deleteComentarioMutation.mutate({
      id: comentarioId,
      comunicadoId: comunicado.id,
    });
  };

  const handleDeletarComunicado = () => {
    deleteComunicadoMutation.mutate(comunicado.id);
  };

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'importante':
        return 'default';
      case 'atualização':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{comunicado.titulo}</CardTitle>
            <CardDescription>
              {format(new Date(comunicado.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {comunicado.profiles && ` • por ${comunicado.profiles.nome}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getBadgeVariant(comunicado.tipo)}>
              {comunicado.tipo}
            </Badge>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar comunicado?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O comunicado e todos os comentários serão permanentemente deletados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletarComunicado} className="bg-destructive hover:bg-destructive/90">
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground whitespace-pre-wrap">{comunicado.conteudo}</p>

        {/* Reações */}
        <div className="flex items-center gap-2 flex-wrap">
          {reacoesPorEmoji.map(({ emoji, count, userReagiu }) => (
            <Button
              key={emoji}
              variant={userReagiu ? "default" : "outline"}
              size="sm"
              onClick={() => handleReacao(emoji)}
              className="gap-1"
            >
              <span className="text-base">{emoji}</span>
              {count > 0 && <span className="text-xs">{count}</span>}
            </Button>
          ))}
        </div>

        {/* Comentários */}
        <div className="space-y-3 border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComentarios(!showComentarios)}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{comentarios.length} comentários</span>
            </div>
            {showComentarios ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showComentarios && (
            <div className="space-y-3">
              {/* Lista de comentários */}
              {comentarios.map((comentario) => (
                <div key={comentario.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comentario.profiles?.avatar || undefined} />
                    <AvatarFallback>
                      {comentario.profiles?.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{comentario.profiles?.nome}</span>
                      {(isAdmin || comentario.user_id === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeletarComentario(comentario.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{comentario.comentario}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comentario.created_at), "d/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Input novo comentário */}
              <div className="flex gap-2">
                <Textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleEnviarComentario}
                  disabled={!novoComentario.trim() || createComentarioMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};