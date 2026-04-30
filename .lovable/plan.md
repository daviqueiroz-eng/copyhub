# Feature: Virais — Banco de Conteúdos Virais

Sistema novo para registrar, filtrar e consultar virais de referência. Acessível via atalho `/v` no popover de comandos e via sidebar.

## 1. Banco de Dados

Nova tabela `public.virais` (separada da `termos_virais`, que tem propósito diferente — termos curtos por nicho).

```sql
create table public.virais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  headline text not null,
  estrutura text,
  formato text not null,         -- 'lista_util' | 'defesa_crenca' | 'storytelling' | 'comparacao'
  views integer not null default 0,
  link text not null,
  nicho_id uuid references public.nichos(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.virais enable row level security;

-- Todos autenticados leem (banco global)
create policy "viral_select_all" on public.virais
  for select to authenticated using (true);

-- Qualquer autenticado insere (mas só para si)
create policy "viral_insert_own" on public.virais
  for insert to authenticated with check (auth.uid() = user_id);

-- Apenas o autor edita
create policy "viral_update_own" on public.virais
  for update to authenticated using (auth.uid() = user_id);

-- Sem DELETE (regra do produto: nunca apagar)

-- Trigger updated_at
create trigger virais_updated_at
  before update on public.virais
  for each row execute function public.update_updated_at_column();

-- Realtime para o toast global
alter publication supabase_realtime add table public.virais;
```

Reaproveita `nichos` (já existe com create/update/delete). Formatos são **enum fixo no front** (não criar tabela).

## 2. Hook `useVirais`

`src/hooks/useVirais.ts`:
- `useVirais(filters)` — query com filtros: `nichoIds[]`, `formatos[]`, `meusVirais` (bool), `dataInicio`, `dataFim`, `orderBy` ('views' | 'recentes').
- `useCreateViraisBulk()` — recebe array, faz `insert` em lote, invalida cache.
- `useUpdateViral()` — só headline/estrutura/views/link; checagem extra de `user_id` no front (RLS já bloqueia).
- Subscribe Supabase Realtime em `INSERT` para disparar toast global.

## 3. Página `/virais`

Arquivo `src/pages/Virais.tsx` + componentes em `src/components/virais/`:

- `ViraisView.tsx` — header com título "Virais" e botão **"+ Registrar novo viral"** (canto sup. dir.).
- `ViraisFilters.tsx` — barra de filtros:
  - **Nicho**: multi-select com criação inline (reusa padrão de `usePerfisReferencia`/`useCreateNicho`).
  - **Formato**: multi-select fixo (4 opções).
  - **Meus virais**: `Switch`.
  - **Período**: date range picker (reusa `Calendar` do shadcn).
  - Botão "Limpar filtros".
- `ViraisTable.tsx` — tabela com colunas: Headline | Estrutura | Views (formatado 2.1M) | Link (com `ExternalLink`, abre nova aba) | Autor | Data. Ordenação clicável por Views/Data. Paginação de ~20/pg. Ícone lápis aparece só se `viral.user_id === user.id`.
- Edição inline via dialog `ViralEditDialog.tsx` (mesmos campos do create, sem múltiplos).

Coluna **Autor** mostra "Você" para o próprio user, senão `profiles.nome` (fazer JOIN ou buscar via map de profiles).

## 4. Modal "Registrar novo viral"

`ViralRegistrarDialog.tsx`:
- Lista de "blocos" (cada um = 1 viral). Inicial: 1 bloco.
- Cada bloco contém: Nicho (select + criar), Headline, Formato, Estrutura (opcional), Views (numérico), Link (URL), e ícone lixeira no canto superior direito (visível quando há 2+ blocos) para remover **só esse bloco antes de salvar**.
- Botão tracejado **"+ Registrar mais um viral"** adiciona bloco.
- Validação com `zod` (campos obrigatórios + URL válida + views >= 0).
- Submit: bulk insert. Após sucesso, fecha modal e dispara N toasts (1 por viral inserido, com pequeno stagger).

## 5. Toast Global de Comissão

Componente `ViralAprovadoToast` usando `sonner` (já configurado no projeto). Estilo verde do mockup:
- Título: "Viral Aprovado!!"
- Subtítulo: "Sua comissão R$297,73" (valor fixo por enquanto — confirmar regra depois).
- Avatar/ícone à esquerda.
- Empilhável (sonner já faz), slide-in da direita (já configurado top-right).
- onClick → `navigate('/virais')`.

Disparado em **dois lugares**:
1. Quem registra: imediatamente após `createBulk` resolver.
2. Todos os outros usuários: via canal Realtime escutando `INSERT` em `virais` (registrar listener global em `App.tsx` ou em um novo provider `ViraisRealtimeProvider`).

## 6. Atalho `/v` no Slash Command

Em `src/components/mentorados/SlashCommandPopover.tsx`:
- Adicionar item "Virais" na grade de atalhos com tecla `/v` e ícone `Flame` (laranja).
- Ação: `navigate('/virais')` e fechar popover.
- Atualizar a barra de dicas no rodapé para incluir `/v`.
- Verificar onde os atalhos são interpretados (handler de keypress no editor) e adicionar `case "v"` para abrir.

## 7. Sidebar

Em `src/components/AppSidebar.tsx`, adicionar entrada:
```ts
{ title: "Virais", url: "/virais", icon: Flame }
```

## 8. Rota

Em `src/App.tsx` adicionar:
```tsx
<Route path="/virais" element={<ProtectedRoute><Virais /></ProtectedRoute>} />
```

## 9. Restrições aplicadas

- ❌ Sem botão de delete em lugar nenhum (nem RLS permite).
- ❌ Edição bloqueada para não-autores (UI esconde + RLS protege).
- ❌ Formatos não criáveis (lista hardcoded).
- ✅ Validação obrigatória client-side (zod) + server (NOT NULL).

## Arquivos criados/editados

**Criados:**
- `src/pages/Virais.tsx`
- `src/components/virais/ViraisView.tsx`
- `src/components/virais/ViraisFilters.tsx`
- `src/components/virais/ViraisTable.tsx`
- `src/components/virais/ViralRegistrarDialog.tsx`
- `src/components/virais/ViralEditDialog.tsx`
- `src/components/virais/ViralAprovadoToast.tsx`
- `src/hooks/useVirais.ts`
- `src/contexts/ViraisRealtimeProvider.tsx`
- Migration SQL (tabela + RLS + realtime)

**Editados:**
- `src/App.tsx` (rota + provider)
- `src/components/AppSidebar.tsx` (item Virais)
- `src/components/mentorados/SlashCommandPopover.tsx` (atalho /v)

## Pontos a confirmar antes de implementar

1. **Valor da comissão**: o mockup mostra "R$297,73". Esse valor é fixo, calculado por views, ou configurável por admin?
2. **Toast global para todos**: confirma que TODOS os usuários veem o toast quando qualquer um registra um viral? (Pode ficar barulhento.)
3. **Formato "Estrutura"**: é texto livre ou deve linkar com algo já existente (ex.: estruturas dos roteiros)?