## 1. Botão "Olho" (Modo Visualização de Headlines)

**Onde:** `MentoradoRoteirosView.tsx`, na barra de ações lateral aos botões Undo/Redo (linhas ~2356-2378), adicionar um terceiro botão com ícone `Eye` (lucide-react) com tooltip "Visualizar headlines".

**Comportamento:**
- Abre um modo overlay (`Dialog` em modo fullscreen ou painel dentro da área central) listando **somente as headlines da guia ativa** no formato da imagem de referência: número da headline + dropdown "Tipo..." + texto da headline + badge contador (quando houver overdelivery/check).
- Cada item é **arrastável** (usar `@dnd-kit/sortable`, já no projeto) para reordenar.
- Ao fechar (botão X), a nova ordem é persistida no banco (`mentorados_roteiros.ordem`) via um novo mutate `useReorderRoteiros` que faz `upsert` em lote trocando `ordem` dos registros afetados na guia ativa.
- Edições de texto ficam **desabilitadas** nesse modo (read-only). Só reorder + ver "Tipo".
- A ordem fica refletida no editor principal ao voltar.

**Novo arquivo:** `src/components/mentorados/HeadlinesVisualizacaoDialog.tsx`
**Novo hook:** método `reorderRoteiros` em `useMentoradosRoteiros.ts` (recebe `mentoradoId`, `guiaNumero`, `Array<{id, ordem}>`, faz upsert chamando `markLocalWrite()`).

## 2. Bug: Texto Colado Sumindo

**Causa identificada:** em `MentoradoRoteirosView.tsx` linhas 687-713, o `useEffect` que sincroniza `roteiros` (vindo do banco) para `roteirosLocais` **substitui o mapa inteiro** toda vez que `roteiros` muda. Quando o usuário cola texto:
1. Local muda → debounce de 800ms agendado
2. Antes do save terminar, qualquer refetch (realtime após janela de 4s, foco da janela, etc.) retorna o `roteiros` do banco sem o paste
3. O `useEffect` sobrescreve `roteirosLocais` → conteúdo colado some

**Correção:**
- No useEffect de sincronização, **preservar** chaves que têm timer de debounce pendente em `debounceTimersRef.current` (paste/typing ainda não persistido).
- Para cada key vinda do banco: se `debounceTimersRef.current.has(key)`, manter o valor local; caso contrário, usar valor do banco.
- Também ignorar a sincronização inicial se `isUndoRedoRef.current` estiver true.

```ts
roteiros.forEach((r) => {
  const key = `${r.guia_numero}-${r.ordem}`;
  if (debounceTimersRef.current.has(key)) {
    // pending local write — preserve current local value
    const existing = roteirosLocais.get(key);
    if (existing) { newMap.set(key, existing); return; }
  }
  newMap.set(key, { headline: r.headline || "", ... });
});
```

## 3. Posição (foco) por Leva (Guia)

**Comportamento esperado:** ao sair da Guia 1 olhando para a Headline 8 e voltar depois (vindo de outra guia onde olhava a Headline 5), restaurar o scroll para a Headline 8 da Guia 1.

**Implementação:**
- Novo state `lastFocusedOrdemPerGuia: Record<number, number>` (Map por `guiaNumero` → `ordem` da headline mais recentemente visível/focada).
- Observar o scroll do container central (já existe um scroll wrapper na área dos roteiros) com `IntersectionObserver` — sempre que um card de roteiro entra como "principal visível" (>50% visível), gravar `ordem` no map para a `guiaAtiva`.
- Também atualizar no `onFocus` dos campos `headline`/`estrutura` para garantir precisão quando o usuário está digitando.
- Em `handleGuiaChange(novaGuia)`, após trocar `guiaAtiva`, agendar (via `requestAnimationFrame` + pequeno timeout) um `scrollIntoView({ block: "center" })` no card cujo `data-ordem={lastFocusedOrdemPerGuia[novaGuia]}`.
- Persistir o map em `sessionStorage` com chave `roteiro-foco-${mentoradoId}` para sobreviver à navegação entre Virais/voltar, conforme padrão já usado para `lastOpenedMentoradoId`.

**Marcador no DOM:** adicionar `data-ordem={r.ordem}` e `data-guia={r.guia_numero}` no wrapper de cada card de roteiro renderizado.

## Arquivos afetados

- `src/components/mentorados/MentoradoRoteirosView.tsx` (botão Eye, sync defensivo, scroll-restore, data-attrs)
- `src/components/mentorados/HeadlinesVisualizacaoDialog.tsx` (novo)
- `src/hooks/useMentoradosRoteiros.ts` (`useReorderRoteiros`)

Nenhuma migração de banco necessária — só usa `ordem` que já existe.
