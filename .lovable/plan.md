
## Plano: Modo Flutuante Avançado + Configurações de Câmera

### O Que Você Pediu

1. **Modo flutuante igual à imagem**: Uma janela semi-transparente com o texto, controles de play/pause/velocidade, que flutua sobre outros apps
2. **Configurações de câmera**: Poder escolher qualidade (720p, 1080p), frame rate, e outras configurações

---

### Parte 1: Modo Flutuante Avançado

Vou reescrever completamente o modo flutuante para ficar igual à imagem de referência:

**Design da Janela Flutuante:**
```
┌─────────────────────────────────┐
│ [X]                         [≡] │  ← Botão fechar + menu
│                                 │
│   Welcome to the Floating       │
│   Teleprompter! This is         │
│   sample text...                │  ← Texto com scroll
│                                 │
│  ◀◀  ⏪  ▶️  ⏩  ▶▶             │  ← Controles
│       ⊙ velocidade              │
└─────────────────────────────────┘
```

**Características:**
- Fundo semi-transparente `rgba(0,0,0,0.75)`
- Cantos arredondados (border-radius)
- Botão X para fechar
- Controles de:
  - Play/Pause
  - Retroceder/Avançar texto
  - Ajuste de velocidade
  - Tamanho da fonte
- Auto-scroll com JavaScript incluso
- Scroll manual (arrastar)

**Código da Janela Flutuante:**

```tsx
const openFloatingMode = () => {
  const content = localText.replace(/\n/g, "<br>");
  
  // Abrir janela menor e redimensionável
  const popup = window.open(
    "", 
    "teleprompter", 
    "width=350,height=400,resizable=yes,scrollbars=no"
  );
  
  if (popup) {
    popup.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Teleprompter</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { 
      height: 100%; 
      overflow: hidden;
      background: transparent;
    }
    .container {
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      align-items: center;
    }
    .close-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover { background: rgba(255,255,255,0.3); }
    
    /* Text area */
    .text-area {
      flex: 1;
      overflow-y: auto;
      padding: 0 20px 20px;
      color: white;
      font-size: ${fontSize}px;
      line-height: 1.5;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Controls */
    .controls {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .control-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .ctrl-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ctrl-btn:hover { background: rgba(255,255,255,0.25); }
    .ctrl-btn.primary {
      width: 52px;
      height: 52px;
      background: rgba(255,255,255,0.25);
    }
    .ctrl-btn.active { background: #8b5cf6; }
    
    /* Speed indicator */
    .speed-indicator {
      text-align: center;
      color: rgba(255,255,255,0.7);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <button class="close-btn" onclick="window.close()">✕</button>
      <div style="color: rgba(255,255,255,0.5); font-size: 12px;">Teleprompter</div>
      <div style="width: 28px;"></div>
    </div>
    
    <div class="text-area" id="textArea">${content}</div>
    
    <div class="controls">
      <div class="control-row">
        <button class="ctrl-btn" onclick="skip(-100)" title="Voltar">⏪</button>
        <button class="ctrl-btn" onclick="slower()" title="Mais lento">◀◀</button>
        <button class="ctrl-btn primary" id="playBtn" onclick="togglePlay()" title="Play/Pause">▶</button>
        <button class="ctrl-btn" onclick="faster()" title="Mais rápido">▶▶</button>
        <button class="ctrl-btn" onclick="skip(100)" title="Avançar">⏩</button>
      </div>
      <div class="speed-indicator" id="speedIndicator">Velocidade: ${scrollSpeed.toFixed(1)}x</div>
    </div>
  </div>
  
  <script>
    const textArea = document.getElementById('textArea');
    const playBtn = document.getElementById('playBtn');
    const speedIndicator = document.getElementById('speedIndicator');
    
    let isPlaying = false;
    let speed = ${scrollSpeed};
    let animationId = null;
    let lastTime = 0;
    
    function togglePlay() {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '⏸' : '▶';
      playBtn.classList.toggle('active', isPlaying);
      
      if (isPlaying) {
        lastTime = 0;
        animationId = requestAnimationFrame(scroll);
      } else if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }
    
    function scroll(time) {
      if (!isPlaying) return;
      
      if (lastTime === 0) lastTime = time;
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      
      textArea.scrollTop += speed * 30 * delta;
      
      if (textArea.scrollTop + textArea.clientHeight >= textArea.scrollHeight - 5) {
        isPlaying = false;
        playBtn.textContent = '▶';
        playBtn.classList.remove('active');
        return;
      }
      
      animationId = requestAnimationFrame(scroll);
    }
    
    function skip(amount) {
      textArea.scrollTop += amount;
    }
    
    function slower() {
      speed = Math.max(0.5, speed - 0.5);
      updateSpeed();
    }
    
    function faster() {
      speed = Math.min(5, speed + 0.5);
      updateSpeed();
    }
    
    function updateSpeed() {
      speedIndicator.textContent = 'Velocidade: ' + speed.toFixed(1) + 'x';
    }
  </script>
</body>
</html>
    `);
    popup.document.close();
    handleClose(); // Fecha o dialog principal
  }
};
```

---

### Parte 2: Configurações de Câmera

Adicionar um painel de configurações de câmera com:
- **Qualidade do vídeo**: 720p, 1080p, 4K (se disponível)
- **Frame rate**: 24fps, 30fps, 60fps
- **Exibir configurações suportadas** pelo dispositivo

**Novo estado no `useVideoRecorder.ts`:**

```tsx
// Configurações de câmera
const [videoQuality, setVideoQuality] = useState<"720p" | "1080p" | "4k">("1080p");
const [frameRate, setFrameRate] = useState<number>(30);
const [availableCapabilities, setAvailableCapabilities] = useState<MediaTrackCapabilities | null>(null);
```

**Função para obter capacidades da câmera:**

```tsx
const getCameraCapabilities = useCallback(async () => {
  if (!streamRef.current) return null;
  
  const videoTrack = streamRef.current.getVideoTracks()[0];
  if (videoTrack) {
    return videoTrack.getCapabilities();
  }
  return null;
}, []);
```

**Função para aplicar configurações:**

```tsx
const applyVideoSettings = useCallback(async (quality: "720p" | "1080p" | "4k", fps: number) => {
  if (!streamRef.current) return;
  
  const videoTrack = streamRef.current.getVideoTracks()[0];
  if (!videoTrack) return;
  
  const resolutions = {
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
    "4k": { width: 3840, height: 2160 },
  };
  
  const { width, height } = resolutions[quality];
  
  try {
    await videoTrack.applyConstraints({
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: fps },
    });
    
    setVideoQuality(quality);
    setFrameRate(fps);
  } catch (error) {
    console.error("Erro ao aplicar configurações:", error);
  }
}, []);
```

**Novo componente de configurações no Dialog:**

```tsx
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Botão de configurações
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm" className="gap-1.5">
      <Settings className="h-4 w-4" />
      {isMobile ? "" : "Qualidade"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-64">
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Qualidade do vídeo</Label>
        <RadioGroup value={videoQuality} onValueChange={handleQualityChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="720p" id="720p" />
            <Label htmlFor="720p">720p (HD)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1080p" id="1080p" />
            <Label htmlFor="1080p">1080p (Full HD)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="4k" id="4k" />
            <Label htmlFor="4k">4K (Ultra HD)</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div>
        <Label className="text-sm font-medium">Frame rate</Label>
        <RadioGroup value={String(frameRate)} onValueChange={(v) => handleFrameRateChange(Number(v))}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="24" id="24fps" />
            <Label htmlFor="24fps">24 fps (Cinema)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="30" id="30fps" />
            <Label htmlFor="30fps">30 fps (Padrão)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="60" id="60fps" />
            <Label htmlFor="60fps">60 fps (Suave)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useVideoRecorder.ts` | Adicionar estados de qualidade/fps, funções para aplicar configurações |
| `src/components/mentorados/TeleprompterDialog.tsx` | Reescrever modo flutuante com controles completos + adicionar popover de configurações |

---

### Resultado Final

**Modo Flutuante** (igual à imagem):
```
┌───────────────────────────────────┐
│ [X]        Teleprompter           │
├───────────────────────────────────┤
│                                   │
│   📌 HEADLINE:                    │
│   Sua headline aqui...            │
│                                   │
│   📝 ESTRUTURA:                   │
│   Texto do roteiro que            │
│   vai rolando...                  │
│                                   │
├───────────────────────────────────┤
│   ⏪  ◀◀   ▶️   ▶▶  ⏩            │
│       Velocidade: 1.0x            │
└───────────────────────────────────┘
```

**Configurações de Câmera** (novo botão):
```
┌─────────────────────────┐
│ ⚙️ Qualidade            │
├─────────────────────────┤
│ Qualidade do vídeo:     │
│ ○ 720p (HD)             │
│ ● 1080p (Full HD)       │
│ ○ 4K (Ultra HD)         │
│                         │
│ Frame rate:             │
│ ○ 24 fps (Cinema)       │
│ ● 30 fps (Padrão)       │
│ ○ 60 fps (Suave)        │
└─────────────────────────┘
```

---

### Comportamento no Mobile

1. Quando clicar em **"Modo flutuante"**:
   - Abre uma nova aba/janela do navegador
   - Mostra texto com fundo transparente escuro
   - Tem controles de play/pause/velocidade
   - Usuário minimiza e abre câmera nativa
   - No iOS, pode usar Split View

2. Quando clicar em **"Qualidade"**:
   - Abre popover com opções
   - Aplica configurações em tempo real
   - Qualidade afeta a gravação final
