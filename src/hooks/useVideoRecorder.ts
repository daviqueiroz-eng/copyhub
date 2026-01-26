import { useState, useCallback, useRef, useEffect } from "react";

type RecordingState = "idle" | "recording" | "stopped";
type FacingMode = "user" | "environment";
type VideoQuality = "720p" | "1080p" | "4k";

interface UseVideoRecorderOptions {
  onError?: (error: string) => void;
}

const QUALITY_SETTINGS = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

export function useVideoRecorder(options: UseVideoRecorderOptions = {}) {
  const [state, setState] = useState<RecordingState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("1080p");
  const [frameRate, setFrameRate] = useState<number>(30);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onErrorRef = useRef(options.onError);
  const facingModeRef = useRef<FacingMode>("user");
  
  // Manter ref atualizado
  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);
  
  // Sincronizar stream com elemento video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  // Iniciar câmera - função estável sem dependências
  const startCamera = useCallback(async (mode?: FacingMode) => {
    // Evitar múltiplas chamadas simultâneas
    if (streamRef.current) return;
    
    const currentMode = mode || facingModeRef.current;
    setIsLoadingCamera(true);
    setCameraError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setFacingMode(currentMode);
      facingModeRef.current = currentMode;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsLoadingCamera(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao acessar câmera";
      setCameraError(errorMessage);
      onErrorRef.current?.(errorMessage);
      setIsLoadingCamera(false);
    }
  }, []);
  
  // Trocar câmera frontal/traseira
  const switchCamera = useCallback(async () => {
    // Parar tracks atuais
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    const newMode: FacingMode = facingModeRef.current === "user" ? "environment" : "user";
    
    setIsLoadingCamera(true);
    setCameraError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setFacingMode(newMode);
      facingModeRef.current = newMode;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsLoadingCamera(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao trocar câmera";
      setCameraError(errorMessage);
      onErrorRef.current?.(errorMessage);
      setIsLoadingCamera(false);
    }
  }, []);
  
  // Aplicar configurações de qualidade e frame rate
  const applyVideoSettings = useCallback(async (quality: VideoQuality, fps: number) => {
    if (!streamRef.current) return false;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return false;
    
    const { width, height } = QUALITY_SETTINGS[quality];
    
    try {
      await videoTrack.applyConstraints({
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: fps },
      });
      
      setVideoQuality(quality);
      setFrameRate(fps);
      return true;
    } catch (error) {
      console.error("Erro ao aplicar configurações:", error);
      onErrorRef.current?.("Configuração não suportada pelo dispositivo");
      return false;
    }
  }, []);
  
  // Obter capacidades da câmera
  const getCameraCapabilities = useCallback(() => {
    if (!streamRef.current) return null;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
      return videoTrack.getCapabilities();
    }
    return null;
  }, []);
  
  // Parar câmera - função estável sem dependências
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
    setRecordedBlob(null);
    chunksRef.current = [];
  }, []);
  
  // Iniciar gravação
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    setRecordedBlob(null);
    
    // Tentar MP4 primeiro (Safari suporta nativamente), depois WebM
    const formats = [
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    
    const mimeType = formats.find(f => MediaRecorder.isTypeSupported(f)) || "video/webm";
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Coletar dados a cada segundo
      setState("recording");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao iniciar gravação";
      onErrorRef.current?.(errorMessage);
    }
  }, []);
  
  // Parar gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      setState("stopped");
    }
  }, [state]);
  
  // Download do vídeo
  const downloadVideo = useCallback((filename?: string) => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `roteiro-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedBlob]);
  
  // Limpar gravação para regravar
  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    chunksRef.current = [];
    setState("idle");
  }, []);
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return {
    // State
    state,
    stream,
    recordedBlob,
    isLoadingCamera,
    cameraError,
    videoRef,
    isRecording: state === "recording",
    hasRecording: !!recordedBlob,
    facingMode,
    videoQuality,
    frameRate,
    
    // Actions
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    downloadVideo,
    clearRecording,
    switchCamera,
    applyVideoSettings,
    getCameraCapabilities,
  };
}
