import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { CircularTimer } from "./CircularTimer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFlowBiblioteca } from "@/hooks/useFlowBiblioteca";
import { BibliotecaMusicasDialog } from "./BibliotecaMusicasDialog";
import { useUserRole } from "@/hooks/useAuth";

const PRESETS = {
  trabalho: 25 * 60,
  pausaCurta: 5 * 60,
  pausaLonga: 15 * 60,
};

export const PomodoroTimer = () => {
  const [modo, setModo] = useState<"trabalho" | "pausaCurta" | "pausaLonga">("trabalho");
  const [segundosRestantes, setSegundosRestantes] = useState(PRESETS.trabalho);
  const [isRunning, setIsRunning] = useState(false);
  const [tempoCustomizado, setTempoCustomizado] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fonteSelecionada, setFonteSelecionada] = useState<"manual" | "biblioteca">("manual");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const { musicas } = useFlowBiblioteca();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === "admin";

  const totalSegundos = tempoCustomizado || PRESETS[modo];

  useEffect(() => {
    if (isRunning && segundosRestantes > 0) {
      intervalRef.current = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Pomodoro concluído!", {
                body: `Sessão de ${modo === "trabalho" ? "trabalho" : modo === "pausaCurta" ? "pausa curta" : "pausa longa"} finalizada!`,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, segundosRestantes, modo]);

  useEffect(() => {
    const savedUrl = localStorage.getItem("pomodoro_youtube_url");
    const savedFonte = localStorage.getItem("pomodoro_fonte") as "manual" | "biblioteca";
    
    if (savedUrl) {
      setYoutubeUrl(savedUrl);
      const id = extractYouTubeId(savedUrl);
      if (id) setVideoId(id);
    }
    if (savedFonte) {
      setFonteSelecionada(savedFonte);
    }
  }, []);

  // Controlar play/pause do YouTube player
  useEffect(() => {
    if (!playerRef.current) return;
    
    try {
      if (isRunning) {
        playerRef.current?.playVideo?.();
      } else {
        playerRef.current?.pauseVideo?.();
      }
    } catch (error) {
      console.log("Player não está pronto ainda");
    }
  }, [isRunning]);

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      localStorage.setItem("pomodoro_youtube_url", url);
    }
  };

  const handleFonteChange = (fonte: "manual" | "biblioteca") => {
    setFonteSelecionada(fonte);
    localStorage.setItem("pomodoro_fonte", fonte);
    // Limpar vídeo atual ao trocar de fonte
    setVideoId(null);
    setYoutubeUrl("");
  };

  const handleMusicaBibliotecaChange = (musicaId: string) => {
    const musica = musicas.find((m) => m.id === musicaId);
    if (musica) {
      handleYoutubeUrlChange(musica.youtube_url);
    }
  };

  // Função chamada quando o player do YouTube estiver pronto
  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
  };

  const handleModoChange = (novoModo: typeof modo) => {
    setModo(novoModo);
    setSegundosRestantes(PRESETS[novoModo]);
    setTempoCustomizado(null);
    setIsRunning(false);
  };

  const handleReset = () => {
    setSegundosRestantes(tempoCustomizado || PRESETS[modo]);
    setIsRunning(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleCustomTime = (mins: number) => {
    if (mins > 0) {
      const seconds = mins * 60;
      setTempoCustomizado(seconds);
      setSegundosRestantes(seconds);
      setIsRunning(false);
    }
  };

  if (isFullscreen) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex items-center justify-center p-8">
        {/* Timer e controles no canto */}
        <div className="absolute top-8 right-8 text-center space-y-4">
          <div className="text-white text-5xl font-mono font-bold">
            {Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, "0")}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="secondary" onClick={toggleFullscreen}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Vídeo em tela cheia */}
        {videoId ? (
          <iframe
            id="youtube-player-fullscreen"
            width="90%"
            height="90%"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
            onLoad={() => {
              const iframe = document.getElementById("youtube-player-fullscreen") as HTMLIFrameElement;
              if (iframe && iframe.contentWindow) {
                playerRef.current = {
                  playVideo: () => {
                    iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                  },
                  pauseVideo: () => {
                    iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                  },
                };
                // Iniciar tocando se o timer estiver rodando
                if (isRunning) {
                  setTimeout(() => {
                    iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                  }, 500);
                }
              }
            }}
          />
        ) : (
          <div className="text-white text-xl">Adicione um link do YouTube para visualizar aqui</div>
        )}
      </div>
    );
  }

  return (
    <Card ref={containerRef} className="p-8">
      <div className="space-y-8">
        {/* Botões de Modo */}
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            variant={modo === "trabalho" ? "default" : "outline"}
            onClick={() => handleModoChange("trabalho")}
          >
            Trabalho (25min)
          </Button>
          <Button
            size="sm"
            variant={modo === "pausaCurta" ? "default" : "outline"}
            onClick={() => handleModoChange("pausaCurta")}
          >
            Pausa Curta (5min)
          </Button>
          <Button
            size="sm"
            variant={modo === "pausaLonga" ? "default" : "outline"}
            onClick={() => handleModoChange("pausaLonga")}
          >
            Pausa Longa (15min)
          </Button>
        </div>

        {/* Seletor de Fonte + Campo de YouTube/Biblioteca */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="fonte">Fonte de Áudio/Vídeo</Label>
              <Select value={fonteSelecionada} onValueChange={handleFonteChange}>
                <SelectTrigger id="fonte">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Link Manual</SelectItem>
                  <SelectItem value="biblioteca">Biblioteca de Músicas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && <BibliotecaMusicasDialog />}
          </div>

          {fonteSelecionada === "manual" ? (
            <div>
              <Label htmlFor="youtube-url">Link do YouTube</Label>
              <Input
                id="youtube-url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              />
              {youtubeUrl && !videoId && (
                <p className="text-sm text-destructive">URL inválida. Use um link do YouTube válido.</p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="musica-biblioteca">Escolher da Biblioteca</Label>
              <Select onValueChange={handleMusicaBibliotecaChange}>
                <SelectTrigger id="musica-biblioteca">
                  <SelectValue placeholder="Selecione uma música..." />
                </SelectTrigger>
                <SelectContent>
                  {musicas.map((musica) => (
                    <SelectItem key={musica.id} value={musica.id}>
                      {musica.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Layout: Timer + Vídeo */}
        <div className={`grid ${isRunning && videoId ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-8 items-center`}>
          
          {/* Relógio Circular */}
          <div className="flex flex-col items-center space-y-6">
            <CircularTimer 
              segundosRestantes={segundosRestantes}
              totalSegundos={totalSegundos}
            />
            
            {/* Controles */}
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => setIsRunning(!isRunning)}
                className="w-32"
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" /> Iniciar
                  </>
                )}
              </Button>
              <Button size="lg" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
              </Button>
              {videoId && (
                <Button size="lg" variant="outline" onClick={toggleFullscreen}>
                  <Maximize2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Player do YouTube (aparece sempre que houver vídeo selecionado) */}
          {videoId && (
            <div className="w-full">
              <iframe
                id="youtube-player"
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-lg"
                onLoad={() => {
                  // Configurar YouTube IFrame API
                  const iframe = document.getElementById("youtube-player") as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    playerRef.current = {
                      playVideo: () => {
                        iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                      },
                      pauseVideo: () => {
                        iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                      },
                    };
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Input de tempo customizado */}
        <div className="max-w-xs mx-auto space-y-2">
          <Label htmlFor="custom-time">Tempo personalizado (minutos)</Label>
          <Input
            id="custom-time"
            type="number"
            min="1"
            max="180"
            placeholder="Ex: 45"
            onChange={(e) => {
              const mins = parseInt(e.target.value);
              if (mins > 0) handleCustomTime(mins);
            }}
          />
        </div>
      </div>
    </Card>
  );
};
