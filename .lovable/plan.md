## Objetivo

Trocar os textareas de **headline** e **estrutura** por um editor rico (TipTap) com barra de formatação funcional estilo Google Docs: estilo de parágrafo, fonte, tamanho, negrito/itálico/sublinhado, cor do texto, marca-texto, link, alinhamento, listas (bullet, numerada, check), recuo e mais.

## Como vai funcionar

- O campo continua salvando no banco em `headline` e `estrutura` (colunas `text`), mas agora em **HTML**.
- Conteúdo antigo (texto puro) é tratado como HTML válido — quebras de linha `\n` viram `<br>` na renderização. Nada precisa ser migrado.
- Para tudo que hoje depende de "texto puro" (slash commands `/3`/`/v`/`/t`, contagem de caracteres, viral check, busca/substituir, IA, copiar, corretor) eu derivo o texto plano do HTML em tempo real (`element.innerText`).

## Componente novo: `RichTextEditor`

Substitui o `InlineSpellCheckEditor` nos campos de headline e estrutura.

- Baseado em **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`) + extensões: `Underline`, `TextStyle`, `Color`, `Highlight`, `FontFamily`, `TextAlign`, `Link`, `Placeholder`, `TaskList`/`TaskItem`.
- Mantém: autosave debounced, autoresize (cresce com conteúdo), spellcheck nativo (Grammarly/QuillBot continuam funcionando, é um contenteditable), placeholder, foco programático.
- Mantém a API atual do `InlineSpellCheckEditor` (`value`, `onChange`, `onBlur`, `onKeyDown`) — só que `value` agora é HTML. Funções dependentes recebem versão texto via util `htmlToPlain()`.

## Barra de formatação (DocsToolbar)

Sticky no topo do editor, igual ao print da referência:

```text
[↶ ↷ 🖨]  | [Texto normal ▾] | [Poppins ▾] | [− 14 +] | [B I U] [A▾] [🖍▾] | [🔗 🖼] | [≣▾] [• ≡ ☑] [⇥ ⇤] | [⋯]   [Headlines x/y • Roteiros x/y] [100%]
```

- **Estilo**: Texto normal, Título 1-3 (mapeia para `heading` níveis 1-3).
- **Fonte**: Poppins (padrão), Inter, Arial, Georgia, Courier.
- **Tamanho**: −/+ com input numérico (10-72), aplicado via `TextStyle` + CSS inline.
- **B / I / U**: toggleBold / toggleItalic / toggleUnderline.
- **Cor texto** e **marca-texto**: popover com paleta (8 cores + custom).
- **Link**: prompt simples; **Imagem**: input file → upload no bucket `feedback-images` (já existe) e insere como `<img>`.
- **Alinhamento**: esquerda, centro, direita, justificar.
- **Listas**: bullet, numerada, tarefas (check).
- **Recuo**: aumentar / diminuir.
- **⋯**: menu com "Limpar formatação".

Barra renderizada uma única vez no topo do `MentoradoRoteirosView` (ela observa o editor com foco atual via contexto leve `ActiveEditorContext`). Isso evita uma barra por campo e bate visualmente com Docs.

## Impactos e ajustes necessários

1. **Salvamento** — `headline`/`estrutura` passam a guardar HTML. Hooks de save (`useUpdateRoteiro`) seguem iguais. Adiciono sanitização leve no servidor? Não — `dangerouslySetInnerHTML` só na renderização interna; em locais públicos (`RoteiroPublico`, copiar/compartilhar) eu uso `htmlToPlain()` ou renderização sanitizada via `DOMPurify`.
2. **Compartilhamento público / Copiar todos / Copiar com referências** — usam `htmlToPlain()` para preservar o comportamento atual de texto puro com quebras.
3. **Slash commands** (`/3`, `/4`, `/v`, `/t`, etc.) — reescritos como extensão TipTap "SlashCommand" que escuta `/` e dispara as mesmas ações já existentes.
4. **Corretor inline + viral check + erros wavy** — extensão TipTap "Decorations" que aplica `ProseMirror` decorations nas mesmas posições calculadas a partir do texto plano.
5. **Localizar/substituir** — opera no texto plano; ao confirmar substituição, regenera o HTML preservando estilos em runs não afetados.
6. **Realtime sync** — diff continua igual; o conteúdo é apenas uma string maior.
7. **Contagem > 2100 chars (fundo vermelho)** — calcula em cima de `htmlToPlain().length`.
8. **Teleprompter, IA, votação, comentários** — continuam recebendo texto plano via `htmlToPlain()`.

## Entrega em fases (commits pequenos)

1. Instalar TipTap + extensões. Criar `RichTextEditor` e `DocsToolbar` isolados, com toolbar fixa no topo do `MentoradoRoteirosView`. Manter `InlineSpellCheckEditor` vivo.
2. Trocar **estrutura** pelo `RichTextEditor` (campo maior, menos features dependentes). Validar autosave, realtime, copiar, compartilhar.
3. Trocar **headline** pelo `RichTextEditor`. Validar viral check, votação, contagem.
4. Reescrever slash commands como extensão TipTap.
5. Portar corretor inline (decorations) e localizar/substituir.
6. Remover `InlineSpellCheckEditor`.

## Riscos

- Conteúdo legado com caracteres especiais (`<`, `>`, `&`) precisa ser escapado ao tratar como HTML na primeira carga. Faço isso no `RichTextEditor` na hidratação.
- Realtime: dois usuários editando ao mesmo tempo continuam com o modelo "last write wins" atual; não vou introduzir CRDT agora.
- Aumento de payload (HTML é maior que texto puro). Aceitável.

## O que NÃO entra agora

- Comentários ancorados em trechos (igual Docs) — fora de escopo.
- Histórico de versões.
- Colaboração em tempo real com cursores (CRDT/Yjs).

Quer que eu siga por essa abordagem em fases? Posso começar pela **fase 1 + 2** já no próximo passo.
