## O que vou ajustar

### 1. Mobile — acesso ao modo "Olho" (visualizar somente headlines) e Resultados das votações
Hoje a barra com os botões `Eye` (visualizar headlines), `Swords` (resultados das votações) e `Undo/Redo` está marcada como `hidden lg:flex` em `MentoradoRoteirosView.tsx` (linha ~2416), então no celular esses botões somem. Vou:

- Adicionar dentro do `Sheet` do menu mobile (linha ~3568) uma nova seção **"Visualização"** com dois botões grandes:
  - **Visualizar headlines** → abre o `HeadlinesVisualizacaoPanel` (mesmo fluxo do desktop).
  - **Resultados das votações** com o badge `+N` quando há votos não vistos.
- Assim o usuário no celular consegue entrar no modo de só headlines e ver os resultados das votações, igual ao desktop.

Observação: se "o relógio" significar o **cronômetro de roteiros** (que hoje é desligado no mobile via `if (isMobile) return` na linha 1349), me confirme — esse é um comportamento intencional separado e prefiro não mexer sem confirmação.

### 2. Auto-extrair link colado na headline (modo visualização)
No modo normal já existe a regex em `handleChange` (linha ~1226 de `MentoradoRoteirosView.tsx`) que detecta `https?://...` na headline, salva em `link_referencia` e remove do texto.

No `HeadlinesVisualizacaoPanel` (`HeadlinesVisualizacaoDialog.tsx`, função `handleChangeHeadline`) hoje só salva o texto cru. Vou replicar a mesma lógica:
- Detectar URL na string digitada/colada.
- Se houver, gravar `link_referencia = primeira URL` e salvar a headline sem a URL.
- Persistir junto no `useUpsertMentoradoRoteiro` (que já aceita `linkReferencia`).

Resultado: colar um link no modo "Olho" passa a anexar a referência, igual ao modo normal.

### 3. Botão flutuante do livro cobrindo os acessos no canto inferior direito
Pelo screenshot, o botão azul de livro no canto inferior direito (mobile) fica em cima da barra de navegação do navegador / badge "Edit with Lovable" e atrapalha. Esse é o botão `lg:hidden fixed bottom-4 right-4` em `MentoradoRoteirosView.tsx` linha 3561.

Vou:
- Subir a posição para `bottom-20 right-4` (sai da área dos controles do navegador e do badge).
- Reduzir levemente o tamanho (`h-12 w-12`) para ficar menos invasivo.
- Garantir `z-40` para não conflitar com outros flutuantes (botão de gerar/estrutura usa `z-50`, então a hierarquia segue correta).

## Arquivos afetados

- `src/components/mentorados/MentoradoRoteirosView.tsx`
  - Mobile Sheet: adicionar seção "Visualização" com botões Olho + Resultados (+badge).
  - Botão flutuante do menu: reposicionar (`bottom-20`) e redimensionar.
- `src/components/mentorados/HeadlinesVisualizacaoDialog.tsx`
  - `handleChangeHeadline`: extrair URL, atualizar `link_referencia` no estado local e no `upsert`.

Sem alterações em banco/edge functions.