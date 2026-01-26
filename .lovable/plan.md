

## Plano: Corrigir Auto-scroll, Adicionar Seleção de Câmera e Modo Flutuante

### Problemas Identificados

1. **Scroll não funciona no mobile**: O `toggleScroll` retorna uma função nova a cada render devido ao ternário `isScrolling ? pauseScroll : startScroll`. Isso pode causar problemas de referência.

2. **Sem opção de câmera frontal/traseira**: Atualmente o código só usa `facingMode: "user"` (frontal).

3. **Sem modo flutuante**: Usuário quer usar a câmera nativa do celular com o texto flutuando.

---

### Solução 1: Corrigir Auto-scroll no Mobile

O problema está na linha 102 do `useTeleprompter.ts`:

```tsx
toggleScroll: isScrolling ? pauseScroll : startScroll,
```

Isso cria uma referência diferente a cada render. Precisamos criar uma função estável:

```tsx
const toggleScroll = useCallback(() => {
  if (isScrolling) {
    pauseScroll();
  } else {
    startScroll();
  }
}, [isScrolling, pauseScroll, startScroll]);
```

E usar `isScrollingRef` para evitar dependências que mudam:

```tsx
const isScrollingRef = useRef(false);

useEffect(() => {
  isScrollingRef.current = isScrolling;
}, [isScrolling]);

const toggleScroll = useCallback(() => {
  if (isScrollingRef.current) {
    setIsScrolling(false);
  } else {
    lastTimeRef.current = 0;
    setIsScrolling(true);
  }
}, []);
```

---

### Solução 2: Opção de Câmera Frontal/Traseira

Adicionar estado para `facingMode` no `useVideoRecorder.ts`:

```tsx
const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

const switchCamera = useCallback(async () => {
  const newMode = facingMode === "user" ? "environment" : "user";
  
  // Parar câmera atual
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
  }
  
  // Reiniciar com nova câmera
  setFacingMode(newMode);
  
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: newMode, ... },
    audio: true,
  });
  
  streamRef.current = mediaStream;
  setStream(mediaStream);
}, [facingMode]);
```

No `TeleprompterDialog.tsx`, adicionar botão:

```tsx
<Button variant="outline" size="sm" onClick={switchCamera}>
  <Camera className="h-4 w-4" />
  {isMobile ? "" : "Trocar câmera"}
</Button>
```

---

### Solução 3: Modo Flutuante (Texto Overlay Sem Câmera)

Criar um novo modo onde o texto aparece numa janela flutuante transparente que fica sobre outros apps.

**Opção A - Picture-in-Picture (PiP)**:
Usar a API Document Picture-in-Picture para criar uma janela flutuante com o texto.

**Opção B - Janela popup simples**:
Abrir uma nova janela pequena com o texto que o usuário pode posicionar onde quiser.

Para mobile, a opção mais viável é abrir uma nova janela/aba com o texto em tela cheia transparente.

```tsx
const openFloatingMode = () => {
  const popup = window.open("", "teleprompter", "width=400,height=300");
  if (popup) {
    popup.document.write(`
      <html>
        <head>
          <style>
            body { 
              background: rgba(0,0,0,0.7); 
              color: white; 
              font-size: ${fontSize}px;
              padding: 20px;
              overflow-y: auto;
            }
          </style>
        </head>
        <body>${localText}</body>
      </html>
    `);
  }
};
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useTeleprompter.ts` | Corrigir toggleScroll com ref estável |
| `src/hooks/useVideoRecorder.ts` | Adicionar facingMode e switchCamera |
| `src/components/mentorados/TeleprompterDialog.tsx` | Adicionar botão trocar câmera + botão modo flutuante |

---

### Detalhes Técnicos

#### useTeleprompter.ts

```tsx
// Adicionar ref para isScrolling
const isScrollingRef = useRef(false);

// Sincronizar ref
useEffect(() => {
  isScrollingRef.current = isScrolling;
}, [isScrolling]);

// Função toggleScroll estável
const toggleScroll = useCallback(() => {
  if (isScrollingRef.current) {
    setIsScrolling(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  } else {
    lastTimeRef.current = 0;
    setIsScrolling(true);
  }
}, []);
```

#### useVideoRecorder.ts

```tsx
// Novo estado
const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

// Função para trocar câmera
const switchCamera = useCallback(async () => {
  if (!streamRef.current) return;
  
  // Parar tracks atuais
  streamRef.current.getTracks().forEach(track => track.stop());
  
  const newMode = facingMode === "user" ? "environment" : "user";
  
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
    
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  } catch (error) {
    onErrorRef.current?.("Erro ao trocar câmera");
  }
}, [facingMode]);

// Expor no return
return {
  // ...existing
  facingMode,
  switchCamera,
};
```

#### TeleprompterDialog.tsx

```tsx
// Importar ícone
import { Camera, ExternalLink } from "lucide-react";

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
            body { 
              background: rgba(0,0,0,0.85); 
              color: white; 
              font-size: ${fontSize}px;
              padding: 24px;
              min-height: 100vh;
              line-height: 1.6;
              font-family: system-ui, sans-serif;
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    popup.document.close();
    // Fechar dialog principal
    handleClose();
  }
};

// Botões novos na área de controles secundários:
<Button
  variant="outline"
  size="sm"
  onClick={switchCamera}
  className="gap-1.5"
  disabled={isLoadingCamera}
>
  <Camera className="h-4 w-4" />
  {isMobile ? "" : "Trocar câmera"}
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
```

---

### Resultado Final

```
┌─────────────────────────────────────┐
│ Teleprompter                    [X] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   📌 HEADLINE...                │ │
│ │   📝 ESTRUTURA...               │ │  ← Texto no topo
│ └─────────────────────────────────┘ │
│                                     │
│         [Câmera aqui]               │
│                                     │
├─────────────────────────────────────┤
│ Velocidade: [━━━●━━━] 1.0x          │
│ Tamanho:    [━━━●━━━] 24px          │
│ Largura:    [━━━●━━━] 80%           │
│                                     │
│ [🔄] [✏️] [↩️] [📷] [↗️]            │  ← Novo: Trocar câmera + Flutuante
│                                     │
│     [▶️ Iniciar]   [⏺️ Gravar]      │  ← Iniciar agora rola o texto
└─────────────────────────────────────┘
```

---

### Modo Flutuante no Mobile

Quando clicar em "Modo flutuante":
1. Abre uma nova janela/aba do navegador
2. Mostra apenas o texto do roteiro em fundo escuro
3. Usuário pode minimizar essa aba e abrir a câmera nativa
4. No iOS, pode usar Split View ou Slide Over
5. O dialog principal fecha automaticamente

