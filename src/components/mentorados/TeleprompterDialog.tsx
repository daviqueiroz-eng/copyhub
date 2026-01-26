import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Pause, 
  Circle, 
  Square, 
  Download, 
  RotateCcw, 
  FlipHorizontal2,
  FileEdit,
  Video,
  Loader2,
  AlertCircle,
  SwitchCamera,
  ExternalLink,
} from "lucide-react";
import { useTeleprompter } from "@/hooks/useTeleprompter";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface TeleprompterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange?: (text: string) => void;
}

export function TeleprompterDialog({
  open,
  onOpenChange,
  text,
  onTextChange,
}: TeleprompterDialogProps) {
  const isMobile = useIsMobile();
  const [isEditingText, setIsEditingText] = useState(false);
  const [localText, setLocalText] = useState(text);
  
  const {
    isScrolling,
    scrollSpeed,
    fontSize,
    isMirrored,
    textWidth,
    textContainerRef,
    setScrollSpeed,
    setFontSize,
    setTextWidth,
    toggleScroll,
    resetScroll,
    toggleMirror,
    pauseScroll,
  } = useTeleprompter();
  
  const {
    state: recorderState,
    isLoadingCamera,
    cameraError,
    videoRef,
    isRecording,
    hasRecording,
    facingMode,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    downloadVideo,
    clearRecording,
    switchCamera,
  } = useVideoRecorder({
    onError: (error) => {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
    },
  });
  
  // Função para abrir modo flutuante
  const openFloatingMode = () => {
    const content = localText.replace(/\n/g, "<br>");
    const popup = window.open("", "teleprompter", "width=400,height=600,resizable=yes");
    if (popup) {
      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Teleprompter</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              html, body { height: 100%; }
              body { 
                background: rgba(0,0,0,0.9); 
                color: white; 
                font-size: ${fontSize}px;
                padding: 24px;
                min-height: 100vh;
                line-height: 1.6;
                font-family: system-ui, -apple-system, sans-serif;
                overflow-y: auto;
              }
              .controls {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 16px;
                background: rgba(0,0,0,0.95);
                display: flex;
                gap: 8px;
                justify-content: center;
              }
              .btn {
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                font-size: 16px;
                cursor: pointer;
                font-weight: 500;
              }
              .btn-primary { background: #8b5cf6; color: white; }
              .btn-secondary { background: #374151; color: white; }
              .content { padding-bottom: 80px; }
            </style>
          </head>
          <body>
            <div class="content">${content}</div>
            <div class="controls">
              <button class="btn btn-secondary" onclick="window.close()">Fechar</button>
            </div>
          </body>
        </html>
      `);
      popup.document.close();
      // Fechar dialog principal para usar câmera nativa
      handleClose();
    } else {
      toast({
        title: "Não foi possível abrir",
        description: "Permita pop-ups para usar o modo flutuante.",
        variant: "destructive",
      });
    }
  };
  
  // Sincronizar texto local quando prop mudar
  useEffect(() => {
    setLocalText(text);
  }, [text]);
  
  // Iniciar câmera quando abrir o dialog
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      resetScroll();
      setIsEditingText(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  
  // Handler para fechar dialog
  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    pauseScroll();
    onOpenChange(false);
  };
  
  // Handler para salvar texto editado
  const handleSaveText = () => {
    onTextChange?.(localText);
    setIsEditingText(false);
  };
  
  // Handler para download
  const handleDownload = () => {
    downloadVideo();
    toast({
      title: "Vídeo salvo!",
      description: "O vídeo foi baixado para seu dispositivo.",
    });
  };
  
  // Detectar iOS para mostrar instrução especial
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "max-w-4xl p-0 gap-0 overflow-hidden",
        isMobile && "h-[95vh] max-h-[95vh]"
      )}>
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Teleprompter
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn(
          "flex flex-col",
          isMobile ? "h-[calc(95vh-60px)]" : "h-[70vh]"
        )}>
          {/* Preview de câmera com texto overlay */}
          <div className="relative flex-1 bg-black overflow-hidden">
            {isLoadingCamera && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-sm">Carregando câmera...</span>
              </div>
            )}
            
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 z-10 gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <span className="text-sm text-center px-4">{cameraError}</span>
                <Button variant="outline" size="sm" onClick={() => startCamera()}>
                  Tentar novamente
                </Button>
              </div>
            )}
            
            {/* Vídeo da câmera */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover",
                isMirrored && "scale-x-[-1]"
              )}
            />
            
            {/* Indicador de gravação */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-medium z-20">
                <Circle className="h-3 w-3 fill-current animate-pulse" />
                Gravando
              </div>
            )}
            
            {/* Texto do teleprompter (overlay) */}
            {!isEditingText && (
              <div 
                ref={textContainerRef}
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2",
                  "bg-black/60 backdrop-blur-sm text-white p-4",
                  "overflow-y-auto touch-pan-y",
                  isMobile ? "h-[35%]" : "h-[40%]"
                )}
                style={{ 
                  fontSize: `${fontSize}px`,
                  width: `${textWidth}%`
                }}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-center">
                  {localText || "Nenhum texto para exibir"}
                </div>
              </div>
            )}
          </div>
          
          {/* Área de edição de texto */}
          {isEditingText && (
            <div className="p-4 border-t bg-background">
              <Textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                placeholder="Cole ou digite seu texto aqui..."
                className="min-h-[150px] resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setIsEditingText(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveText}>
                  Salvar texto
                </Button>
              </div>
            </div>
          )}
          
          {/* Controles */}
          {!isEditingText && (
            <div className="p-4 border-t bg-background space-y-4">
              {/* Sliders de velocidade e tamanho */}
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-2"
              )}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Velocidade</Label>
                    <span className="text-sm text-muted-foreground">{scrollSpeed.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[scrollSpeed]}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onValueChange={([v]) => setScrollSpeed(v)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Tamanho da fonte</Label>
                    <span className="text-sm text-muted-foreground">{fontSize}px</span>
                  </div>
                  <Slider
                    value={[fontSize]}
                    min={16}
                    max={48}
                    step={2}
                    onValueChange={([v]) => setFontSize(v)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Largura do texto</Label>
                    <span className="text-sm text-muted-foreground">{textWidth}%</span>
                  </div>
                  <Slider
                    value={[textWidth]}
                    min={40}
                    max={100}
                    step={5}
                    onValueChange={([v]) => setTextWidth(v)}
                  />
                </div>
              </div>
              
              {/* Botões de ação secundários */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMirror}
                  className="gap-1.5"
                >
                  <FlipHorizontal2 className="h-4 w-4" />
                  {isMobile ? "" : "Espelhar"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingText(true)}
                  className="gap-1.5"
                >
                  <FileEdit className="h-4 w-4" />
                  {isMobile ? "" : "Editar texto"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetScroll}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isMobile ? "" : "Reiniciar"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  className="gap-1.5"
                  disabled={isLoadingCamera}
                >
                  <SwitchCamera className="h-4 w-4" />
                  {isMobile ? "" : (facingMode === "user" ? "Câmera traseira" : "Câmera frontal")}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFloatingMode}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  {isMobile ? "" : "Modo flutuante"}
                </Button>
              </div>
              
              {/* Botões de ação principais */}
              <div className="flex justify-center gap-3">
                <Button
                  size="lg"
                  variant={isScrolling ? "secondary" : "default"}
                  onClick={toggleScroll}
                  className="gap-2"
                  disabled={isLoadingCamera || !!cameraError}
                >
                  {isScrolling ? (
                    <>
                      <Pause className="h-5 w-5" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Iniciar
                    </>
                  )}
                </Button>
                
                {!hasRecording ? (
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="gap-2"
                    disabled={isLoadingCamera || !!cameraError}
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-5 w-5" />
                        Parar
                      </>
                    ) : (
                      <>
                        <Circle className="h-5 w-5 fill-destructive text-destructive" />
                        Gravar
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      variant="default"
                      onClick={handleDownload}
                      className="gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Salvar
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={clearRecording}
                      className="gap-2"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Regravar
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Instrução para iOS */}
              {isIOS && hasRecording && (
                <p className="text-xs text-muted-foreground text-center">
                  No iOS, o vídeo pode abrir em uma nova aba. Toque e segure para salvar.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
