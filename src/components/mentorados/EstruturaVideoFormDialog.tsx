import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import {
  useCreateVideo,
  useUpdateVideo,
  useUploadEstruturaImagem,
  EstruturaVideo,
} from "@/hooks/useEstruturaFormatos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formatoId: string;
  video?: EstruturaVideo | null;
}

export const EstruturaVideoFormDialog = ({ open, onOpenChange, formatoId, video }: Props) => {
  const [titulo, setTitulo] = useState("");
  const [linkVideo, setLinkVideo] = useState("");
  const [views, setViews] = useState("0");
  const [transcricao, setTranscricao] = useState("");
  const [imagemPath, setImagemPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const create = useCreateVideo();
  const update = useUpdateVideo();
  const upload = useUploadEstruturaImagem();

  useEffect(() => {
    if (open) {
      setTitulo(video?.titulo ?? "");
      setLinkVideo(video?.link_video ?? "");
      setViews(String(video?.views ?? 0));
      setTranscricao(video?.transcricao ?? "");
      setImagemPath(video?.imagem_path ?? null);
    }
  }, [open, video]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const path = await upload.mutateAsync({ file, formatoId });
      setImagemPath(path);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!linkVideo.trim()) return;
    const payload = {
      titulo: titulo.trim() || null,
      link_video: linkVideo.trim(),
      views: parseInt(views) || 0,
      transcricao: transcricao.trim() || null,
      imagem_path: imagemPath,
    };
    if (video) {
      await update.mutateAsync({ id: video.id, ...payload });
    } else {
      await create.mutateAsync({ formato_id: formatoId, ...payload });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? "Editar vídeo" : "Novo vídeo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label style={{ color: "#B8860B" }}>Título (opcional)</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label style={{ color: "#B8860B" }}>Link do vídeo</Label>
            <Input
              value={linkVideo}
              onChange={(e) => setLinkVideo(e.target.value)}
              placeholder="YouTube ou Google Drive"
            />
          </div>
          <div>
            <Label style={{ color: "#B8860B" }}>Imagem</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("estr-img-file")?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {imagemPath ? "Trocar imagem" : "Enviar imagem"}
              </Button>
              <input
                id="estr-img-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {imagemPath && <span className="text-xs text-muted-foreground truncate">{imagemPath}</span>}
            </div>
          </div>
          <div>
            <Label style={{ color: "#B8860B" }}>Número de views</Label>
            <Input type="number" min={0} value={views} onChange={(e) => setViews(e.target.value)} />
          </div>
          <div>
            <Label style={{ color: "#B8860B" }}>Transcrição</Label>
            <Textarea
              value={transcricao}
              onChange={(e) => setTranscricao(e.target.value)}
              className="min-h-[180px]"
              placeholder="Cole a transcrição completa..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={save}
            disabled={!linkVideo.trim() || create.isPending || update.isPending || uploading}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};