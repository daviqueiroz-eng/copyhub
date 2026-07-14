import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Play,
  Copy,
  Eye,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useEstruturaFormatos,
  useEstruturaVideos,
  useEstruturaFavoritos,
  useToggleFavorito,
  useDeleteFormato,
  useDeleteVideo,
  useSignedImageUrl,
  EstruturaFormato,
  EstruturaVideo,
} from "@/hooks/useEstruturaFormatos";
import { useUserRole } from "@/hooks/useAuth";
import { EstruturaFormatoFormDialog } from "./EstruturaFormatoFormDialog";
import { EstruturaVideoFormDialog } from "./EstruturaVideoFormDialog";
import { Dialog as UiDialog, DialogContent as UiDialogContent, DialogHeader as UiDialogHeader, DialogTitle as UiDialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const formatViews = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
};

const VideoCard = ({
  video,
  favorito,
  isAdmin,
  onPlay,
  onEdit,
  onDelete,
  onToggleFav,
}: {
  video: EstruturaVideo;
  favorito: boolean;
  isAdmin: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFav: () => void;
}) => {
  const { data: imgUrl } = useSignedImageUrl(video.imagem_path);
  const [transcricaoOpen, setTranscricaoOpen] = useState(false);

  const handleCopy = () => {
    if (!video.transcricao) {
      toast.error("Sem transcrição");
      return;
    }
    navigator.clipboard
      .writeText(video.transcricao)
      .then(() => toast.success("Transcrição copiada!"))
      .catch(() => toast.error("Erro ao copiar"));
  };

  return (
    <>
    <div className="group border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow flex flex-col">
      <div className="relative aspect-video bg-muted cursor-pointer" onClick={onPlay}>
        {imgUrl ? (
          <img src={imgUrl} alt={video.titulo ?? ""} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            Sem imagem
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="bg-primary/90 rounded-full p-3 opacity-90 group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className={cn(
            "absolute top-2 left-2 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors",
            favorito
              ? "bg-yellow-400 text-yellow-950"
              : "bg-black/40 text-white hover:bg-black/60",
          )}
          title={favorito ? "Remover favorito" : "Favoritar"}
        >
          <Star className={cn("h-4 w-4", favorito && "fill-current")} />
        </button>
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        {video.titulo && (
          <div className="text-sm font-medium line-clamp-2">{video.titulo}</div>
        )}
        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {formatViews(video.views)} views
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-xs px-2"
              onClick={() => setTranscricaoOpen(true)}
              disabled={!video.transcricao}
              title="Ver transcrição"
            >
              <FileText className="h-3 w-3" />
              Ver
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
              <Copy className="h-3 w-3" />
              Copiar
            </Button>
          </div>
        </div>
      </div>
    </div>
    <UiDialog open={transcricaoOpen} onOpenChange={setTranscricaoOpen}>
      <UiDialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <UiDialogHeader>
          <UiDialogTitle>{video.titulo || "Transcrição"}</UiDialogTitle>
        </UiDialogHeader>
        <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed p-1">
          {video.transcricao || <span className="text-muted-foreground">Sem transcrição</span>}
        </div>
        {video.transcricao && (
          <div className="pt-2 border-t flex justify-end">
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copiar transcrição
            </Button>
          </div>
        )}
      </UiDialogContent>
    </UiDialog>
    </>
  );
};

export const EstruturaDialog = ({ open, onOpenChange }: Props) => {
  const { data: role } = useUserRole();
  const isAdmin = role === "admin";

  const { data: formatos = [] } = useEstruturaFormatos();
  const { data: favoritos } = useEstruturaFavoritos();
  const toggleFav = useToggleFavorito();
  const delFormato = useDeleteFormato();
  const delVideo = useDeleteVideo();

  const [selectedFormatoId, setSelectedFormatoId] = useState<string | null>(null);
  const { data: videos = [] } = useEstruturaVideos(selectedFormatoId);

  const [formatoFormOpen, setFormatoFormOpen] = useState(false);
  const [editingFormato, setEditingFormato] = useState<EstruturaFormato | null>(null);

  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<EstruturaVideo | null>(null);

  const [confirmDelFormato, setConfirmDelFormato] = useState<EstruturaFormato | null>(null);
  const [confirmDelVideo, setConfirmDelVideo] = useState<EstruturaVideo | null>(null);

  useEffect(() => {
    if (!selectedFormatoId && formatos.length > 0) {
      setSelectedFormatoId(formatos[0].id);
    }
    if (selectedFormatoId && !formatos.find((f) => f.id === selectedFormatoId)) {
      setSelectedFormatoId(formatos[0]?.id ?? null);
    }
  }, [formatos, selectedFormatoId]);

  const sortedVideos = useMemo(() => {
    const favSet = favoritos ?? new Set<string>();
    return [...videos].sort((a, b) => {
      const af = favSet.has(a.id) ? 1 : 0;
      const bf = favSet.has(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [videos, favoritos]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-6xl h-[85vh] p-0 gap-0 flex flex-col"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle style={{ color: "#B8860B" }}>Estrutura</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex min-h-0">
            {/* Sidebar de formatos */}
            <aside className="w-56 border-r p-3 flex flex-col gap-2 overflow-y-auto">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start gap-2 mb-1"
                  onClick={() => {
                    setEditingFormato(null);
                    setFormatoFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Novo formato
                </Button>
              )}
              {formatos.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  Nenhum formato ainda
                </p>
              )}
              {formatos.map((f) => (
                <div key={f.id} className="group/formato relative">
                  <button
                    type="button"
                    onClick={() => setSelectedFormatoId(f.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors",
                      selectedFormatoId === f.id
                        ? "bg-primary/10 border-primary/40 font-medium"
                        : "bg-muted/20 hover:bg-muted/40 border-transparent",
                    )}
                  >
                    {f.nome}
                  </button>
                  {isAdmin && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/formato:flex gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFormato(f);
                          setFormatoFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelFormato(f);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </aside>

            {/* Área principal */}
            <main className="flex-1 flex flex-col min-w-0">
              <div className="px-6 py-3 border-b flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedFormatoId
                    ? `${sortedVideos.length} vídeo${sortedVideos.length === 1 ? "" : "s"}`
                    : "Selecione um formato"}
                </div>
                {isAdmin && selectedFormatoId && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingVideo(null);
                      setVideoFormOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar vídeo
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!selectedFormatoId ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Nenhum formato selecionado
                  </div>
                ) : sortedVideos.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Nenhum vídeo neste formato ainda
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedVideos.map((v) => (
                      <VideoCard
                        key={v.id}
                        video={v}
                        favorito={favoritos?.has(v.id) ?? false}
                        isAdmin={isAdmin}
                        onPlay={() => {
                          if (v.link_video) {
                            window.open(v.link_video, "_blank", "noopener,noreferrer");
                          } else {
                            toast.error("Sem link de vídeo");
                          }
                        }}
                        onEdit={() => {
                          setEditingVideo(v);
                          setVideoFormOpen(true);
                        }}
                        onDelete={() => setConfirmDelVideo(v)}
                        onToggleFav={() =>
                          toggleFav.mutate({
                            videoId: v.id,
                            favorito: favoritos?.has(v.id) ?? false,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </main>
          </div>
        </DialogContent>
      </Dialog>

      <EstruturaFormatoFormDialog
        open={formatoFormOpen}
        onOpenChange={setFormatoFormOpen}
        formato={editingFormato}
      />
      {selectedFormatoId && (
        <EstruturaVideoFormDialog
          open={videoFormOpen}
          onOpenChange={setVideoFormOpen}
          formatoId={selectedFormatoId}
          video={editingVideo}
        />
      )}

      <AlertDialog open={!!confirmDelFormato} onOpenChange={(o) => !o && setConfirmDelFormato(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formato?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os vídeos deste formato serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelFormato) {
                  await delFormato.mutateAsync(confirmDelFormato.id);
                  setConfirmDelFormato(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelVideo} onOpenChange={(o) => !o && setConfirmDelVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vídeo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelVideo) {
                  await delVideo.mutateAsync({
                    id: confirmDelVideo.id,
                    formato_id: confirmDelVideo.formato_id,
                    imagem_path: confirmDelVideo.imagem_path,
                  });
                  setConfirmDelVideo(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};