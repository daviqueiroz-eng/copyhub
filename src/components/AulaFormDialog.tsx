import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAula, useUpdateAula, Aula } from "@/hooks/useAulas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface AulaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduloId: string;
  aula?: Aula;
}

const AulaFormDialog = ({ open, onOpenChange, moduloId, aula }: AulaFormDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ordem, setOrdem] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const createMutation = useCreateAula();
  const updateMutation = useUpdateAula();

  useEffect(() => {
    if (aula) {
      setTitulo(aula.titulo);
      setDescricao(aula.descricao);
      setYoutubeUrl(aula.youtube_url);
      setConteudo(aula.conteudo || "");
      setDuracao(aula.duracao || "");
      setOrdem(aula.ordem);
      setThumbnailUrl((aula as any).thumbnail_url || "");
      setPreviewUrl((aula as any).thumbnail_url || "");
    } else {
      setTitulo("");
      setDescricao("");
      setYoutubeUrl("");
      setConteudo("");
      setDuracao("");
      setOrdem(0);
      setThumbnailUrl("");
      setPreviewUrl("");
    }
    setThumbnailFile(null);
  }, [aula, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem válido.",
          variant: "destructive",
        });
        return;
      }
      
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setThumbnailFile(null);
    setPreviewUrl((aula as any)?.thumbnail_url || "");
    setThumbnailUrl((aula as any)?.thumbnail_url || "");
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError, data } = await supabase.storage
      .from('aula-thumbnails')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('aula-thumbnails')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalThumbnailUrl = thumbnailUrl;

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadThumbnail(thumbnailFile);
      }

      const data = {
        titulo,
        descricao,
        youtube_url: youtubeUrl,
        conteudo: conteudo || null,
        duracao: duracao || null,
        ordem,
        modulo_id: moduloId,
        thumbnail_url: finalThumbnailUrl || null,
      };

      if (aula) {
        await updateMutation.mutateAsync({ id: aula.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {aula ? "Editar Aula" : "Nova Aula"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube">URL do Vídeo (YouTube ou Google Drive)</Label>
            <Input
              id="youtube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="YouTube ou Google Drive"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem da Capa (opcional)</Label>
            
            {previewUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                {thumbnailFile && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="thumbnail-file" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">
                      {thumbnailFile ? thumbnailFile.name : "Escolher arquivo"}
                    </span>
                  </div>
                  <Input
                    id="thumbnail-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-sm text-muted-foreground">
                Ou use uma URL
              </Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (opcional)</Label>
            <Input
              id="duracao"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="Ex: 15 min"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Notas/Materiais (opcional)</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
              placeholder="Notas adicionais, links úteis, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem</Label>
            <Input
              id="ordem"
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Enviando..." : aula ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AulaFormDialog;
