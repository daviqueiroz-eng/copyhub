import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import YouTube from "react-youtube";
import { PomodoroRestDialog } from "@/components/flow/PomodoroRestDialog";

type PomodoroModo = "trabalho" | "pausaCurta" | "pausaLonga";

type PomodoroState = {
  modo: PomodoroModo;
  segundosRestantes: number;
  isRunning: boolean;
  tempoCustomizado: number | null;
  pausaCurtaCustomizada: number | null;
  videoId: string | null;
  youtubeUrl: string;
  fonteSelecionada: "manual" | "biblioteca";
  playerRef: React.MutableRefObject<any>;
};

type PomodoroContextType = PomodoroState & {
  setModo: (modo: PomodoroModo) => void;
  setSegundosRestantes: (segundos: number) => void;
  setIsRunning: (running: boolean) => void;
  setTempoCustomizado: (tempo: number | null) => void;
  setPausaCurtaCustomizada: (tempo: number | null) => void;
  setVideoId: (id: string | null) => void;
  setYoutubeUrl: (url: string) => void;
  setFonteSelecionada: (fonte: "manual" | "biblioteca") => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  salvarSessao: () => Promise<void>;
  showRestDialog: boolean;
  setShowRestDialog: (show: boolean) => void;
  PRESETS: Record<PomodoroModo, number>;
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const PRESETS = { trabalho: 25 * 60, pausaCurta: 5 * 60, pausaLonga: 15 * 60 };
  
  const [modo, setModo] = useState<PomodoroModo>("trabalho");
  const [segundosRestantes, setSegundosRestantes] = useState(PRESETS.trabalho);
  const [isRunning, setIsRunning] = useState(false);
  const [tempoCustomizado, setTempoCustomizado] = useState<number | null>(null);
  const [pausaCurtaCustomizada, setPausaCurtaCustomizada] = useState<number | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [fonteSelecionada, setFonteSelecionada] = useState<"manual" | "biblioteca">("manual");
  const [showRestDialog, setShowRestDialog] = useState(false);
  const playerRef = useRef<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inicioSessaoRef = useRef<Date | null>(null);
  const tempoInicialRef = useRef<number>(PRESETS.trabalho);
  const sessaoCompletadaRef = useRef<boolean>(false);
  const timerCompletadoRef = useRef<boolean>(false); // Flag para evitar execuções múltiplas
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem("pomodoro_state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setModo(state.modo || "trabalho");
        setSegundosRestantes(state.segundosRestantes || PRESETS.trabalho);
        setIsRunning(false); // Sempre começa pausado após reload
        setTempoCustomizado(state.tempoCustomizado);
        setPausaCurtaCustomizada(state.pausaCurtaCustomizada);
        setYoutubeUrl(state.youtubeUrl || "");
        setVideoId(state.videoId);
        setFonteSelecionada(state.fonteSelecionada || "manual");
        tempoInicialRef.current = state.tempoInicialRef || PRESETS.trabalho;
      } catch (error) {
        console.error("Erro ao carregar estado do pomodoro:", error);
      }
    }
  }, []);

  // Função para tocar som de sino (com fallback sintetizado)
  const playBellSound = () => {
    try {
      // Tentar tocar arquivo primeiro
      if (bellAudioRef.current) {
        bellAudioRef.current.currentTime = 0;
        bellAudioRef.current.play().catch(() => {
          // Fallback: gerar som via Web Audio API
          playSynthesizedBell();
        });
      } else {
        playSynthesizedBell();
      }
    } catch (error) {
      console.error("Erro ao tocar sino:", error);
      playSynthesizedBell();
    }
  };

  // Função para gerar som de sino sintetizado
  const playSynthesizedBell = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Criar três tons harmônicos para som de sino
      const frequencies = [830, 1000, 1200];
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        
        // Envelope de volume para som natural
        const now = audioContext.currentTime;
        const delay = index * 0.05; // Pequeno atraso entre tons
        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(0.3, now + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 1.5);
        
        oscillator.start(now + delay);
        oscillator.stop(now + delay + 1.5);
      });
    } catch (error) {
      console.error("Erro ao sintetizar sino:", error);
    }
  };

  // Carregar áudio do sino
  useEffect(() => {
    const audio = new Audio("/sounds/bell.mp3");
    audio.load(); // Pré-carregar
    bellAudioRef.current = audio;
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    const state = {
      modo,
      segundosRestantes,
      isRunning,
      tempoCustomizado,
      pausaCurtaCustomizada,
      youtubeUrl,
      videoId,
      fonteSelecionada,
      tempoInicialRef: tempoInicialRef.current,
    };
    localStorage.setItem("pomodoro_state", JSON.stringify(state));
  }, [modo, segundosRestantes, isRunning, tempoCustomizado, pausaCurtaCustomizada, youtubeUrl, videoId, fonteSelecionada]);

  // Lógica do timer (continua rodando mesmo fora da página)
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Timer está rodando
    intervalRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Detectar quando o timer chega a 0 e executar as ações
  useEffect(() => {
    // Executar apenas uma vez quando timer chegar a 0
    if (segundosRestantes === 0 && !timerCompletadoRef.current && inicioSessaoRef.current) {
      console.log("🔔 Timer chegou a 0! Executando ações...");
      
      // Marcar como completado para evitar execuções múltiplas
      timerCompletadoRef.current = true;
      
      // Parar timer
      setIsRunning(false);
      
      // Tocar sino
      playBellSound();
      
      // Marcar sessão como completada e salvar
      sessaoCompletadaRef.current = true;
      salvarSessao();
      
      // Notificação
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pomodoro concluído!", {
          body: `Sessão de ${modo === "trabalho" ? "trabalho" : "pausa"} finalizada!`,
          icon: "/favicon.ico"
        });
      }
      
      // Mostrar dialog de descanso apenas para sessões de trabalho
      if (modo === "trabalho") {
        console.log("💬 Mostrando dialog de descanso...");
        setShowRestDialog(true);
      }
    }
  }, [segundosRestantes, modo]);

  // Controlar YouTube player sincronizado com timer
  useEffect(() => {
    if (!playerRef.current) return;
    
    try {
      if (isRunning) {
        playerRef.current?.playVideo?.();
      } else {
        playerRef.current?.pauseVideo?.();
      }
    } catch (error) {
      console.log("Player não está pronto");
    }
  }, [isRunning]);

  const toggleTimer = () => {
    if (!isRunning) {
      // Iniciar timer
      inicioSessaoRef.current = new Date();
      sessaoCompletadaRef.current = false;
      timerCompletadoRef.current = false; // Reset flag de completado
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const novoTempo = tempoCustomizado || PRESETS[modo];
    setSegundosRestantes(novoTempo);
    tempoInicialRef.current = novoTempo;
    inicioSessaoRef.current = null;
    sessaoCompletadaRef.current = false;
    timerCompletadoRef.current = false; // Reset flag de completado
  };

  const salvarSessao = async () => {
    if (!inicioSessaoRef.current) return;
    if (!sessaoCompletadaRef.current) return; // Só salvar se completou naturalmente

    const duracaoMinutos = Math.round((Date.now() - inicioSessaoRef.current.getTime()) / 60000);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && duracaoMinutos > 0) {
        await supabase.from("flow_pomodoro_sessoes").insert({
          user_id: user.id,
          tipo: modo,
          duracao_minutos: duracaoMinutos,
          completada: true,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
    }
    
    inicioSessaoRef.current = null;
    sessaoCompletadaRef.current = false; // Reset flag
  };

  const value = {
    modo, setModo,
    segundosRestantes, setSegundosRestantes,
    isRunning, setIsRunning,
    tempoCustomizado, setTempoCustomizado,
    pausaCurtaCustomizada, setPausaCurtaCustomizada,
    videoId, setVideoId,
    youtubeUrl, setYoutubeUrl,
    fonteSelecionada, setFonteSelecionada,
    playerRef,
    toggleTimer,
    resetTimer,
    salvarSessao,
    showRestDialog,
    setShowRestDialog,
    PRESETS,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      
      {/* Player YouTube Global - continua tocando mesmo ao trocar de página */}
      {videoId && (
        <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none">
          <YouTube
            videoId={videoId}
            opts={{
              playerVars: {
                autoplay: 0,
                controls: 0,
              },
            }}
            onReady={(event) => {
              playerRef.current = event.target;
            }}
          />
        </div>
      )}
      
      {/* Dialog de Descanso Global - aparece em qualquer página */}
      <PomodoroRestDialog
        open={showRestDialog}
        onClose={() => setShowRestDialog(false)}
        pausaCurtaCustomizada={pausaCurtaCustomizada}
        onStartRest={(minutos) => {
          setTempoCustomizado(minutos * 60);
          setModo("pausaCurta");
          setSegundosRestantes(minutos * 60);
          setIsRunning(true);
          setShowRestDialog(false);
          inicioSessaoRef.current = new Date();
          timerCompletadoRef.current = false;
          sessaoCompletadaRef.current = false;
        }}
        onSkip={() => {
          // Pular descanso e voltar para trabalho
          const tempoTrabalho = tempoCustomizado || PRESETS.trabalho;
          setModo("trabalho");
          setSegundosRestantes(tempoTrabalho);
          setShowRestDialog(false);
          inicioSessaoRef.current = new Date();
          timerCompletadoRef.current = false;
          sessaoCompletadaRef.current = false;
        }}
      />
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error("usePomodoro must be used within PomodoroProvider");
  return context;
};
