

## Plano: Adicionar Teleprompter com Gravação de Vídeo

### Objetivo
Adicionar um novo botão na barra flutuante de ações do roteiro (abaixo do botão de áudio 🔊) que abre um teleprompter com gravação de vídeo.

---

### 1. Localização do Botão

O botão será adicionado na toolbar flutuante que aparece no hover de cada roteiro, logo após o botão de áudio (Volume2):

```
┌──────┐
│  📋  │  Copiar
├──────┤
│  🗑️  │  Deletar
├──────┤
│  ⚙️  │  Config TTS
├──────┤
│  🔊  │  Ler estrutura
├──────┤
│  🎬  │  ← NOVO: Teleprompter
└──────┘
```

---

### 2. Novo Componente: TeleprompterDialog

Criar um novo componente dialog que inclui:

#### Interface Principal
```
┌────────────────────────────────────────────────┐
│ 🎬 Teleprompter                            [X] │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │                                            │ │
│ │         📹 Preview da Câmera              │ │
│ │            (espelhado)                     │ │
│ │                                            │ │
│ │  ┌──────────────────────────────────────┐  │ │
│ │  │                                      │  │ │
│ │  │     Texto do roteiro scrollando...   │  │ │
│ │  │                                      │  │ │
│ │  └──────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ Velocidade: [━━━━━●━━━] 1.0x                   │
│ Tamanho:    [━━━●━━━━━] 24px                   │
│ [🔄 Espelhar] [📝 Editar texto]                │
├────────────────────────────────────────────────┤
│ [▶️ Iniciar Scroll]  [⏺️ Gravar]  [💾 Salvar]  │
└────────────────────────────────────────────────┘
```

#### Funcionalidades
- **Preview de câmera em tempo real** (frontal por padrão)
- **Texto scrollando** sobre o preview (overlay semitransparente)
- **Controle de velocidade** do scroll (0.5x a 3x)
- **Controle de tamanho** da fonte (16px a 48px)
- **Espelhamento** da câmera (útil para leitura)
- **Gravação de vídeo** com MediaRecorder API
- **Download direto** no dispositivo (MP4/WebM)

---

### 3. Estrutura de Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/mentorados/TeleprompterDialog.tsx` | Componente principal do teleprompter |
| `src/hooks/useTeleprompter.ts` | Hook para controle de scroll e estado |
| `src/hooks/useVideoRecorder.ts` | Hook para gravação de vídeo |

---

### 4. Detalhes Técnicos

#### 4.1 Captura de Vídeo
```typescript
// Acesso à câmera frontal
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: "user", width: 1280, height: 720 },
  audio: true
});

// MediaRecorder para gravação
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9,opus'
});
```

#### 4.2 Scroll Automático
```typescript
const scrollText = useCallback(() => {
  if (!isScrolling || !textRef.current) return;
  
  textRef.current.scrollTop += scrollSpeed;
  animationFrame = requestAnimationFrame(scrollText);
}, [isScrolling, scrollSpeed]);
```

#### 4.3 Download do Vídeo
```typescript
const downloadVideo = () => {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roteiro-${Date.now()}.webm`;
  a.click();
};
```

---

### 5. Modificações Necessárias

#### 5.1 MentoradoRoteirosView.tsx (linhas ~1835)

Adicionar novo botão após o botão de áudio:

```tsx
// Após o botão Volume2/Square (linha 1835)
<Button
  variant="ghost"
  size="icon"
  className="h-7 w-7"
  title="Gravar com teleprompter"
  onClick={() => {
    setTeleprompterText(roteiro.estrutura || "");
    setShowTeleprompter(true);
  }}
>
  <Video className="h-3.5 w-3.5" />
</Button>
```

E adicionar os estados e o dialog:

```tsx
// Estados
const [showTeleprompter, setShowTeleprompter] = useState(false);
const [teleprompterText, setTeleprompterText] = useState("");

// Dialog no final do JSX
<TeleprompterDialog
  open={showTeleprompter}
  onOpenChange={setShowTeleprompter}
  text={teleprompterText}
  onTextChange={setTeleprompterText}
/>
```

---

### 6. Compatibilidade

| Recurso | Desktop | iOS Safari | Android Chrome |
|---------|---------|------------|----------------|
| getUserMedia | ✅ | ✅ (iOS 11+) | ✅ |
| MediaRecorder | ✅ | ⚠️ (iOS 14.3+) | ✅ |
| Download automático | ✅ | ⚠️ (abre nova aba) | ✅ |

**Nota iOS**: Em iOS, o download pode abrir o vídeo em uma nova aba para o usuário salvar manualmente. Vamos detectar isso e mostrar instruções apropriadas.

---

### 7. Fluxo de Uso

1. Usuário clica no botão 🎬 na toolbar do roteiro
2. Dialog abre com preview da câmera e texto do roteiro
3. Usuário ajusta velocidade e tamanho da fonte
4. Clica em "▶️ Iniciar" para começar o scroll do texto
5. Clica em "⏺️ Gravar" para iniciar gravação
6. Quando terminar, clica em "⏹️ Parar"
7. Clica em "💾 Salvar" para baixar o vídeo

---

### 8. Interface Mobile

Em dispositivos móveis, o layout será adaptado:

```
┌─────────────────────────┐
│ 🎬 Teleprompter     [X] │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │   📹 Câmera         │ │
│ │   ┌───────────────┐ │ │
│ │   │ Texto aqui... │ │ │
│ │   └───────────────┘ │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Velocidade: [━━●━━━]    │
│ Tamanho: [━━━●━━]       │
├─────────────────────────┤
│ [▶️] [⏺️/⏹️] [💾]      │
└─────────────────────────┘
```

