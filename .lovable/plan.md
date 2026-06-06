## Plano final

**Objetivo:** Remover totalmente o checklist (linha de caixinhas abaixo da headline) e o painel lateral esquerdo de anotações (que estava cortado). No lugar do checklist, colocar os 3 botões — **Referência**, **Notas**, **Estudos** — em linha. Ao clicar em um, o conteúdo abre para baixo em largura cheia; clicar de novo fecha. **Comentário** é removido.

### Mudanças

**1. `src/components/mentorados/RoteiroAnotacoesPanel.tsx`**
- Remover `comentario` de `SECOES` (mantém o campo nos states só para não quebrar tipos, ou tira completamente — tira).
- Adicionar prop `layout?: "vertical" | "horizontal"` (default `vertical`, preserva uso atual).
- No modo `horizontal`: renderiza os 3 botões em uma linha (mesma estética compacta), e abaixo deles renderiza o `<Textarea>` de cada seção aberta em largura total. Botão de Transcrever continua disponível dentro da seção Referência.

**2. `src/components/mentorados/MentoradoRoteirosView.tsx`**
- **Remover** a coluna lateral esquerda que renderiza `RoteiroAnotacoesPanel` (bloco com `lg:w-[150px]/[280px]`), e o wrapper `lg:flex lg:gap-4`.
- **Remover** o state `anotacoesExpandidas`, o `prevAnotacoesOpenRef` e o `useEffect` que minimiza a sidebar das guias com base nele.
- **Remover** todo o bloco do checklist da headline (linhas ~3470–3543): o "Todos", os itens (`Está falando com o macro?`, `Tem 2 termos virais?`, etc.), e o botão de configurar checklist.
- **Inserir** no lugar do checklist removido: `<RoteiroAnotacoesPanel layout="horizontal" roteiroId={roteiroDB?.id} linkReferencia={roteiro.link_referencia} headline={roteiro.headline} mentoradoNome={mentoradoNome} />` com `ml-8` para alinhar com a headline.

### Resultado

```
☐ HEADLINE 01:  [Tipo ▾]                              ⚔ 🎙
   Texto da headline...

   > Referência   > Notas   > Estudos
   ┌─────────────────────────────────────┐
   │ Textarea da seção aberta            │  ← abre para baixo, reclique fecha
   └─────────────────────────────────────┘

   ESTRUTURA 01:
   ...
```

Sem mudanças de schema, hooks ou lógica de save (continua usando `useUpsertRoteiroAnotacao` com debounce 800ms). Hooks de checklist (`useHeadlineChecklistItems` etc.) e o dialog `HeadlineChecklistConfig` ficam no código mas deixam de ser renderizados — podem ser removidos depois se confirmado.