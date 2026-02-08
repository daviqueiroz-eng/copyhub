

## Plano: Carrossel de Mentorados com Tab

### Resumo

Ao pressionar **Tab** dentro da tela de Roteiros (`MentoradoRoteirosView`), um overlay aparece com todos os mentorados em fileira horizontal (estilo Xbox). Ao clicar em um mentorado, a tela troca diretamente para os roteiros desse mentorado. Pressionar **Tab** novamente ou **Escape** fecha o carrossel.

---

### Arquivos a Modificar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Mentorados.tsx` | Passar callback `onSwitchMentorado` e lista de mentorados para o `MentoradoRoteirosView` |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar listener de Tab, overlay com carrossel horizontal de mentorados |

---

### 1. Mentorados.tsx - Passar props extras

Adicionar `onSwitchMentorado` e `mentorados` ao componente:

```tsx
{isRoteirosViewOpen && selectedMentorado && (
  <MentoradoRoteirosView
    mentoradoId={selectedMentorado.id}
    mentoradoNome={selectedMentorado.nome}
    onClose={() => setIsRoteirosViewOpen(false)}
    mentorados={mentorados}
    onSwitchMentorado={(mentorado) => {
      setSelectedMentorado(mentorado);
    }}
  />
)}
```

---

### 2. MentoradoRoteirosView - Novas props

Atualizar a interface:

```typescript
interface MentoradoRoteirosViewProps {
  mentoradoId: string;
  mentoradoNome: string;
  onClose: () => void;
  mentorados?: Mentorado[];
  onSwitchMentorado?: (mentorado: Mentorado) => void;
}
```

---

### 3. MentoradoRoteirosView - Estado e Listener de Tab

```typescript
const [showMentoradoCarousel, setShowMentoradoCarousel] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignorar se estiver digitando em input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
    
    if (e.key === "Tab") {
      e.preventDefault();
      setShowMentoradoCarousel(prev => !prev);
    }
    if (e.key === "Escape" && showMentoradoCarousel) {
      setShowMentoradoCarousel(false);
    }
  };
  
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [showMentoradoCarousel]);
```

---

### 4. Overlay do Carrossel

Renderizar um overlay fixo no topo/centro da tela com scroll horizontal:

```tsx
{showMentoradoCarousel && mentorados && mentorados.length > 0 && (
  <div 
    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center"
    onClick={() => setShowMentoradoCarousel(false)}
  >
    <div 
      className="flex gap-4 px-8 py-6 overflow-x-auto max-w-[90vw] scrollbar-hide"
      onClick={(e) => e.stopPropagation()}
    >
      {mentorados.map((m) => (
        <button
          key={m.id}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all shrink-0",
            "hover:scale-110 hover:bg-white/10",
            m.id === mentoradoId 
              ? "ring-2 ring-primary bg-white/10 scale-105" 
              : "opacity-70 hover:opacity-100"
          )}
          onClick={() => {
            onSwitchMentorado?.(m);
            setShowMentoradoCarousel(false);
          }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
            {m.iniciais}
          </div>
          <span className="text-white text-xs font-medium max-w-[80px] truncate">
            {m.nome.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
```

---

### 5. Visual

```text
Tela de Roteiros normal:
┌──────────────────────────────────────────┐
│ [X] Nome do Mentorado    Guia 1  Guia 2 │
│                                          │
│  HEADLINE 01: [Tipo v] [copy]            │
│  texto da headline...                    │
│                                          │
│  ESTRUTURA 01:                           │
│  texto da estrutura...                   │
└──────────────────────────────────────────┘

Ao pressionar Tab:
┌──────────────────────────────────────────┐
│             (fundo escuro blur)           │
│                                          │
│   (A)  [B]  [C]  [D]  [E]  [F]  [G]     │
│   Ana  Bia  Caio Dan  Eva  Fla  Gui      │
│                                          │
│         <- scroll horizontal ->          │
└──────────────────────────────────────────┘

- O mentorado atual aparece com destaque (ring + scale)
- Clicar em outro troca imediatamente para os roteiros dele
- Tab ou Escape fecha o carrossel
```

---

### Comportamento

1. **Tab** (fora de inputs): abre/fecha o carrossel
2. **Escape**: fecha o carrossel
3. **Clique no fundo escuro**: fecha o carrossel
4. **Clique em um mentorado**: troca para os roteiros dele e fecha o carrossel
5. O mentorado atual fica destacado (maior, com borda)
