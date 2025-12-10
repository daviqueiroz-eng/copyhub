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
  mostrarVideo: boolean;
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
  setMostrarVideo: (mostrar: boolean) => void;
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
  const [mostrarVideo, setMostrarVideo] = useState(() => {
    const saved = localStorage.getItem("pomodoro_mostrar_video");
    return saved === "true";
  });
  const playerRef = useRef<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inicioSessaoRef = useRef<Date | null>(null);
  const tempoInicialRef = useRef<number>(PRESETS.trabalho);
  const sessaoCompletadaRef = useRef<boolean>(false);
  const modoRef = useRef<PomodoroModo>("trabalho");
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const endTimeRef = useRef<number | null>(null); // Timestamp de quando o timer deve terminar

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem("pomodoro_state");
    const savedEndTime = localStorage.getItem("pomodoro_end_time");
    
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const modoCarregado = state.modo || "trabalho";
        setModo(modoCarregado);
        setTempoCustomizado(state.tempoCustomizado);
        setPausaCurtaCustomizada(state.pausaCurtaCustomizada);
        setYoutubeUrl(state.youtubeUrl || "");
        setVideoId(state.videoId);
        setFonteSelecionada(state.fonteSelecionada || "manual");
        
        // Se tinha um endTime salvo, verificar se ainda é válido
        if (savedEndTime) {
          const endTime = parseInt(savedEndTime);
          const now = Date.now();
          
          if (endTime > now) {
            // Timer ainda não terminou - restaurar e continuar
            endTimeRef.current = endTime;
            const remaining = Math.ceil((endTime - now) / 1000);
            setSegundosRestantes(remaining);
            setIsRunning(true);
            inicioSessaoRef.current = new Date();
            localStorage.setItem("pomodoro_sessao_ativa", "true");
            console.log("⏰ Timer restaurado do localStorage - restam", remaining, "segundos");
          } else {
            // Timer deveria ter terminado - limpar e resetar
            localStorage.removeItem("pomodoro_end_time");
            const tempoReset = state.tempoCustomizado || PRESETS[modoCarregado];
            setSegundosRestantes(tempoReset);
            tempoInicialRef.current = tempoReset;
            setIsRunning(false);
          }
        } else {
          // Sem endTime salvo - restaurar estado normal
          const tempoSalvo = state.segundosRestantes;
          if (tempoSalvo <= 0) {
            const tempoReset = state.tempoCustomizado || PRESETS[modoCarregado];
            setSegundosRestantes(tempoReset);
            tempoInicialRef.current = tempoReset;
          } else {
            setSegundosRestantes(tempoSalvo);
            tempoInicialRef.current = state.tempoInicialRef || PRESETS[modoCarregado];
          }
          setIsRunning(false);
        }
      } catch (error) {
        console.error("Erro ao carregar estado do pomodoro:", error);
      }
    }
  }, []);

  // Sincronizar modoRef com modo
  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

  // Função para tocar som de sino
  const playBellSound = () => {
    try {
      if (bellAudioRef.current) {
        bellAudioRef.current.currentTime = 0;
        bellAudioRef.current.play().catch(() => {
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
      const frequencies = [830, 1000, 1200];
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        
        const now = audioContext.currentTime;
        const delay = index * 0.05;
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
    audio.load();
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

  // Salvar preferência de mostrar vídeo
  useEffect(() => {
    localStorage.setItem("pomodoro_mostrar_video", mostrarVideo.toString());
  }, [mostrarVideo]);

  // Listener de visibilidade - sincronizar imediatamente quando voltar para a aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        setSegundosRestantes(remaining);
        console.log("👁️ Aba visível - sincronizando timer:", remaining, "segundos");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  // Lógica do timer baseada em timestamp
  useEffect(() => {
    if (!isRunning || !endTimeRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Função que calcula tempo restante baseado no timestamp
    const updateTimer = () => {
      if (!endTimeRef.current) return;
      
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setSegundosRestantes(remaining);
    };

    // Atualizar imediatamente
    updateTimer();

    // Interval de 250ms para UI responsiva (mas cálculo baseado em timestamp)
    intervalRef.current = setInterval(updateTimer, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Detectar quando o timer chega a 0 e executar as ações
  useEffect(() => {
    // Só executar quando timer chegar a 0
    if (segundosRestantes !== 0) return;

    // Para modo trabalho: usar isRunning como fonte de verdade principal
    if (modo === "trabalho" && isRunning) {
      console.log("🔔 Finalizando sessão de trabalho!");

      // Limpar endTime e flags
      endTimeRef.current = null;
      localStorage.removeItem("pomodoro_end_time");
      localStorage.removeItem("pomodoro_sessao_ativa");

      setIsRunning(false);
      playBellSound();
      sessaoCompletadaRef.current = true;
      salvarSessao();

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pomodoro concluído!", {
          body: "Sessão de trabalho finalizada!",
          icon: "/favicon.ico"
        });
      }

      setShowRestDialog(true);
    }
    // Para modo pausa: resetar para trabalho
    else if ((modo === "pausaCurta" || modo === "pausaLonga") && isRunning) {
      console.log("⏰ Finalizando pausa - retornando para modo trabalho");

      // Limpar endTime e flags
      endTimeRef.current = null;
      localStorage.removeItem("pomodoro_end_time");
      localStorage.removeItem("pomodoro_sessao_ativa");

      setIsRunning(false);
      playBellSound();

      // Resetar para modo trabalho automaticamente
      const tempoTrabalho = tempoCustomizado || PRESETS.trabalho;
      setModo("trabalho");
      setSegundosRestantes(tempoTrabalho);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pausa finalizada!", {
          body: "Hora de voltar ao trabalho!",
          icon: "/favicon.ico"
        });
      }
    }
  }, [segundosRestantes, isRunning, modo, tempoCustomizado, PRESETS]);

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
      // Determinar tempo atual
      let tempoAtual = segundosRestantes;
      if (tempoAtual === 0) {
        tempoAtual = tempoCustomizado || PRESETS[modo];
        setSegundosRestantes(tempoAtual);
        tempoInicialRef.current = tempoAtual;
      }
      
      // Calcular timestamp de término
      endTimeRef.current = Date.now() + (tempoAtual * 1000);
      localStorage.setItem("pomodoro_end_time", endTimeRef.current.toString());
      localStorage.setItem("pomodoro_sessao_ativa", "true");
      
      // Iniciar timer
      inicioSessaoRef.current = new Date();
      sessaoCompletadaRef.current = false;
      
      console.log("▶️ Timer iniciado - término previsto:", new Date(endTimeRef.current).toLocaleTimeString());
    } else {
      // Ao pausar, calcular segundos restantes e limpar endTime
      if (endTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSegundosRestantes(remaining);
      }
      endTimeRef.current = null;
      localStorage.removeItem("pomodoro_end_time");
      localStorage.removeItem("pomodoro_sessao_ativa");
      
      console.log("⏸️ Timer pausado");
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    localStorage.removeItem("pomodoro_end_time");
    
    const novoTempo = tempoCustomizado || PRESETS[modo];
    setSegundosRestantes(novoTempo);
    tempoInicialRef.current = novoTempo;
    inicioSessaoRef.current = null;
    sessaoCompletadaRef.current = false;
    
    localStorage.removeItem("pomodoro_sessao_ativa");
    
    console.log("🔄 Timer resetado");
  };

  const salvarSessao = async () => {
    if (!inicioSessaoRef.current) return;
    if (!sessaoCompletadaRef.current) return;

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
    sessaoCompletadaRef.current = false;
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
    mostrarVideo, setMostrarVideo,
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
      
      {/* Player YouTube Global - invisível quando mostrarVideo=false, renderizado no PomodoroTimer quando true */}
      {videoId && !mostrarVideo && (
        <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none">
          <YouTube
            videoId={videoId}
            opts={{
              width: '1',
              height: '1',
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
      
      {/* Dialog de Descanso Global */}
      <PomodoroRestDialog
        open={showRestDialog}
        onClose={() => setShowRestDialog(false)}
        pausaCurtaCustomizada={pausaCurtaCustomizada}
        onStartRest={(minutos) => {
          // Iniciar pausa
          setModo("pausaCurta");
          const tempoDescanso = minutos * 60;
          setSegundosRestantes(tempoDescanso);
          tempoInicialRef.current = tempoDescanso;
          
          // Calcular endTime para pausa
          endTimeRef.current = Date.now() + (tempoDescanso * 1000);
          localStorage.setItem("pomodoro_end_time", endTimeRef.current.toString());
          localStorage.setItem("pomodoro_sessao_ativa", "true");
          
          setIsRunning(true);
          setShowRestDialog(false);
          inicioSessaoRef.current = new Date();
          sessaoCompletadaRef.current = false;
          
          console.log("☕ Descanso iniciado - término previsto:", new Date(endTimeRef.current).toLocaleTimeString());
        }}
        onSkip={() => {
          // Pular descanso
          const tempoTrabalho = tempoCustomizado || PRESETS.trabalho;
          setModo("trabalho");
          setSegundosRestantes(tempoTrabalho);
          tempoInicialRef.current = tempoTrabalho;
          setShowRestDialog(false);
          sessaoCompletadaRef.current = false;
          setIsRunning(false);
          
          console.log("⏭️ Descanso pulado - timer preparado");
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
