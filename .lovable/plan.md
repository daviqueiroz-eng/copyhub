

## Plano: Aumentar Separação Entre as Colunas

### Objetivo
Aumentar o espaçamento visual entre a Coluna 1 (Insumos) e a Coluna 2 (Tipos) para que não pareçam "grudadas".

---

### Mudanças

#### Linha 348 - Container das colunas
**De:**
```typescript
<div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
```

**Para:**
```typescript
<div className="flex gap-10 flex-1 min-h-0 overflow-hidden">
```

#### Linha 427 - Divisor vertical
**De:**
```typescript
<div className="w-px bg-border shrink-0" />
```

**Para:**
```typescript
<div className="w-px bg-border shrink-0 mx-4" />
```

---

### Resultado Visual

```text
+-------------------------------+          +-----------------------------------+
|  [COLUNA 1 - INSUMOS]         |    ⏐     |  [COLUNA 2 - TIPOS]               |
|                               |    ⏐     |                                   |
|                               |          |                                   |
|                               |  ← Maior espaço →                            |
+-------------------------------+          +-----------------------------------+
```

O espaçamento total entre as colunas será aproximadamente **80-96px** (gap-10 = 40px + margin do divisor = 32px adicional).

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Aumentar gap e adicionar margin no divisor |

