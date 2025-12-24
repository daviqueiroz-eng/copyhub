import { useState, useEffect, useCallback, useRef } from "react";

interface UseWebSpeechTTSOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  lang?: string; // default pt-BR
}

export const useWebSpeechTTS = (options: UseWebSpeechTTSOptions = {}) => {
  const { volume = 1, lang = "pt-BR" } = options;
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(options.rate ?? 1);
  const [pitch, setPitch] = useState(options.pitch ?? 1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Carregar vozes disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Tentar selecionar uma voz pt-BR
      const ptBRVoice = availableVoices.find(
        (voice) => voice.lang.includes("pt-BR") || voice.lang.includes("pt_BR")
      );
      
      // Se não encontrar pt-BR, tentar pt-PT ou qualquer português
      const ptVoice = ptBRVoice || availableVoices.find(
        (voice) => voice.lang.includes("pt")
      );
      
      if (ptVoice) {
        setSelectedVoice(ptVoice);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]);
      }
    };

    loadVoices();
    
    // Algumas vezes as vozes carregam de forma assíncrona
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;

    // Cancelar qualquer fala anterior
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, volume, selectedVoice]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  return {
    speak,
    stop,
    pause,
    resume,
    togglePause,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
  };
};
