import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { useFlowBiblioteca } from "@/hooks/useFlowBiblioteca";
import { BibliotecaMusicasDialog } from "./BibliotecaMusicasDialog";
import { useUserRole } from "@/hooks/useAuth";

type PomodoroConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PomodoroConfigDialog = ({ open, onOpenChange }: PomodoroConfigDialogProps) => {
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === "admin";
  const { musicas } = useFlowBiblioteca();

  const {
    tempoCustomizado,
    setTempoCustomizado,
    pausaCurtaCustomizada,
    setPausaCurtaCustomizada,
    youtubeUrl,
    setYoutubeUrl,
    setVideoId,
    fonteSelecionada,
    setFonteSelecionada,
    resetTimer,
  } = usePomodoro();

  const [customMinutosPomo, setCustomMinutosPomo] = useState(
    tempoCustomizado ? Math.floor(tempoCustomizado / 60) : 25
  );
  
  const [customMinutosPausa, setCustomMinutosPausa] = useState(
    pausaCurtaCustomizada ? Math.floor(pausaCurtaCustomizada / 60) : 5
  );

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const videoId = extractYouTubeId(url);
    setVideoId(videoId);
    localStorage.setItem("pomodoro_youtube_url", url);
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleCustomTimeSubmit = () => {
    const segundosPomo = customMinutosPomo * 60;
    const segundosPausa = customMinutosPausa * 60;
    setTempoCustomizado(segundosPomo);
    setPausaCurtaCustomizada(segundosPausa);
    resetTimer();
    onOpenChange(false);
  };

  const handleFonteChange = (fonte: "manual" | "biblioteca") => {
    setFonteSelecionada(fonte);
    if (fonte === "manual") {
      const savedUrl = localStorage.getItem("pomodoro_youtube_url");
      if (savedUrl) {
        handleYoutubeUrlChange(savedUrl);
      }
    }
  };

  const handleBibliotecaSelect = (musica: { youtube_url: string }) => {
    handleYoutubeUrlChange(musica.youtube_url);
    setFonteSelecionada("biblioteca");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações do Pomodoro</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Duração do Pomo */}
            <div className="space-y-2">
              <Label>Duração do Pomo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={customMinutosPomo}
                  onChange={(e) => setCustomMinutosPomo(parseInt(e.target.value) || 25)}
                />
                <span className="text-muted-foreground text-sm">minutos</span>
              </div>
            </div>

            {/* Duração da Pausa Curta */}
            <div className="space-y-2">
              <Label>Duração da Pausa Curta</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={customMinutosPausa}
                  onChange={(e) => setCustomMinutosPausa(parseInt(e.target.value) || 5)}
                />
                <span className="text-muted-foreground text-sm">minutos</span>
              </div>
            </div>

            <Button onClick={handleCustomTimeSubmit} className="w-full">
              Aplicar Configurações
            </Button>

            {/* Fonte de Áudio */}
            <div className="space-y-2">
              <Label>Fonte de Áudio</Label>
              <Select
                value={fonteSelecionada}
                onValueChange={(value) => handleFonteChange(value as "manual" | "biblioteca")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">URL Manual</SelectItem>
                  <SelectItem value="biblioteca">Biblioteca de Músicas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL Manual do YouTube */}
            {fonteSelecionada === "manual" && (
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                />
              </div>
            )}

            {/* Biblioteca de Músicas */}
            {fonteSelecionada === "biblioteca" && (
              <div className="space-y-2">
                <Label>Selecionar da Biblioteca</Label>
                <Select
                  value={youtubeUrl}
                  onValueChange={(url) => {
                    const musica = musicas?.find(m => m.youtube_url === url);
                    if (musica) handleBibliotecaSelect(musica);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma música..." />
                  </SelectTrigger>
                  <SelectContent>
                    {musicas?.map((musica) => (
                      <SelectItem key={musica.id} value={musica.youtube_url}>
                        {musica.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isAdmin && (
                  <div className="mt-2">
                    <BibliotecaMusicasDialog />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
