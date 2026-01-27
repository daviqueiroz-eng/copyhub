

## Plano: Separar Colunas em Blocos Visuais Distintos

### Objetivo
Colocar cada coluna em seu próprio container visual (com borda e fundo), criando uma separação clara entre a Etapa 1 e a Etapa 2.

---

### Interface Visual

```text
+------------------------------------------------------------------+
|  Gerar Roteiro                                               X   |
+------------------------------------------------------------------+
|                                                                   |
|  ① extração do conteúdo ─────────────────── ② Selecionar estilo  |
|                                                                   |
|  +---------------------------+     +---------------------------+  |
|  |                           |     |                           |  |
|  |  HEADLINE 1:              |     |  ○ Selecionar todas       |  |
|  |  texto da headline...     |     |                           |  |
|  |                           |     |  HEADLINE 1:              |  |
|  |  Insumo:                  |     |  texto da headline...     |  |
|  |  +---------------------+  |     |  Tipo: [Selecionar ▼]     |  |
|  |  | 1. Dado X           |  |     |                           |  |
|  |  | 2. Fato Y           |  |     |  HEADLINE 2:              |  |
|  |  +---------------------+  |     |  texto da headline...     |  |
|  |                           |     |  Tipo: [Selecionar ▼]     |  |
|  |  [Gerar]     [Próximo →]  |     |                           |  |
|  +---------------------------+     +---------------------------+  |
|       ^ BLOCO 1                         ^ BLOCO 2                 |
|       (borda + fundo próprio)           (borda + fundo próprio)   |
+------------------------------------------------------------------+
```

---

### Mudanças Técnicas

#### 1. Remover divisor vertical
O divisor `<div className="w-px bg-border shrink-0 mx-4" />` não será mais necessário, pois as caixas já terão suas próprias bordas.

#### 2. Adicionar container visual a cada coluna

**COLUNA 1:**
```typescript
<div className={cn(
  "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
  "border rounded-lg bg-card p-4",  // <- NOVO: borda, cantos arredondados, fundo
  currentStep === 2 && "opacity-50 pointer-events-none"
)}>
```

**COLUNA 2:**
```typescript
<div className={cn(
  "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
  "border rounded-lg bg-card p-4",  // <- NOVO: borda, cantos arredondados, fundo
  currentStep === 1 && "opacity-50 pointer-events-none"
)}>
```

#### 3. Ajustar gap entre colunas

Manter `gap-6` entre as colunas para um espaçamento equilibrado:
```typescript
<div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
```

---

### Resumo das Mudanças

| Local | Mudança |
|-------|---------|
| Linha 348 | Mudar `gap-10` para `gap-6` |
| Linha 351-354 | Adicionar `border rounded-lg bg-card p-4` na COLUNA 1 |
| Linha 427 | **Remover** o divisor vertical |
| Linha 430-433 | Adicionar `border rounded-lg bg-card p-4` na COLUNA 2 |

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Adicionar bordas/fundo às colunas e remover divisor |

