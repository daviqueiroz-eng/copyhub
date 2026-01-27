

## Plano: Remover Fundo Branco do Header e Escurecer Overlay

### Problema Atual
1. O header tem `bg-background` (linha 301) que aparece como branco no modo claro
2. O overlay do dialog (que escurece o fundo) não está suficientemente escuro

---

### Mudanças

#### 1. Header - Remover fundo branco

**Linha 301**

De:
```typescript
<div className="bg-background rounded-t-lg px-6 pt-6 pb-4">
```

Para:
```typescript
<div className="px-6 pt-6 pb-4">
```

#### 2. Dialog Overlay - Escurecer mais

O overlay padrão usa `bg-black/80`. Vamos aumentar para `bg-black/90`:

**Linha 299** - Adicionar className personalizado no DialogContent que afeta o overlay via CSS, ou usar um DialogOverlay customizado.

Como o DialogContent já está customizado, a melhor abordagem é criar um overlay mais escuro diretamente:

```typescript
<DialogContent 
  className="sm:max-w-6xl max-h-[85vh] flex flex-col bg-transparent border-none shadow-none p-0"
  overlayClassName="bg-black/90"
>
```

**Nota:** Se o componente Dialog não suportar `overlayClassName`, usaremos uma abordagem alternativa aplicando estilos via CSS com `[data-state]` ou adicionando uma classe customizada.

---

### Resultado Visual Esperado

```text
╔════════════════════════════════════════════════════════════════╗
║  (overlay escuro bg-black/90)                                  ║
║                                                                ║
║       Gerar Roteiro                                       X    ║
║       (sem fundo branco - transparente)                        ║
║                                                                ║
║  ① extração do conteúdo notável ─────────── ② Selecionar estilo║
║                                                                ║
║  ╔═══════════════════════════╗   ╔═══════════════════════════╗ ║
║  ║  BLOCO 1                  ║   ║  BLOCO 2                  ║ ║
║  ╚═══════════════════════════╝   ╚═══════════════════════════╝ ║
╚════════════════════════════════════════════════════════════════╝
```

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Remover `bg-background` do header e escurecer overlay |
| `src/components/ui/dialog.tsx` | Verificar se precisa criar variante com overlay mais escuro |

