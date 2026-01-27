

## Plano: Blocos Independentes (Sem Container Visual Externo)

### Problema Atual
O `DialogContent` tem um fundo e borda que faz tudo parecer estar dentro de um único bloco. As colunas internas não parecem independentes porque herdam o estilo do container pai.

---

### Solução

1. **Tornar o DialogContent transparente** - remover o fundo visual do dialog
2. **Aplicar estilos completos em cada coluna** - para que pareçam cartões independentes flutuando

---

### Interface Visual Desejada

```text
                    Gerar Roteiro                              X

  ① extração do conteúdo notável ─────────── ② Selecionar estilo

  ╔═══════════════════════════════╗   ╔═══════════════════════════════╗
  ║                               ║   ║                               ║
  ║  HEADLINE 1:                  ║   ║  ○ Selecionar todas           ║
  ║  texto da headline...         ║   ║                               ║
  ║                               ║   ║  HEADLINE 1:                  ║
  ║  Insumo:                      ║   ║  texto da headline...         ║
  ║  +-------------------------+  ║   ║  Tipo: [Selecionar ▼]         ║
  ║  | 1. Dado X               |  ║   ║                               ║
  ║  | 2. Fato Y               |  ║   ║  HEADLINE 2:                  ║
  ║  +-------------------------+  ║   ║  texto da headline...         ║
  ║                               ║   ║  Tipo: [Selecionar ▼]         ║
  ║  [Gerar]         [Próximo →]  ║   ║                               ║
  ╚═══════════════════════════════╝   ╚═══════════════════════════════╝
        ^ BLOCO INDEPENDENTE                ^ BLOCO INDEPENDENTE
        (shadow + bg próprio)               (shadow + bg próprio)
```

---

### Mudanças Técnicas

#### 1. DialogContent - Remover fundo visual

Adicionar classe para sobrescrever o estilo padrão do dialog:

```typescript
<DialogContent className="sm:max-w-6xl max-h-[85vh] flex flex-col bg-transparent border-none shadow-none p-0">
```

#### 2. Header e indicadores de etapa - Manter visíveis

Criar um wrapper para o header com fundo próprio:

```typescript
<div className="bg-background rounded-t-lg px-6 pt-6 pb-4">
  <DialogHeader>
    <DialogTitle>Gerar Roteiro</DialogTitle>
  </DialogHeader>
  
  {/* Indicadores de etapa */}
  <div className="flex items-center gap-4 pt-4">
    {/* ... */}
  </div>
</div>
```

#### 3. Container das colunas - Padding lateral

```typescript
<div className="flex gap-6 flex-1 min-h-0 overflow-hidden px-6 pb-6">
```

#### 4. Cada coluna - Estilo de cartão independente com sombra

```typescript
{/* COLUNA 1 */}
<div className={cn(
  "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
  "bg-card border rounded-xl shadow-lg p-5",
  currentStep === 2 && "opacity-50 pointer-events-none"
)}>

{/* COLUNA 2 */}
<div className={cn(
  "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
  "bg-card border rounded-xl shadow-lg p-5",
  currentStep === 1 && "opacity-50 pointer-events-none"
)}>
```

---

### Resumo das Mudanças

| Local | Mudança |
|-------|---------|
| Linha ~298 | Adicionar classes ao DialogContent: `bg-transparent border-none shadow-none p-0` |
| Linha ~300-345 | Envolver header e indicadores em wrapper com `bg-background rounded-t-lg px-6 pt-6 pb-4` |
| Linha ~348 | Adicionar `px-6 pb-6` ao container das colunas |
| Linha ~351-354 | Coluna 1: mudar para `bg-card border rounded-xl shadow-lg p-5` |
| Linha ~428-431 | Coluna 2: mudar para `bg-card border rounded-xl shadow-lg p-5` |

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Tornar dialog transparente e estilizar colunas como cartões independentes |

