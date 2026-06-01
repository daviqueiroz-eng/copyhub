## Problema

Ao digitar em qualquer headline ou estrutura, todo o componente `MentoradoRoteirosView` (4480 linhas) re-renderiza, incluindo os 25 roteiros do guia inteiro e todos os painéis auxiliares (anotações, checks virais, TTS, Select de tipos, etc.). Com texto longo (como no Guia 5 da screenshot), cada tecla dispara dezenas de re-renders pesados → sensação de travamento.

## Causas identificadas

1. **Lista inline sem componente filho memoizado** — `Array.from(...).map((ordem) => ...)` em ~200 linhas de JSX dentro do pai. Sem `React.memo`, toda mudança de estado re-renderiza os 25 itens.
2. **`checksVirais.filter(...)` rodando por roteiro a cada render** — chamada `verificarCheck` para cada check × 25 roteiros em todo render.
3. **`RoteiroAnotacoesPanel` montado para cada um dos 25 itens** com `roteiros.find(...)` linear dentro do map.
4. **`roteirosLocais` é um `Map`** — substituído por novo Map a cada keystroke, invalidando qualquer comparação rasa nos filhos.
5. **`InlineSpellCheckEditor` faz `autoResize` síncrono** que força layout (lê `scrollHeight`, escreve `height`) a cada tecla em todos os textareas montados.
6. **Overlay de spellcheck ainda é montado** mesmo com `showErrors=false` — renderiza um `<div>` espelho do texto inteiro.

## Plano de otimização (apenas frontend, sem mudar funcionalidade)

### 1. Extrair `RoteiroRow` como componente memoizado
Criar `src/components/mentorados/RoteiroRow.tsx` contendo o JSX de um roteiro (headline + estrutura + toolbar + anotações + checks). Envolver com `React.memo` e comparador raso. Passar apenas os dados do roteiro específico + callbacks estáveis (`useCallback`).

Resultado: digitar no roteiro #3 só re-renderiza o roteiro #3, não os 24 outros.

### 2. Memoizar dados derivados por roteiro
- `checksQueFalharam` → mover para dentro do `RoteiroRow` com `useMemo` dependendo só de `headline`, `estrutura`, `checksVirais`.
- Pré-construir um `Map<string, RoteiroDB>` por `guia-ordem` em `useMemo` no pai e passar o item certo, eliminando o `roteiros.find()` por linha.

### 3. Estabilizar callbacks passados aos filhos
Garantir que `handleChange`, `handleFieldBlur`, `handleTipoRoteiroChange`, `handleInlineFixError`, etc. recebidos por `RoteiroRow` sejam estáveis (já usam `useCallback`, mas alguns dependem de estado que muda — revisar deps).

### 4. Otimizar `InlineSpellCheckEditor`
- Não montar o `<div>` overlay quando `showErrors=false` e `errors.length===0` (já está desativado globalmente, então o overlay vira no-op vazio).
- Trocar `autoResize` síncrono por `requestAnimationFrame` para não bloquear o input.

### 5. Outros ganhos pequenos
- `tiposRoteiro.map` dentro do `<SelectContent>` é leve mas, como o `Select` só monta o conteúdo ao abrir, manter.
- `setSelectedRoteiroKeys(prev => [...prev, key])` está OK; apenas garantir que o checkbox não cause render do textarea (será resolvido com a extração do `RoteiroRow` + memo no sub-bloco do editor se necessário).

## Não incluído (a pedido)
- Sem mudanças em lógica de salvamento, sync realtime, IA, ou backend.
- Sem mexer no fluxo de auto-save / debounce existente.

## Como validar
Após implementação: abrir Guia 5 com 25 roteiros preenchidos, digitar continuamente em uma estrutura longa e verificar fluidez. Confirmar via React DevTools Profiler que apenas o `RoteiroRow` ativo re-renderiza por keystroke.
