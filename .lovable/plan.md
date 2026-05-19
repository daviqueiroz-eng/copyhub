# Compartilhar guia com mentorado via link público + comentários

## Visão geral

Adicionar a possibilidade de **compartilhar uma guia** com o mentorado (ou qualquer pessoa) através de um **link público**, onde a pessoa visualiza o roteiro em modo somente leitura, limpo e minimalista, podendo **comentar** (texto ou áudio) na headline, no roteiro ou em trechos selecionados. Esses comentários aparecem para o usuário interno em um **painel lateral esquerdo** (abrível/minimizável), igual à imagem de referência.

**Regra crítica e inegociável:** os comentários do mentorado **NUNCA** podem sobrescrever ou apagar o conteúdo que ele preencheu. Comentários moram em tabela separada, totalmente isolada dos campos `headline` e `estrutura` dos roteiros.

---

## 1. Compartilhamento da guia (lado do usuário interno)

- Ao passar o mouse sobre cada **aba de guia** (no `SortableGuiaItem` dentro de `MentoradoRoteirosView.tsx`), aparece um ícone de **Share2** (lucide) ao lado dos outros ícones.
- Clique abre um pequeno **popover** com:
  - Campo readonly com a URL pública (ex.: `https://copyhub.lovable.app/r/{shareToken}`)
  - Botão **Copiar link**
  - Toggle **Ativo/Inativo** (para revogar o link)
- O `shareToken` é um UUID gerado uma vez por guia (mentorado_id + guia_numero) e persistido no banco. Se já existir, reaproveita.

## 2. Página pública do mentorado (`/r/:token`)

Nova rota pública (fora do `ProtectedRoute`): `/r/:token` → `RoteiroPublicoView.tsx`.

Visual **clean e minimalista**:
- Fundo neutro, fonte Poppins (padrão do projeto).
- Apenas: nome da guia + lista de blocos `HEADLINE 0X` / `ESTRUTURA 0X` em **somente leitura**.
- Sem sidebar, sem menus, sem chat IA, sem timer, sem nada.
- Apenas uma ação por bloco: ícone de balão de comentário ao passar o mouse, ou seleção de texto que dispara um popover flutuante "Comentar trecho selecionado".
- Painel direito recolhível com a lista de comentários já feitos por ele (para acompanhar a thread).

**Tipos de comentário que o mentorado pode criar:**
1. Comentário geral na **headline** (escopo = `headline`, ordem N)
2. Comentário geral no **roteiro/estrutura** (escopo = `estrutura`, ordem N)
3. Comentário em **trecho selecionado** (escopo = `selecao`, ordem N + `trecho_texto` + range opcional)

**Entrada do comentário:**
- Aba **Texto**: textarea simples + botão Enviar.
- Aba **Áudio**: botão gravar usando `MediaRecorder` (igual ao já usado em `useVideoRecorder`/`TeleprompterDialog`). Upload em bucket `roteiro-comentarios-audio`.
- Sem login. Apenas pede um **nome** uma vez (salvo em `localStorage` por token) para identificar o autor.

## 3. Painel de comentários (lado do usuário interno)

Novo componente `RoteiroComentariosPanel.tsx`, inserido no layout esquerdo do `MentoradoRoteirosView` (similar ao `FloatingNotesPanel`):
- **Toggle no header** (ícone `MessageSquare` com badge contando comentários não lidos da guia ativa).
- Aberto: drawer/painel à esquerda com lista de comentários da guia atual, agrupados por headline/estrutura/seleção.
- Cada item mostra: autor, data, escopo (ex.: "Headline 03" / "Trecho: '...'"), texto ou player de áudio (`<audio controls>`), e botão "marcar como lido / resolver".
- Realtime via Supabase channel para que novos comentários do mentorado apareçam na hora com um toast no canto superior direito (padrão do projeto).
- Pode ser **minimizado** (vira só um ícone fino) ou **expandido**.

## 4. Segurança e isolamento de dados

**Não há nenhuma escrita do mentorado nos campos do roteiro.** A página pública só faz:
- `SELECT` (via função RPC `get_roteiro_publico(token)`) que devolve os blocos da guia em readonly.
- `INSERT` em `roteiro_comentarios`.
- `INSERT` em `storage.objects` no bucket de áudio.

Tabelas dos roteiros (`mentorados_roteiros`) ficam **bloqueadas** para usuários anônimos — nenhuma policy nova de UPDATE/DELETE para `anon`.

---

## Detalhes técnicos

### Novas tabelas (migration)

```sql
-- Token de compartilhamento por guia
create table public.roteiro_guia_shares (
  id uuid primary key default gen_random_uuid(),
  mentorado_id uuid not null,
  guia_numero int not null,
  token uuid not null unique default gen_random_uuid(),
  ativo boolean not null default true,
  criado_por uuid not null,
  created_at timestamptz not null default now(),
  unique (mentorado_id, guia_numero)
);

-- Comentários
create table public.roteiro_comentarios (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.roteiro_guia_shares(id) on delete cascade,
  mentorado_id uuid not null,
  guia_numero int not null,
  ordem int not null,
  escopo text not null check (escopo in ('headline','estrutura','selecao')),
  trecho_texto text,
  autor_nome text not null,
  autor_user_id uuid, -- null para mentorado público
  conteudo_texto text,
  audio_url text,
  resolvido boolean not null default false,
  lido_por jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.roteiro_guia_shares enable row level security;
alter table public.roteiro_comentarios enable row level security;
```

**RLS:**
- `roteiro_guia_shares`: usuários autenticados leem/inserem/atualizam (whitelist já gerencia auth do app).
- `roteiro_comentarios`: 
  - SELECT autenticado: livre (todos os internos veem).
  - SELECT anônimo: apenas via RPC `get_comentarios_publicos(token)`.
  - INSERT anônimo: permitido **somente** com `share_id` válido + ativo (validado por trigger/check via função `is_share_ativo(share_id)`).

### Função pública RPC

```sql
create or replace function public.get_roteiro_publico(_token uuid)
returns table(...) security definer set search_path = public ...
```
Retorna headline/estrutura readonly + lista de comentários do token.

### Bucket de áudio

Bucket `roteiro-comentarios-audio` público para leitura. Upload via cliente público (anon key) com path prefixado pelo share token.

### Componentes / arquivos novos

- `src/pages/RoteiroPublico.tsx` — página pública sem `ProtectedRoute`.
- `src/components/mentorados/publico/RoteiroPublicoView.tsx` — UI minimalista.
- `src/components/mentorados/publico/ComentarioInput.tsx` — texto + áudio.
- `src/components/mentorados/ShareGuiaPopover.tsx` — popover do botão Share.
- `src/components/mentorados/RoteiroComentariosPanel.tsx` — painel lateral esquerdo.
- `src/hooks/useRoteiroShares.ts` — get/create token por guia.
- `src/hooks/useRoteiroComentarios.ts` — list/insert/realtime.

### Componentes / arquivos editados

- `src/App.tsx` — adicionar `<Route path="/r/:token" element={<RoteiroPublico />} />` fora do `ProtectedRoute`.
- `src/components/mentorados/MentoradoRoteirosView.tsx`:
  - Adicionar ícone Share2 no `SortableGuiaItem` (com hover).
  - Adicionar toggle de painel de comentários no header (com badge de não lidos).
  - Renderizar `RoteiroComentariosPanel` à esquerda (acoplado ao layout existente).

### Garantia de não-sobrescrita dos dados do mentor

- A página pública **não importa nem usa** nenhum hook de mutação de `useMentoradosRoteiros`.
- A função RPC pública só faz SELECT.
- Não existe nenhum INSERT/UPDATE anônimo em `mentorados_roteiros` (policies continuam restritas a `authenticated`).

---

## Fora de escopo (para confirmar antes de implementar)

- Notificações por e-mail quando o mentorado comenta — não incluído.
- Resposta do mentor aparecendo de volta para o mentorado — não incluído (mentorado só comenta, não vê respostas). Confirmar se está correto.
- Expiração automática do link — não incluído (só toggle ativo/inativo manual).
