
## Plano: Ajustar Layout para Empilhar Roteiro e Chat Verticalmente

### Problema Atual

Na linha 550 do `RoteiroRevisaoDialog.tsx`:
```tsx
<div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
```

Isso faz com que em telas grandes (`lg:`) o conteúdo seja exibido **lado a lado** (flex-row). O usuário quer que fique **sempre empilhado** (um em cima do outro).

---

### Solução

Mudar o layout para sempre usar `flex-col`, removendo a variação `lg:flex-row`.

---

### Mudancas no Arquivo

| Arquivo | Mudanca |
|---------|---------|
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Alterar layout de `flex-col lg:flex-row` para apenas `flex-col` |

---

### Detalhes Tecnicos

#### Linha 550 - Layout Principal
```tsx
// Antes:
<div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

// Depois:
<div className="flex-1 flex flex-col overflow-hidden">
```

#### Linha 552 - Secao do Roteiro
```tsx
// Antes:
<div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden">

// Depois:
<div className="flex-[0.6] flex flex-col border-b overflow-hidden">
```
- Muda de `flex-1` para `flex-[0.6]` para ocupar ~60% da altura
- Remove `lg:border-b-0 lg:border-r` pois nao teremos mais layout lado a lado

#### Linha 587 - Secao do Chat/Ajuste Fino
```tsx
// Antes:
<div className="flex-1 flex flex-col lg:w-[400px] lg:max-w-[400px] overflow-hidden">

// Depois:
<div className="flex-[0.4] flex flex-col overflow-hidden">
```
- Muda de `flex-1 lg:w-[400px]` para `flex-[0.4]` para ocupar ~40% da altura
- Remove restricoes de largura que eram para layout horizontal

---

### Resultado Visual

```text
+--------------------------------------------------+
|  Header: Roteiro 1/2 (mentorado)  [Undo] [Redo]  |
+--------------------------------------------------+
|                                                  |
|  HEADLINE 01:                                    |
|  [Textarea com headline]                         |
|                                                  |
|  ESTRUTURA 01:                                   |
|  [Textarea com estrutura - ocupa ~60% altura]    |
|                                                  |
+--------------------------------------------------+
|  [Chat de Revisao] [Ajuste Fino]                 |
|                                                  |
|  [Area de mensagens/chat - ocupa ~40% altura]    |
|                                                  |
|  [Input de resposta]                             |
+--------------------------------------------------+
```

---

### Consideracoes

- O roteiro (headline + estrutura) fica na parte superior
- O chat/ajuste fino fica na parte inferior
- Proporcao de ~60/40 para dar espaco adequado ao roteiro
- Layout consistente em todas as telas (mobile e desktop)
