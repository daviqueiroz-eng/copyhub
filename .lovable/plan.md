

## Plano: Otimizar Toolbar de Ações para Mobile

### Problema Identificado

A toolbar flutuante com os botões de ação (copiar, deletar, TTS, áudio, teleprompter) usa:
```css
opacity-0 group-hover:opacity-100
position: absolute -right-14
```

Isso significa:
1. Os botões estão **invisíveis** (opacity-0) por padrão
2. Só aparecem no **hover** - que não existe em touchscreen
3. Estão posicionados **fora da área visível** em telas pequenas

---

### Solução: Toolbar Sempre Visível em Mobile

Modificar a toolbar para ser sempre visível em dispositivos móveis usando classes responsivas.

---

### Modificações em `MentoradoRoteirosView.tsx`

#### 1. Tornar Toolbar Visível em Mobile

Alterar as classes da toolbar flutuante (linha ~1783):

**De:**
```tsx
<div className="absolute -right-14 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
```

**Para:**
```tsx
<div className="absolute -right-2 sm:-right-14 top-0 
  opacity-100 sm:opacity-0 group-hover:opacity-100 
  transition-opacity flex flex-row sm:flex-col gap-1
  bg-background/90 sm:bg-transparent 
  backdrop-blur-sm sm:backdrop-blur-none
  rounded-lg sm:rounded-none p-1 sm:p-0
  shadow-md sm:shadow-none
  border sm:border-0">
```

Esta mudança:
- Em mobile: toolbar visível (`opacity-100`), horizontal (`flex-row`), posicionada dentro do container (`-right-2`), com background para contraste
- Em desktop: mantém comportamento original com hover

#### 2. Aumentar Área de Toque dos Botões em Mobile

Adicionar classes responsivas aos botões:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 sm:h-7 sm:w-7" // Maior em mobile
  ...
>
  <Video className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> // Ícone maior em mobile
</Button>
```

---

### Resultado Visual Esperado

**Mobile (sempre visível, horizontal):**
```
┌───────────────────────────────────────────────┐
│ HEADLINE 01:                     [📋🗑️⚙️🔊🎬] │
│ Digite a headline...                          │
│                                               │
│ ESTRUTURA 01:                                 │
│ Digite a estrutura...                         │
└───────────────────────────────────────────────┘
```

**Desktop (aparece no hover, vertical):**
```
┌─────────────────────────────────┐  ┌──┐
│ HEADLINE 01:                    │  │📋│
│ Digite a headline...            │  │🗑️│
│                                 │  │⚙️│
│ ESTRUTURA 01:                   │  │🔊│
│ Digite a estrutura...           │  │🎬│
└─────────────────────────────────┘  └──┘
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar classes responsivas à toolbar flutuante e seus botões |

---

### Detalhes Técnicos

| Classe Tailwind | Mobile | Desktop |
|-----------------|--------|---------|
| `opacity-100 sm:opacity-0` | Sempre visível | Invisível até hover |
| `flex-row sm:flex-col` | Botões horizontais | Botões verticais |
| `-right-2 sm:-right-14` | Dentro do container | Fora do container |
| `bg-background/90 sm:bg-transparent` | Com fundo | Sem fundo |
| `h-8 w-8 sm:h-7 sm:w-7` | Área de toque maior | Menor e discreto |

---

### Benefícios

1. **Acessibilidade**: Botões sempre clicáveis em touch
2. **Área de toque adequada**: Botões maiores em mobile (44px+)
3. **Feedback visual**: Background com blur para destacar a toolbar
4. **Mantém desktop**: Comportamento original preservado
5. **Sem mudança de UX**: Mesmos botões, mesmas funcionalidades

