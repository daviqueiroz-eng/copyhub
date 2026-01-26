import { useState, useCallback, useRef, useEffect } from "react";

interface UseTeleprompterOptions {
  initialSpeed?: number;
  initialFontSize?: number;
}

export function useTeleprompter(options: UseTeleprompterOptions = {}) {
  const { initialSpeed = 1, initialFontSize = 24 } = options;
  
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(initialSpeed);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [isMirrored, setIsMirrored] = useState(true);
  const [textWidth, setTextWidth] = useState(100); // 100% por padrão
  
  const textContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Pixels por segundo baseado na velocidade (1x = 30px/s, 3x = 90px/s)
  const pixelsPerSecond = scrollSpeed * 30;
  
  const scrollText = useCallback((currentTime: number) => {
    if (!textContainerRef.current) return;
    
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }
    
    const deltaTime = (currentTime - lastTimeRef.current) / 1000; // segundos
    lastTimeRef.current = currentTime;
    
    const scrollAmount = pixelsPerSecond * deltaTime;
    textContainerRef.current.scrollTop += scrollAmount;
    
    // Verificar se chegou ao final
    const { scrollTop, scrollHeight, clientHeight } = textContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsScrolling(false);
      return;
    }
    
    animationFrameRef.current = requestAnimationFrame(scrollText);
  }, [pixelsPerSecond]);
  
  const startScroll = useCallback(() => {
    if (textContainerRef.current) {
      lastTimeRef.current = 0;
      setIsScrolling(true);
    }
  }, []);
  
  const pauseScroll = useCallback(() => {
    setIsScrolling(false);
  }, []);
  
  const resetScroll = useCallback(() => {
    setIsScrolling(false);
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
  }, []);
  
  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => !prev);
  }, []);
  
  // Efeito para controlar a animação
  useEffect(() => {
    if (isScrolling) {
      animationFrameRef.current = requestAnimationFrame(scrollText);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScrolling, scrollText]);
  
  return {
    // State
    isScrolling,
    scrollSpeed,
    fontSize,
    isMirrored,
    textWidth,
    textContainerRef,
    
    // Actions
    setScrollSpeed,
    setFontSize,
    setTextWidth,
    startScroll,
    pauseScroll,
    resetScroll,
    toggleMirror,
    toggleScroll: isScrolling ? pauseScroll : startScroll,
  };
}
