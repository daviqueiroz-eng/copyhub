# Plano

## 1. Tornar headlines editáveis no modo "olho"

No `HeadlinesVisualizacaoPanel` (em `src/components/mentorados/HeadlinesVisualizacaoDialog.tsx`), a headline aparece como `<p>` somente leitura. Trocar por um campo editável (textarea autogrow) que escreve a alteração direto em `mentorados_roteiros` usando o mesmo padrão de debounce (800ms) já usado em `MentoradoRoteirosView`.

- Substituir o `<p>` da `SortableRow` por um `<textarea>` com autogrow.
- Onde clicar/digitar, suspender o drag (drag handle continua só no `GripVertical`).
- Salvamento: chamar uma nova mutação `useUpdateHeadlineOrdem(mentoradoId, guiaNumero, ordem, headline)` em `useMentoradosRoteiros.ts` que faz `upsert` apenas do campo `headline` da linha correspondente, mantendo `estrutura`, `tipo_roteiro_id` e `link_referencia` intactos.
- Debounce local de 800ms + reflexo do valor digitado em tempo real (estado local controlado).
- Sem mexer na edição de estrutura/tipo (continua sendo feito na view normal).

## 2. Ícone de espada por headline → dispara votação ao vivo

Adicionar um botão de espada (ícone `Swords` do lucide) ao lado de cada headline na visualização. Ao clicar:
- Cria uma "votação" na tabela e envia broadcast realtime para todos os usuários.
- Duração: 3 minutos. Tipo: nota de 1 a 10. Comentário opcional.

### Banco de dados (nova migração)

Duas tabelas novas:

`headline_votacoes`
- `id uuid pk`
- `criado_por uuid` (auth.uid())
- `mentorado_id uuid`
- `guia_numero int`
- `ordem int`
- `headline_texto text` (snapshot)
- `iniciada_em timestamptz default now()`
- `expira_em timestamptz` (now() + 3 min)
- `encerrada bool default false`

RLS:
- SELECT: todos autenticados (todo mundo precisa receber).
- INSERT: `auth.uid() = criado_por`.
- UPDATE: só criador (para marcar `encerrada`).

`headline_votacoes_votos`
- `id uuid pk`
- `votacao_id uuid`
- `user_id uuid`
- `nota int` (1..10, validado por trigger, não check)
- `comentario text null`
- `created_at timestamptz default now()`
- UNIQUE (`votacao_id`, `user_id`)

RLS:
- SELECT: todos autenticados (criador precisa ver resultado; participantes podem ver o próprio voto — simplificar liberando SELECT autenticado).
- INSERT: `auth.uid() = user_id` E votação não expirada/encerrada (validar via trigger ou em policy com subselect simples).

Adicionar ambas ao `supabase_realtime` publication.

Tabela auxiliar `headline_votacoes_visualizadas`:
- `id, votacao_id, user_id, visualizada_em` — para o criador marcar resultados já vistos e calcular o "+N" não vistos.

### Frontend

Novo hook `useHeadlineVotacoes.ts`:
- `useDispararVotacao({ mentoradoId, guiaNumero, ordem, headline })` — INSERT em `headline_votacoes`.
- `useRegistrarVoto({ votacao_id, nota, comentario })` — INSERT em `headline_votacoes_votos`.
- `useVotacoesAtivas()` — query + canal realtime de `headline_votacoes` onde `expira_em > now()` e `encerrada = false`. Auto-encerra ao expirar (UPDATE local + filtro).
- `useResultadosVotacoes()` — busca votações criadas pelo `auth.uid()` já encerradas, junto com agregação dos votos.

Novo provider `HeadlineVotacoesRealtimeProvider` montado no `App.tsx` (alto nível), análogo ao `ViraisRealtimeProvider`. Ele:
- Escuta INSERTs em `headline_votacoes` e, para cada nova votação cujo `criado_por !== auth.uid()`, abre um toast persistente top-right (sonner) com:
  - Snapshot da headline.
  - Slider/Select de nota 1..10.
  - Textarea opcional "comentário".
  - Countdown ao vivo (mm:ss) que fecha sozinho ao expirar.
- Escuta INSERTs em `headline_votacoes_votos` e, se a votação foi criada por mim, incrementa o contador "+N" não visto.

UI no `HeadlinesVisualizacaoPanel`:
- Botão `Swords` ao lado do grip de cada headline → confirma e chama `useDispararVotacao`.
- Segundo botão `Swords` no topo do painel (badge "+N" quando há resultados não vistos) → abre `ResultadosVotacaoDialog` listando minhas votações com: headline, número de votos, média, distribuição (1–10) e comentários. Ao abrir, marca como visualizado.

### Arquivos

- migração SQL (nova) — 3 tabelas + RLS + realtime
- `src/hooks/useHeadlineVotacoes.ts` (novo)
- `src/contexts/HeadlineVotacoesRealtimeProvider.tsx` (novo)
- `src/components/mentorados/HeadlineVotacaoToast.tsx` (novo — card que vai dentro do toast)
- `src/components/mentorados/ResultadosVotacaoDialog.tsx` (novo)
- `src/components/mentorados/HeadlinesVisualizacaoDialog.tsx` (editar — campo editável + 2 botões de espada)
- `src/hooks/useMentoradosRoteiros.ts` (editar — adicionar `useUpdateHeadlineCampo`)
- `src/App.tsx` (editar — montar o novo provider)

Sem mudanças nos fluxos de edição existentes fora do painel "olho".
