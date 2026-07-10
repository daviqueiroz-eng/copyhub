import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getVideoEmbedUrl } from "@/lib/videoUtils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  linkVideo: string | null;
  titulo?: string | null;
}

export const EstruturaVideoPlayerDialog = ({ open, onOpenChange, linkVideo, titulo }: Props) => {
  const embed = linkVideo ? getVideoEmbedUrl(linkVideo) : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{titulo || "Vídeo"}</DialogTitle>
        </DialogHeader>
        {embed && (
          <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
            <iframe
              src={embed}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};