import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type Prompt } from "@/hooks/usePrompts";

interface PromptViewDialogProps {
  prompt: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Função para extrair ID do vídeo do YouTube de diferentes formatos de URL
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

export const PromptViewDialog = ({ prompt, open, onOpenChange }: PromptViewDialogProps) => {
  if (!prompt) return null;

  const embedUrl = getYouTubeEmbedUrl(prompt.youtube_url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{prompt.titulo}</DialogTitle>
              <p className="text-muted-foreground mt-1">{prompt.descricao}</p>
            </div>
            <Badge variant="secondary">{prompt.nicho}</Badge>
          </div>
        </DialogHeader>

        <Separator />

        {/* Layout Split: 50% Vídeo | 50% Comentários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 overflow-hidden">
          {/* Coluna Esquerda: Vídeo do YouTube */}
          <div className="bg-black flex items-center justify-center p-4">
            <iframe
              src={embedUrl}
              title={prompt.titulo}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Coluna Direita: Comentários e Conteúdo */}
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Comentários do Admin */}
              {prompt.comentarios && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    💬 Comentários do Instrutor
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                    {prompt.comentarios}
                  </div>
                </div>
              )}

              {prompt.comentarios && <Separator />}

              {/* Conteúdo do Prompt */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  ✨ Prompt
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                  {prompt.conteudo}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
