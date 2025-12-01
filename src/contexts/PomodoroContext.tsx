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
  const modoRef = useRef<PomodoroModo>("trabalho"); // Ref para evitar closure desatualizada
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem("pomodoro_state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        const modoCarregado = state.modo || "trabalho";
        setModo(modoCarregado);
        
        // Se estava em 0, resetar para tempo padrão
        const tempoSalvo = state.segundosRestantes;
        if (tempoSalvo <= 0) {
          const tempoReset = state.tempoCustomizado || PRESETS[modoCarregado];
          setSegundosRestantes(tempoReset);
          tempoInicialRef.current = tempoReset;
        } else {
          setSegundosRestantes(tempoSalvo);
          tempoInicialRef.current = state.tempoInicialRef || PRESETS[modoCarregado];
        }
        
        setIsRunning(false); // Sempre começa pausado após reload
        setTempoCustomizado(state.tempoCustomizado);
        setPausaCurtaCustomizada(state.pausaCurtaCustomizada);
        setYoutubeUrl(state.youtubeUrl || "");
        setVideoId(state.videoId);
        setFonteSelecionada(state.fonteSelecionada || "manual");
        
        // Se tinha sessão ativa, restaurar o início da sessão
        const sessaoAtiva = localStorage.getItem("pomodoro_sessao_ativa") === "true";
        if (sessaoAtiva) {
          inicioSessaoRef.current = new Date();
        }
      } catch (error) {
        console.error("Erro ao carregar estado do pomodoro:", error);
      }
    }
  }, []);

  // Sincronizar modoRef com modo (evita closure desatualizada)
  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

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
        // Detectar quando timer está prestes a chegar a 0
        // Usar modoRef para evitar closure desatualizada
        const modoAtual = modoRef.current;
        const sessaoAtiva = localStorage.getItem("pomodoro_sessao_ativa") === "true";
        
        if (prev === 1 && modoAtual === "trabalho" && sessaoAtiva) {
          // Marcar flag no localStorage para mostrar dialog de forma confiável
          localStorage.setItem("pomodoro_mostrar_dialog", "true");
          console.log("🎯 Flag de dialog setada - timer vai chegar a 0");
        }
        
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, modo]);

  // Detectar quando o timer chega a 0 e executar as ações
  useEffect(() => {
    // Só executar quando timer chegar a 0 e estiver rodando
    if (segundosRestantes !== 0) return;
    if (!isRunning) return;
    
    const sessaoAtiva = localStorage.getItem("pomodoro_sessao_ativa") === "true";
    const deveExibirDialog = localStorage.getItem("pomodoro_mostrar_dialog") === "true";
    
    console.log("🎯 Timer chegou a 0:", { 
      modo, 
      sessaoAtiva, 
      deveExibirDialog,
      isRunning
    });
    
    // Se é modo trabalho E tem sessão ativa OU flag de dialog
    if (modo === "trabalho" && (deveExibirDialog || sessaoAtiva)) {
      console.log("🔔 Finalizando sessão de trabalho!");
      
      // Limpar flags ANTES de executar ações
      localStorage.removeItem("pomodoro_mostrar_dialog");
      localStorage.removeItem("pomodoro_sessao_ativa");
      
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
          body: "Sessão de trabalho finalizada!",
          icon: "/favicon.ico"
        });
      }
      
      // Mostrar dialog de descanso
      console.log("💬 Mostrando dialog de descanso...");
      setShowRestDialog(true);
    }
    // Se é modo pausa (curta ou longa) - apenas parar e resetar para trabalho
    else if ((modo === "pausaCurta" || modo === "pausaLonga") && sessaoAtiva) {
      console.log("☕ Finalizando pausa - voltando para modo trabalho");
      
      // Limpar flag de sessão ativa
      localStorage.removeItem("pomodoro_sessao_ativa");
      
      // Parar timer
      setIsRunning(false);
      
      // Tocar sino
      playBellSound();
      
      // Notificação
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pausa concluída!", {
          body: "Hora de voltar ao trabalho!",
          icon: "/favicon.ico"
        });
      }
      
      // Resetar automaticamente para modo trabalho (mas não iniciar)
      const tempoTrabalho = tempoCustomizado || PRESETS.trabalho;
      setModo("trabalho");
      setSegundosRestantes(tempoTrabalho);
      tempoInicialRef.current = tempoTrabalho;
      sessaoCompletadaRef.current = false;
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
      // Se timer está zerado, resetar antes de iniciar
      if (segundosRestantes === 0) {
        const novoTempo = tempoCustomizado || PRESETS[modo];
        setSegundosRestantes(novoTempo);
        tempoInicialRef.current = novoTempo;
      }
      
      // Marcar sessão como ativa
      localStorage.setItem("pomodoro_sessao_ativa", "true");
      
      // Iniciar timer
      inicioSessaoRef.current = new Date();
      sessaoCompletadaRef.current = false;
      
      console.log("▶️ Timer iniciado - sessão ativa");
    } else {
      // Ao pausar, limpar flag de sessão ativa
      localStorage.removeItem("pomodoro_sessao_ativa");
      
      console.log("⏸️ Timer pausado - sessão desativada");
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
    
    // Limpar flags
    localStorage.removeItem("pomodoro_sessao_ativa");
    localStorage.removeItem("pomodoro_mostrar_dialog");
    
    console.log("🔄 Timer resetado - sessão desativada");
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
          // Mudar para modo pausa curta
          setModo("pausaCurta");
          setSegundosRestantes(minutos * 60);
          tempoInicialRef.current = minutos * 60;
          setIsRunning(true);
          setShowRestDialog(false);
          inicioSessaoRef.current = new Date();
          sessaoCompletadaRef.current = false;
          
          // Marcar sessão como ativa
          localStorage.setItem("pomodoro_sessao_ativa", "true");
          
          console.log("☕ Descanso iniciado - sessão ativa");
        }}
        onSkip={() => {
          // Pular descanso e preparar para próximo trabalho
          const tempoTrabalho = tempoCustomizado || PRESETS.trabalho;
          setModo("trabalho");
          setSegundosRestantes(tempoTrabalho);
          tempoInicialRef.current = tempoTrabalho;
          setShowRestDialog(false);
          sessaoCompletadaRef.current = false;
          
          // NÃO iniciar automaticamente - usuário decide quando começar
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
