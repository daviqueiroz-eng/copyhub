

## Plano: Correções Mobile para Roteiros

### Problema 1: Cronômetro não visível

**Análise:**
Na screenshot, o header mostra apenas os botões de ações (Undo/Redo, Search, etc.), mas não há nenhum indicador de timer visível. O checklist com os timers está escondido com `hidden lg:block` (só aparece em telas grandes).

Existe um botão flutuante (`CheckSquare`) que abre um Sheet com o checklist completo, mas:
1. Não há indicação visual de que o timer está ativo/pausado
2. O usuário precisa abrir o Sheet para ver/controlar o timer

**Solução:**
Adicionar um **mini-timer compacto** no header mobile que mostra:
- O tempo atual rodando
- Botão play/pause rápido
- Ao clicar, abre o Sheet completo

---

### Problema 2: Menu de comandos (/) cortado

**Análise:**
O `SlashCommandPopover` tem largura fixa de `w-96` (384px) e posição baseada no cursor. Em dispositivos móveis com tela de ~375px, o popover pode ultrapassar os limites da tela.

**Solução:**
Tornar o popover responsivo:
1. Em mobile: usar largura `w-[calc(100vw-32px)]` e centralizar
2. Garantir que nunca ultrapasse os limites da tela
3. Considerar posição bottom se não couber acima

---

### Implementação Detalhada

#### 1. Adicionar Timer Compacto no Header Mobile

Modificar o header em `MentoradoRoteirosView.tsx` para mostrar um mini-timer:

```tsx
{/* Mini-timer para mobile - ao lado dos botões de ação */}
<div className="lg:hidden flex items-center gap-1 mr-2">
  <Button
    variant={isAnyTimerRunning ? "default" : "outline"}
    size="sm"
    className="gap-1.5 h-8"
    onClick={() => setShowChecklistMobile(true)}
  >
    {isAnyTimerRunning ? (
      <Pause className="h-3.5 w-3.5" />
    ) : (
      <Play className="h-3.5 w-3.5" />
    )}
    <span className="font-mono text-xs">
      {formatTotalTime(timers)}
    </span>
  </Button>
</div>
```

Localização: dentro do header, antes dos botões de Undo/Redo, visível apenas em mobile (`lg:hidden`).

Isso permite:
- Ver rapidamente o tempo total
- Ver se está rodando (botão em estado "default" = azul)
- Clicar para abrir o Sheet com controles completos

#### 2. Corrigir Posicionamento do SlashCommandPopover

Modificar `SlashCommandPopover.tsx`:

**Antes:**
```tsx
className="fixed z-[100] bg-background border rounded-lg shadow-lg w-96"
style={{ top: position.top, left: position.left }}
```

**Depois:**
```tsx
className="fixed z-[100] bg-background border rounded-lg shadow-lg w-[calc(100vw-32px)] sm:w-96 max-w-96"
style={{ 
  top: position.top, 
  left: Math.max(16, Math.min(position.left, window.innerWidth - 400)),
  // Em mobile, centralizar
  ...(window.innerWidth < 640 && { left: 16, right: 16 })
}}
```

Melhor ainda, usar um cálculo dinâmico no useEffect:

```tsx
const [adjustedPosition, setAdjustedPosition] = useState(position);

useEffect(() => {
  if (!isOpen) return;
  
  const isMobile = window.innerWidth < 640;
  const popoverWidth = isMobile ? window.innerWidth - 32 : 384; // 384 = w-96
  
  let left = position.left;
  
  if (isMobile) {
    // Centralizar em mobile
    left = 16;
  } else {
    // Em desktop, garantir que não ultrapasse a tela
    const maxLeft = window.innerWidth - popoverWidth - 16;
    left = Math.max(16, Math.min(position.left, maxLeft));
  }
  
  setAdjustedPosition({ top: position.top, left });
}, [position, isOpen]);
```

E aplicar:
```tsx
style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar mini-timer no header mobile, helper para formatar tempo total |
| `src/components/mentorados/SlashCommandPopover.tsx` | Ajustar largura e posicionamento para mobile |

---

### Resultado Visual Esperado

**Header Mobile com Timer:**
```
┌─────────────────────────────────────┐
│ [X] Roteiros - João     [@] [⟲][⟳] │
│     Guia 2 • 0/15 preenchidos       │
├─────────────────────────────────────┤
│ [▶ 00:00]  [🔍][📝] [Copiar todos] │  <- Timer visível aqui
├─────────────────────────────────────┤
```

**SlashCommandPopover em Mobile:**
```
┌────────────────────────────────┐
│ [🔍 Buscar item...]            │
├────────────────────────────────┤
│ Mapa do Avatar                 │
│ ├ Dores (4)                    │
│ │   • Item 1                   │
│ │   • Item 2                   │
│ └ Desejos (2)                  │
│     • Item A                   │
├────────────────────────────────┤
│ /i Intensificadores, /c CTAs.. │
└────────────────────────────────┘

     (Centralizado, sem cortes)
```

---

### Detalhes Técnicos

#### Timer no Header

Adicionar função helper:
```typescript
const formatTotalTime = (timers: TimersRecord) => {
  const total = Object.values(timers).reduce((acc, t) => acc + t.segundos, 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const isAnyTimerRunning = Object.values(timers).some(t => t.isRunning);
```

#### SlashCommandPopover Responsivo

Classes Tailwind:
- `w-[calc(100vw-32px)]` em mobile (16px de margem cada lado)
- `sm:w-96` em telas maiores
- `max-w-96` para limitar tamanho máximo

Posicionamento JavaScript:
- Calcular posição ajustada baseada na largura da viewport
- Em mobile: sempre `left: 16px`
- Em desktop: respeitar cursor mas não ultrapassar bordas

