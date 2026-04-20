

# Plano: Modo de Revisão Inteligente

Criar um modo dedicado de revisão que limpa a interface (oculta Referência/Notas/Estudos/Comentário), analisa todos os textos visíveis, classifica problemas em 4 categorias e oferece um painel à direita com navegação sincronizada com o texto.

## 1. Visão geral da interface

```text
┌─────────────────────────────────────────────────────────────────┐
│ Header: [Roteiros – Mentorado]   [🧠 Modo Revisão] [Copiar...]  │
├─────────────────────────────────────────────────────────────────┤
│                                              ┌────────────────┐ │
│  HEADLINE 01:                                │ Revisão geral  │ │
│  ┌──────────────────────────────────────┐    │ ● 5 Ortográfico│ │
│  │ Toda vez que você ~~reclama~~, ...   │    │ ● 4 Gramatical │ │
│  └──────────────────────────────────────┘    │ ● 0 Nome cli.  │ │
│  (Referência/Notas/etc OCULTOS)              │ ● 2 Mentorado  │ │
│                                              ├────────────────┤ │
│  ESTRUTURA 01: ...                           │ ● Ortográfico  │ │
│                                              │   1 de 5  ‹ ›  │ │
│  HEADLINE 02: ...                            │ HEADLINE 01    │ │
│                                              │ "...reclama..."│ │
│                                              │ Sugestões:     │ │
│                                              │ • reclama      │ │
│                                              │ • reclamo      │ │
│                                              │ [Ignorar][Corr]│ │
│                                              └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Estado novo

Em `MentoradoRoteirosView.tsx`:
- `modoRevisao: boolean` — ativa/desativa o modo (persistido em `localStorage`).
- `revisaoErrors: RevisaoError[]` — todos os erros analisados.
- `erroSelecionadoId: string | null` — erro ativo (sublinhado + fundo amarelo).
- `categoriaAtiva: "ortografico" | "gramatical" | "nome_cliente" | "mentorado"` — filtro.
- `revisaoPanelOpen: boolean` — expandir/fechar painel direito.
- `isAnalyzingRevisao: boolean`.

## 3. Botão de ativação

Novo botão no header (próximo ao botão de busca/spell-check existente):
- Ícone cérebro 🧠 + label "Modo Revisão".
- Toggle. Quando ativo: highlight visual + dispara análise inicial.

## 4. Comportamento ao ativar

Quando `modoRevisao = true`:
- O painel `RoteiroAnotacoesPanel` (Referência/Notas/Estudos/Comentário) é **completamente removido** do DOM (não apenas oculto). Isso libera 150–320px à esquerda, e o editor de roteiro ocupa toda a largura.
- Painel "Revisão geral" aparece fixo à direita (sticky, top-20, expansível/colapsável).
- A análise é executada automaticamente com debounce de 800ms a cada digitação.

## 5. Sistema de análise

Novo hook `useRevisaoInteligente.ts` que recebe `roteirosLocais`, `mentoradoNome`, `termosVirais` e retorna `RevisaoError[]`:

```ts
type RevisaoError = {
  id: string;
  tipo: "ortografico" | "gramatical" | "nome_cliente" | "mentorado";
  texto: string;          // texto problemático
  sugestoes: string[];    // alternativas
  mensagem: string;
  posicao: { 
    guiaNumero: number; 
    ordem: number; 
    field: "headline" | "estrutura"; 
    inicio: number; 
    fim: number; 
  };
}
```

**Categorias e fontes:**

| Categoria | Cor | Fonte |
|---|---|---|
| Ortográfico | vermelho | edge function `spell-check` (já existe) — filtra `type: "spelling"` |
| Gramatical | azul | edge function `spell-check` — filtra `type: "grammar"` |
| Nome do cliente | laranja | regex local: busca `mentoradoNome` no texto e marca variações erradas (case incorreto, sem acento) |
| Mentorado já pontuou | verde claro | cruza textos com `useTermosVirais()` — marca termos virais já usados pelo mentorado |

A análise roda apenas sobre a guia ativa (com toggle "Todas as guias" para ampliar). Debounce de 800ms.

## 6. Renderização inline

Reutilizar e estender `InlineSpellCheckEditor`:
- Adicionar suporte a 4 cores de sublinhado (já tem 3): vermelho, azul, laranja, verde.
- Quando `erroSelecionadoId === error.id`: aplicar `bg-yellow-200/50` adicional ao span do erro.
- Apenas um erro selecionado por vez.

## 7. Painel "Revisão geral" (direito)

Novo componente `RevisaoInteligenrePanel.tsx`:

**Topo — contagens por categoria** (clicáveis para filtrar):
```
● 5 Erros ortográficos
● 4 Sugestões gramaticais
● 0 Nome do cliente
● 2 Mentorado já pontuou
```

**Meio — erro selecionado**:
- Badge da categoria + "X de Y" + setas ‹ ›.
- Cabeçalho: `HEADLINE 0X` ou `ESTRUTURA 0X`.
- Trecho do texto com termo destacado.
- Lista de sugestões clicáveis.
- Botões `Ignorar` (cinza) e `Corrigir` (azul preenchido).

**Rodapé — lista de outros erros da categoria** (cards compactos, clicáveis).

Header do painel: título "Revisão geral" + botões ▲ (colapsar/expandir) e ✕ (fechar painel; mantém `modoRevisao` ativo).

## 8. Interação painel ↔ texto

- **Painel → texto**: ao clicar em erro/sugestão, atualiza `erroSelecionadoId`, faz `scrollIntoView({behavior:"smooth", block:"center"})` no campo correspondente, aplica destaque amarelo.
- **Texto → painel**: clicar em palavra sublinhada seta `erroSelecionadoId` e o painel rola até esse erro.
- **Navegação ‹ ›**: anterior/próximo dentro da mesma categoria, com wrap.

## 9. Correção e Undo

- Correção é sempre manual: clicar em sugestão ou em "Corrigir" substitui o trecho via `handleChange` (já existente, integrado ao histórico undo/redo).
- Ctrl+Z/Y continua funcionando porque usa o pipeline existente de `handleChange`.
- Cursor é restaurado após o trecho substituído.

## 10. Performance

- `useMemo` para agrupar erros por categoria.
- Debounce de 800ms na análise.
- Análise local (regex) para ortográfico simples + nome do cliente + termos virais é instantânea.
- IA (`spell-check` edge function) só é chamada para textos > 10 caracteres e apenas quando estão na guia ativa.
- Hash dos textos para evitar reprocessar o mesmo conteúdo.

## Detalhes técnicos

**Arquivos novos:**
- `src/hooks/useRevisaoInteligente.ts` — orquestra análise (local + IA + termos virais + nome cliente), retorna `RevisaoError[]` e função `reanalisar()`.
- `src/components/mentorados/RevisaoInteligenrePanel.tsx` — painel direito com contagens, erro ativo, sugestões e navegação.

**Arquivos modificados:**
- `src/components/mentorados/MentoradoRoteirosView.tsx`:
  - Novo estado `modoRevisao`, `erroSelecionadoId`, `categoriaAtiva`, `revisaoPanelOpen`.
  - Botão 🧠 "Modo Revisão" no header.
  - Quando `modoRevisao`: não renderizar `RoteiroAnotacoesPanel` e ajustar wrapper para usar largura total.
  - Renderizar `<RevisaoInteligenrePanel />` (sticky direito) quando ativo.
  - Passar `errors` filtrados por roteiro + `activeErrorId` para o `InlineSpellCheckEditor` em headline e estrutura.
- `src/components/mentorados/InlineSpellCheckEditor.tsx`:
  - Adicionar prop `activeErrorId` e tipo `nome_cliente`/`mentorado` com cores `decoration-orange-500`/`decoration-emerald-500`.
  - Quando `activeErrorId === error.id`: classe extra `bg-yellow-200/40 dark:bg-yellow-500/20`.
  - Expor `data-error-id` para permitir scroll programático a partir do painel.
- (opcional) Pequeno ajuste em `SpellCheckerPanel` para reaproveitar a edge function `spell-check` via hook compartilhado.

**Reuso:**
- Edge function `spell-check` (já existe).
- Hook `useTermosVirais` (já existe).
- `mentoradoNome` (já passado como prop).
- Pipeline `handleChange` (undo/redo já integrado).

**Sem mudanças de banco** — toda a lógica é client-side; não precisa migração.

