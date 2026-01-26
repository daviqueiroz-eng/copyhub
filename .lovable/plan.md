
## Plano: Otimização Mobile para Mentorados

### Problemas Identificados (baseado nas screenshots)

1. **Página principal Mentorados (screenshot 1)**:
   - Layout sobreposto com elementos se misturando
   - "Ordem de Prioridade" aparece ao lado de "Meus Mentorados" em vez de abaixo
   - Tabs Geral/Grupo + filtros do OrdemPrioridade aparecem simultaneamente causando confusão visual
   - Grid de cards (2 colunas) ainda muito apertado em telas pequenas

2. **Dialog HeadlinesGeneratorDialog (screenshot 2)**:
   - Layout de 3 colunas fixas (`grid-cols-[320px_1fr_180px]`) que não se adapta ao mobile
   - Botões e controles ficam sem espaço adequado

---

### Solução: Layout Mobile-First

#### 1. Página Mentorados (`src/pages/Mentorados.tsx`)

**Mudanças no header**:
- Em mobile: esconder título "Ordem de Prioridade" no header (já aparece abaixo)
- Simplificar header para apenas "Meus Mentorados"

**Mudanças no layout principal**:
- Remover duplicação de `OrdemPrioridadeView` (atualmente renderiza 2 vezes)
- Em mobile (`< xl`): mostrar apenas a lista de mentorados, com "Ordem de Prioridade" em seção separada abaixo
- Reduzir padding e gaps para telas pequenas

```tsx
// Header simplificado para mobile
<div className="flex items-start justify-between gap-4 md:gap-6 shrink-0 pb-4">
  <div className="shrink-0">
    <h2 className="text-2xl md:text-3xl font-bold text-foreground">Meus Mentorados</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Repositório de perfis e diagnósticos
    </p>
  </div>
  {/* Título "Ordem de Prioridade" escondido em mobile */}
  <div className="flex-1 hidden xl:block">
    ...
  </div>
</div>
```

#### 2. OrdemPrioridadeView (`src/components/mentorados/OrdemPrioridadeView.tsx`)

**Mudanças no grid de cards**:
```tsx
// ANTES
<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">

// DEPOIS (1 coluna em mobile pequeno, 2 em mobile médio)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
```

**Mudanças nos filtros**:
- Empilhar filtros verticalmente em mobile
- Reduzir tamanho do combobox de copywriters

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
  {/* Filtro de copywriter */}
  <Button className="w-full sm:w-[280px] justify-between">
    ...
  </Button>
</div>

{/* ToggleGroup de período: horizontal scroll em mobile */}
<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <ToggleGroup className="justify-start whitespace-nowrap">
    ...
  </ToggleGroup>
</div>
```

#### 3. HeadlinesGeneratorDialog (`src/components/mentorados/HeadlinesGeneratorDialog.tsx`)

**Mudança crítica no layout**:
```tsx
// ANTES (layout fixo que quebra em mobile)
<div className="grid grid-cols-[320px_1fr_180px] gap-6 flex-1 min-h-0">

// DEPOIS (layout responsivo)
<div className="flex flex-col md:grid md:grid-cols-[280px_1fr_160px] gap-4 md:gap-6 flex-1 min-h-0 overflow-y-auto md:overflow-visible">
```

**Mudanças adicionais para mobile**:
- Em mobile: todas as 3 colunas empilham verticalmente
- Reduzir altura máxima das áreas de texto
- Botões ocupam largura total em mobile

```tsx
// Exemplo de botões responsivos
<div className="flex flex-col sm:flex-row gap-2">
  <Button className="flex-1">Gerar novas</Button>
  <Button className="flex-1" variant="outline">+ Gerar Mais</Button>
</div>
```

#### 4. PrioridadeCard (`src/components/mentorados/PrioridadeCard.tsx`)

Já está razoavelmente compacto, apenas ajuste fino:
```tsx
// Permitir que texto quebre em 3 linhas em mobile para melhor legibilidade
<h3 className="font-semibold text-xs leading-tight line-clamp-2 sm:line-clamp-2 mb-1">
```

#### 5. GeralView (`src/components/mentorados/GeralView.tsx`)

Ajustar header dos botões de abrir Instagram/TikTok:
```tsx
<div className="flex items-center gap-1 sm:gap-2 mb-3 pb-2 border-b shrink-0 flex-wrap">
```

#### 6. Sheet de Detalhes do Mentorado

As tabs já estão em 4 colunas, otimizar para mobile:
```tsx
// ANTES
<TabsList className="grid w-full grid-cols-4 mb-6">

// DEPOIS (2x2 em mobile)
<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1">
```

---

### Arquivos a Modificar

| Arquivo | Principais Mudanças |
|---------|---------------------|
| `src/pages/Mentorados.tsx` | Header responsivo, tabs em 2 colunas mobile, gaps reduzidos |
| `src/components/mentorados/OrdemPrioridadeView.tsx` | Grid 1 coluna em mobile, filtros empilhados, overflow scroll no toggle |
| `src/components/mentorados/HeadlinesGeneratorDialog.tsx` | Layout flex-col em mobile ao invés de grid fixo |
| `src/components/mentorados/GeralView.tsx` | Botões flex-wrap para caberem |
| `src/components/mentorados/PrioridadeCard.tsx` | Ajustes menores de espaçamento |

---

### Resultado Visual Esperado

**Mobile (< 640px)**:
```
┌─────────────────────────┐
│ Meus Mentorados         │
│ Repositório de perfis   │
├─────────────────────────┤
│ [🔍 Buscar...] [+Novo]  │
├─────────────────────────┤
│ [Geral] [Grupo]         │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 👤 João Silva       │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 👤 Maria Santos     │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Ordem de Prioridade     │
│ [Filtrar copywriter ▼]  │
│ [Todos][Hoje][Semana]   │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🔴 ATRASADO         │ │
│ │ Ricardo Novack      │ │
│ │ Validação 1         │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Dialog Headlines (Mobile)**:
```
┌─────────────────────────┐
│ ✨ Gere para mim    [X] │
├─────────────────────────┤
│ ▼ Inteligência Global   │
│ ┌─────────────────────┐ │
│ │ Texto método...     │ │
│ └─────────────────────┘ │
│                         │
│ Inteligência Individual │
│ ┌─────────────────────┐ │
│ │ Contexto mentorado  │ │
│ └─────────────────────┘ │
│ [Salvar]                │
├─────────────────────────┤
│ [Gerar Headlines]       │
├─────────────────────────┤
│ ☐ Headline 1 adaptada   │
│ ☐ Headline 2 adaptada   │
├─────────────────────────┤
│ [Usar Selecionadas]     │
└─────────────────────────┘
```

---

### Técnicas Utilizadas

1. **Breakpoints Tailwind**: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
2. **Flexbox responsivo**: `flex-col sm:flex-row`
3. **Grid responsivo**: `grid-cols-1 sm:grid-cols-2`
4. **Overflow scroll horizontal**: para grupos de toggle que não cabem
5. **Texto responsivo**: `text-sm sm:text-base`, `text-2xl md:text-3xl`
