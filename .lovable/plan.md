
## Plano: Corrigir Câmera do Teleprompter que Não Abre

### Problema Identificado

O teleprompter fica travado em "Carregando câmera..." devido a dois problemas:

#### 1. Loop Infinito no useEffect
O `useEffect` que inicia a câmera tem `startCamera` e `stopCamera` como dependências:

```tsx
useEffect(() => {
  if (open) {
    startCamera();  // ← Chamado repetidamente
  } else {
    stopCamera();
  }
}, [open, startCamera, stopCamera]);  // ← Estas funções mudam a cada render
```

Como `startCamera` e `stopCamera` são funções que dependem de `stream` e `onError`, elas são recriadas a cada render, causando loops infinitos de chamadas.

#### 2. videoRef Não Conectado ao Elemento Video no Tempo Correto

O `videoRef` é atualizado com o stream, mas há uma race condition: quando o stream é obtido, o elemento `<video>` pode não estar montado ainda ou o ref não está sincronizado.

---

### Solução

#### 1. Remover Dependências Problemáticas do useEffect

Usar refs e callbacks estáveis para evitar que o useEffect seja re-executado:

```tsx
// TeleprompterDialog.tsx
useEffect(() => {
  if (open) {
    startCamera();
  }
  return () => {
    stopCamera();
  };
}, [open]);  // ← Apenas 'open' como dependência
```

E adicionar `// eslint-disable-next-line` para suprimir o warning.

#### 2. Garantir que o Video Receba o Stream Corretamente

Usar um `useEffect` adicional para sincronizar o stream com o elemento video:

```tsx
// useVideoRecorder.ts - adicionar efeito para sincronizar
useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream;
  }
}, [stream]);
```

#### 3. Estabilizar as Funções com useRef

Usar refs para manter referências estáveis das funções e evitar re-renders:

```tsx
// useVideoRecorder.ts
const onErrorRef = useRef(onError);
onErrorRef.current = onError;

const startCamera = useCallback(async () => {
  // ... usar onErrorRef.current em vez de onError
}, []);  // ← Sem dependências, função estável
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useVideoRecorder.ts` | Estabilizar callbacks, adicionar efeito para sincronizar stream com video |
| `src/components/mentorados/TeleprompterDialog.tsx` | Simplificar useEffect, remover dependências problemáticas |

---

### Detalhes Técnicos

#### useVideoRecorder.ts - Mudanças

1. **Usar ref para onError** para evitar recriação do callback:
```tsx
const onErrorRef = useRef(options.onError);
useEffect(() => {
  onErrorRef.current = options.onError;
}, [options.onError]);
```

2. **Remover dependências de callbacks**:
```tsx
const startCamera = useCallback(async () => {
  // ... lógica
  onErrorRef.current?.(errorMessage);  // usar ref
}, []);  // array vazio = função estável
```

3. **Usar ref para stream** em `stopCamera`:
```tsx
const streamRef = useRef<MediaStream | null>(null);

const stopCamera = useCallback(() => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  setStream(null);
  // ...
}, []);  // array vazio = função estável
```

4. **Adicionar efeito para sincronizar video**:
```tsx
useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream;
  }
}, [stream]);
```

#### TeleprompterDialog.tsx - Mudanças

1. **Simplificar useEffect**:
```tsx
useEffect(() => {
  if (open) {
    startCamera();
  }
  return () => {
    stopCamera();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open]);
```

---

### Por que Isso Resolve

1. **Funções estáveis**: `startCamera` e `stopCamera` não mudam entre renders
2. **Sem loop infinito**: useEffect só executa quando `open` muda
3. **Stream sincronizado**: Video recebe o stream assim que ele fica disponível
4. **Cleanup adequado**: Camera é parada quando dialog fecha

---

### Testes Necessários

1. Abrir teleprompter no desktop - câmera deve aparecer
2. Abrir teleprompter no mobile - câmera deve aparecer
3. Fechar e reabrir - deve funcionar sem travar
4. Gravar vídeo - deve funcionar normalmente
