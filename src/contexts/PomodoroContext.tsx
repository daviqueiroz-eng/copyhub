import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type PomodoroModo = "trabalho" | "pausaCurta" | "pausaLonga";

type PomodoroState = {
  modo: PomodoroModo;
  segundosRestantes: number;
  isRunning: boolean;
  tempoCustomizado: number | null;
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
  setVideoId: (id: string | null) => void;
  setYoutubeUrl: (url: string) => void;
  setFonteSelecionada: (fonte: "manual" | "biblioteca") => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  salvarSessao: () => Promise<void>;
  PRESETS: Record<PomodoroModo, number>;
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const PRESETS = { trabalho: 25 * 60, pausaCurta: 5 * 60, pausaLonga: 15 * 60 };
  
  const [modo, setModo] = useState<PomodoroModo>("trabalho");
  const [segundosRestantes, setSegundosRestantes] = useState(PRESETS.trabalho);
  const [isRunning, setIsRunning] = useState(false);
  const [tempoCustomizado, setTempoCustomizado] = useState<number | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [fonteSelecionada, setFonteSelecionada] = useState<"manual" | "biblioteca">("manual");
  const playerRef = useRef<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inicioSessaoRef = useRef<Date | null>(null);
  const tempoInicialRef = useRef<number>(PRESETS.trabalho);

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
        setYoutubeUrl(state.youtubeUrl || "");
        setVideoId(state.videoId);
        setFonteSelecionada(state.fonteSelecionada || "manual");
        tempoInicialRef.current = state.tempoInicialRef || PRESETS.trabalho;
      } catch (error) {
        console.error("Erro ao carregar estado do pomodoro:", error);
      }
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    const state = {
      modo,
      segundosRestantes,
      isRunning,
      tempoCustomizado,
      youtubeUrl,
      videoId,
      fonteSelecionada,
      tempoInicialRef: tempoInicialRef.current,
    };
    localStorage.setItem("pomodoro_state", JSON.stringify(state));
  }, [modo, segundosRestantes, isRunning, tempoCustomizado, youtubeUrl, videoId, fonteSelecionada]);

  // Lógica do timer (continua rodando mesmo fora da página)
  useEffect(() => {
    if (isRunning && segundosRestantes > 0) {
      if (!inicioSessaoRef.current) {
        inicioSessaoRef.current = new Date();
      }

      intervalRef.current = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            salvarSessao();
            setIsRunning(false);
            
            // Notificação
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Pomodoro concluído!", {
                body: `Sessão de ${modo === "trabalho" ? "trabalho" : "pausa"} finalizada!`,
                icon: "/favicon.ico"
              });
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, segundosRestantes, modo]);

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
      inicioSessaoRef.current = new Date();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const novoTempo = tempoCustomizado || PRESETS[modo];
    setSegundosRestantes(novoTempo);
    tempoInicialRef.current = novoTempo;
    inicioSessaoRef.current = null;
  };

  const salvarSessao = async () => {
    if (!inicioSessaoRef.current) return;

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
  };

  const value = {
    modo, setModo,
    segundosRestantes, setSegundosRestantes,
    isRunning, setIsRunning,
    tempoCustomizado, setTempoCustomizado,
    videoId, setVideoId,
    youtubeUrl, setYoutubeUrl,
    fonteSelecionada, setFonteSelecionada,
    playerRef,
    toggleTimer,
    resetTimer,
    salvarSessao,
    PRESETS,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error("usePomodoro must be used within PomodoroProvider");
  return context;
};
