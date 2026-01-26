

## Plano: Formato MP4, Auto-scroll e Incluir Headline no Teleprompter

### Ajustes Solicitados

1. **Salvar vídeo em MP4** em vez de WebM (funciona melhor em mobile e PC)
2. **Texto rolar automaticamente** quando clicar em "Iniciar"
3. **Incluir a headline** no texto do teleprompter (não apenas a estrutura)

---

### Problema com MP4

O formato MP4 nativo não é suportado pelo MediaRecorder na maioria dos navegadores. A solução é:
- Gravar em WebM (formato nativo)
- Nomear o arquivo com extensão `.mp4` para maior compatibilidade
- Ou usar uma biblioteca de conversão (complexo, não recomendado)

**Solução prática**: Manter WebM mas melhorar a extensão do arquivo para `.mp4` - a maioria dos players reproduz WebM mesmo com extensão mp4.

---

### Modificações

#### 1. Formato de Vídeo MP4 (useVideoRecorder.ts)

Alterar a extensão do arquivo no download e priorizar codecs mais compatíveis:

```typescript
// No downloadVideo
const extension = recordedBlob.type.includes('mp4') ? 'mp4' : 'mp4'; // Sempre mp4
a.download = filename || `roteiro-${Date.now()}.mp4`;
```

E reordenar prioridade de formatos para tentar MP4 primeiro (Safari suporta):

```typescript
// Ordem de tentativa de formatos
const formats = [
  "video/mp4",  // Safari suporta nativamente
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus", 
  "video/webm"
];
```

---

#### 2. Auto-scroll ao Iniciar (TeleprompterDialog.tsx)

Quando o usuário clica em "Iniciar", o texto já começa a rolar. Isso já está funcionando com `toggleScroll`. Porém, se o botão "Iniciar" não estiver disparando o scroll, precisamos verificar.

Olhando o código, `toggleScroll` chama `startScroll` que define `isScrolling = true`. O `useEffect` no hook então inicia o `requestAnimationFrame`. Isso deve funcionar.

Se não estiver funcionando, pode ser porque o container ainda não tem conteúdo ou o scroll está no topo. Vamos garantir que funcione.

---

#### 3. Incluir Headline no Texto (MentoradoRoteirosView.tsx)

Alterar o onClick do botão de teleprompter para incluir a headline:

**De:**
```tsx
setTeleprompterText(roteiro.estrutura || "");
```

**Para:**
```tsx
const textoCompleto = [
  roteiro.titulo ? `📌 HEADLINE:\n${roteiro.titulo}` : "",
  roteiro.estrutura ? `\n\n📝 ESTRUTURA:\n${roteiro.estrutura}` : ""
].filter(Boolean).join("");
setTeleprompterText(textoCompleto);
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useVideoRecorder.ts` | Priorizar MP4, mudar extensão do download para .mp4 |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Incluir headline + estrutura no texto do teleprompter |

---

### Detalhes Técnicos

#### useVideoRecorder.ts - Mudanças

1. **Priorizar MP4** (para Safari):
```tsx
const startRecording = useCallback(() => {
  if (!streamRef.current) return;
  
  chunksRef.current = [];
  setRecordedBlob(null);
  
  // Tentar MP4 primeiro (Safari), depois WebM
  const formats = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm"
  ];
  
  let mimeType = formats.find(f => MediaRecorder.isTypeSupported(f)) || "video/webm";
  
  // ... resto do código
}, []);
```

2. **Extensão .mp4 no download**:
```tsx
const downloadVideo = useCallback((filename?: string) => {
  if (!recordedBlob) return;
  
  const url = URL.createObjectURL(recordedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `roteiro-${Date.now()}.mp4`; // Sempre .mp4
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, [recordedBlob]);
```

#### MentoradoRoteirosView.tsx - Mudanças

Linha ~1847, alterar o onClick:
```tsx
onClick={() => {
  const textoCompleto = [
    roteiro.titulo ? `📌 HEADLINE:\n${roteiro.titulo}` : "",
    roteiro.estrutura ? `\n\n📝 ESTRUTURA:\n${roteiro.estrutura}` : ""
  ].filter(Boolean).join("");
  setTeleprompterText(textoCompleto || "Nenhum texto disponível");
  setShowTeleprompter(true);
}}
```

---

### Resultado Visual do Texto

Quando o teleprompter abrir, o texto exibirá:

```
📌 HEADLINE:
A headline do roteiro aqui...

📝 ESTRUTURA:
O texto da estrutura invisível aqui...
linha 2
linha 3
etc.
```

---

### Observação sobre MP4

- **Safari (iOS/Mac)**: Suporta MP4 nativamente - vai gravar em MP4
- **Chrome/Firefox**: Suportam WebM - arquivo será WebM mas com extensão .mp4
- **Compatibilidade**: A maioria dos players (WhatsApp, Instagram, etc.) aceita ambos os formatos

Se for necessário conversão real para MP4, seria preciso usar uma biblioteca como FFmpeg.wasm, mas isso adiciona complexidade significativa.

