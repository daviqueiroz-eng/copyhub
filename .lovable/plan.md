

## Plano: Ajustar Posição e Controles do Texto no Teleprompter

### Ajustes Solicitados

1. **Texto no topo** em vez de embaixo
2. **Rolagem manual** permitindo ao usuário posicionar o texto onde quiser
3. **Controle de largura** para deixar o texto mais estreito

---

### Modificações

#### 1. Mover Texto para o Topo

No `TeleprompterDialog.tsx`, mudar a posição do overlay de texto:

**De:**
```tsx
<div className="absolute bottom-0 left-0 right-0 ...">
```

**Para:**
```tsx
<div className="absolute top-0 left-0 right-0 ...">
```

---

#### 2. Permitir Rolagem Manual

Atualmente, quando o scroll automático está pausado, o usuário já deveria conseguir rolar. Mas precisamos garantir que:

- O container de texto tenha `overflow-y-auto` (já tem)
- Funcione bem com touch em mobile
- Adicionar `touch-pan-y` para garantir scroll suave no mobile

---

#### 3. Adicionar Controle de Largura do Texto

**3.1 No hook `useTeleprompter.ts`:**

Adicionar novo estado para largura:
```tsx
const [textWidth, setTextWidth] = useState(100); // 100% por padrão
```

E expor no retorno do hook.

**3.2 No `TeleprompterDialog.tsx`:**

Adicionar novo slider nos controles:
```tsx
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
```

E aplicar a largura ao container de texto:
```tsx
<div 
  ref={textContainerRef}
  className="absolute top-0 left-1/2 -translate-x-1/2 ..."
  style={{ 
    fontSize: `${fontSize}px`,
    width: `${textWidth}%`
  }}
>
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useTeleprompter.ts` | Adicionar estado `textWidth` e `setTextWidth` |
| `src/components/mentorados/TeleprompterDialog.tsx` | Mover texto para topo, adicionar slider de largura, garantir scroll manual |

---

### Detalhes Técnicos

#### Layout Atualizado do Texto

```tsx
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
```

- `top-0` posiciona no topo
- `left-1/2 -translate-x-1/2` centraliza horizontalmente
- `touch-pan-y` garante scroll suave no mobile
- `width: textWidth%` controla a largura dinamicamente

---

### Resultado Visual

```
┌────────────────────────────────────────────────┐
│ ┌──────────────────────────────────┐           │
│ │     Texto aqui em cima...        │ ← Topo    │
│ │     (scrollável manualmente)     │           │
│ │     [largura ajustável: 40-100%] │           │
│ └──────────────────────────────────┘           │
│                                                │
│                📹 Câmera                        │
│                                                │
│                                                │
└────────────────────────────────────────────────┘

Controles:
├─ Velocidade: [━━━●━━━]
├─ Tamanho:    [━━━●━━━]
├─ Largura:    [━━━●━━━]  ← NOVO
└─ [Espelhar] [Editar] [Reiniciar]
```

---

### Comportamento de Scroll

- **Automático**: Texto sobe sozinho na velocidade configurada
- **Manual**: Usuário pode arrastar/rolar o texto a qualquer momento
- O scroll manual funciona mesmo durante o scroll automático (pausa automaticamente)

