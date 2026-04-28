# Detecção de Headlines Repetidas/Parecidas

Implementar detecção em tempo real de headlines similares dentro do mentorado atual, com indicador visual e popovers de preview/expansão (igual à imagem de referência).

## Onde plugar

Editor da headline em `src/components/mentorados/MentoradoRoteirosView.tsx`, no bloco da `HEADLINE` (linhas ~2961-3154), ao lado do `Select` "Tipo..." e antes do `Referência`.

Todas as headlines do mentorado já estão disponíveis no estado local `roteirosLocais: Map<string, RoteiroLocal>` — chave `"${guia}-${ordem}"`. Não precisa de query nova.

## Arquivos a criar

### 1. `src/lib/headlineSimilarity.ts`
Lógica pura de comparação:

- `normalize(text)`: lowercase, remove pontuação, colapsa espaços, remove stopwords PT-BR (`que, o, a, os, as, de, do, da, e, em, um, uma, para, com, no, na, se, é, está, ou, mas, por, pelo, pela, te, seu, sua, meu`).
- `tokenize(text)`: split em palavras, filtra tokens com ≥2 chars.
- `similarity(a, b)`: combina:
  - **Jaccard** sobre tokens normalizados (peso 0.6)
  - **Cosine** sobre bigramas de caracteres (peso 0.4)
  - Retorna `0..1`.
- `compareHeadlines(input, candidates)`:
  - Ignora candidatos com `headline.trim().length < 8`.
  - Ignora a própria headline (mesma `key`).
  - Ignora candidatos com `< 4` tokens significativos.
  - Filtra `score > 0.7`.
  - Ordena desc por score, retorna `Array<{ key, headline, guia, ordem, score }>`.

Sem libs externas — implementação ~80 linhas, zero dependências.

### 2. `src/components/mentorados/SimilarHeadlinesBadge.tsx`
Componente de UI:

**Props:**
```ts
{
  currentKey: string;
  currentHeadline: string;
  allRoteiros: Map<string, { headline: string; ... }>;
  guias: Array<{ numero: number; nome?: string }>;
  onJumpTo: (guiaNumero: number, ordem: number) => void;
}
```

**Comportamento:**
- `useMemo` debounce de 300ms sobre `currentHeadline` (via `useEffect` + `setTimeout`).
- Calcula similares com `compareHeadlines`. Se vazio → não renderiza nada.
- Renderiza badge laranja redondo (`bg-[#FF7A00] text-white rounded-full h-5 min-w-5 px-1.5 text-xs font-semibold`) com a contagem.
- **Hover (Popover trigger):** preview compacto — até 3 headlines truncadas em 50 chars, com label "Guia X · Bloco Y", botão "Ver todas (N)" no rodapé.
- **Click "Ver todas":** abre Popover maior com:
  - Headline completa de cada similar
  - "Guia X · Bloco: <nome>"
  - Botão "Ir até" → chama `onJumpTo(guia, ordem)` que faz `setGuiaAtiva(guia)` + scroll/foco no roteiro alvo.
  - Rodapé: "Ver todas as headlines do mentorado" → abre `MentoradoHeadlinesList` (ou navega).

Usa `Popover` de `@/components/ui/popover` (existente). Tipografia Poppins, label gold quando aplicável.

## Modificações

### `src/components/mentorados/MentoradoRoteirosView.tsx`
- Importar `SimilarHeadlinesBadge`.
- Inserir `<SimilarHeadlinesBadge>` no row do header da headline (linhas 2962-3112), após o `Loader2` de detecção de tipo (~linha 3017), antes do botão de cópia simplificada.
- Passar:
  - `currentKey={key}`
  - `currentHeadline={roteiro.headline}`
  - `allRoteiros={roteirosLocais}`
  - `guias={guias}`
  - `onJumpTo={(g, o) => { setGuiaAtiva(g); requestAnimationFrame(() => document.getElementById(`roteiro-${g}-${o}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })); }}`
- Adicionar `id={`roteiro-${guiaAtiva}-${ordem}`}` no container do roteiro (perto da linha 2961) para permitir scroll.

## Performance

- Debounce de 300ms no input antes de recalcular.
- `useMemo` cacheia o resultado por `(currentHeadline, roteirosLocais size)`.
- Comparação é O(N) com N = nº de headlines do mentorado (≤ 4 guias × 30 = 120 max). Trivial em CPU.
- Não toca o banco de dados — tudo em memória.

## Critérios de aceitação

- Digitar uma headline parecida com outra existente → badge laranja com contador aparece em ≤300ms após parar de digitar.
- Hover no badge mostra preview com até 3 similares truncadas em 50 chars.
- Clicar em "Ver todas" abre popover maior com headline completa + botão "Ir até" funcional (troca guia + scrolla até o roteiro).
- Não bloqueia digitação, não substitui texto, não chama backend.
- Não detecta similaridade contra a própria headline nem contra headlines vazias/muito curtas.
- Threshold > 0.7 (sem falsos positivos óbvios em headlines genéricas).
