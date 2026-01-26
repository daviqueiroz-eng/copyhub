import { useState, useCallback, useRef, useEffect } from "react";

type RecordingState = "idle" | "recording" | "stopped";

interface UseVideoRecorderOptions {
  onError?: (error: string) => void;
}

export function useVideoRecorder(options: UseVideoRecorderOptions = {}) {
  const { onError } = options;
  
  const [state, setState] = useState<RecordingState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Iniciar câmera
  const startCamera = useCallback(async () => {
    setIsLoadingCamera(true);
    setCameraError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsLoadingCamera(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao acessar câmera";
      setCameraError(errorMessage);
      onError?.(errorMessage);
      setIsLoadingCamera(false);
    }
  }, [onError]);
  
  // Parar câmera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
    setRecordedBlob(null);
    chunksRef.current = [];
  }, [stream]);
  
  // Iniciar gravação
  const startRecording = useCallback(() => {
    if (!stream) return;
    
    chunksRef.current = [];
    setRecordedBlob(null);
    
    // Detectar melhor formato suportado
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/mp4";
        }
      }
    }
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
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
      onError?.(errorMessage);
    }
  }, [stream, onError]);
  
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
    a.download = filename || `roteiro-${Date.now()}.webm`;
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
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
    
    // Actions
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    downloadVideo,
    clearRecording,
  };
}
