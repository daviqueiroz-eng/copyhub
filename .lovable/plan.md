## Botão "Estrutura" com biblioteca de formatos e vídeos

Novo chip **Estrutura** ao lado de "Estudos" no painel de anotações do roteiro. Ao clicar, abre um dialog grande com biblioteca global de formatos (Lista útil, Defesa, História, etc.), cada um contendo vídeos de referência com transcrição, views e favoritos por usuário.

### 1. Banco de dados (migration)

Três tabelas novas em `public` + bucket de storage.

**`estrutura_formatos`** (globais, gerenciados por admin)
- `id uuid pk`, `nome text not null`, `ordem int default 0`, `created_by uuid`, `created_at timestamptz`, `updated_at timestamptz`

**`estrutura_videos`** (vídeos dentro de cada formato)
- `id uuid pk`, `formato_id uuid fk → estrutura_formatos(id) on delete cascade`
- `titulo text` (opcional), `link_video text not null`, `imagem_url text` (URL pública do bucket)
- `views bigint default 0`, `transcricao text`
- `created_by uuid`, `created_at`, `updated_at`

**`estrutura_video_favoritos`** (por usuário)
- `user_id uuid not null`, `video_id uuid fk → estrutura_videos(id) on delete cascade`, `created_at`
- `primary key (user_id, video_id)`

**GRANTs + RLS:**
- Formatos e vídeos: `SELECT` para `authenticated` (todos leem); `INSERT/UPDATE/DELETE` só para `has_role(auth.uid(),'admin')`.
- Favoritos: `SELECT/INSERT/DELETE` do próprio usuário (`auth.uid() = user_id`).
- Trigger `update_updated_at_column` nas duas tabelas de conteúdo.

**Storage bucket** `estrutura-videos` (público) para as imagens/thumbnails que o admin sobe.

### 2. Hooks (`src/hooks/useEstruturaFormatos.ts`)

- `useEstruturaFormatos()` — lista formatos ordenados
- `useEstruturaVideos(formatoId)` — lista vídeos do formato + join com favoritos do usuário; ordena por `favorito desc, created_at desc`
- `useEstruturaFavoritos()` — set de video_ids favoritados
- Mutations: `useCreateFormato`, `useUpdateFormato`, `useDeleteFormato`, `useCreateVideo`, `useUpdateVideo`, `useDeleteVideo`, `useToggleFavorito`, `useUploadEstruturaImagem` (upload no bucket)

### 3. UI

**`RoteiroAnotacoesPanel.tsx`**: adicionar 4º chip "Estrutura" (mesma linha, mesmo estilo) que abre `EstruturaDialog` (não é campo de texto — é um dialog).

**`src/components/mentorados/EstruturaDialog.tsx`** (novo)
Layout inspirado no wireframe:
- Sidebar esquerda: lista vertical de formatos (chips arredondados). Admin vê botão "+ Novo formato" + editar/excluir no hover.
- Área direita: grid de cards de vídeo do formato selecionado. Cada card mostra: imagem (thumb), botão play (abre modal com iframe do vídeo), views, ícone estrela (favoritar), e botão "Copiar transcrição". Favoritos aparecem primeiro com badge.
- Admin: botão "+ Adicionar vídeo" no topo do grid; hover no card mostra editar/excluir.

**`EstruturaVideoFormDialog.tsx`** (novo, admin) — form com:
- Link do vídeo (text)
- Imagem (upload → bucket `estrutura-videos`, preview)
- Número de views (number)
- Transcrição (textarea grande)
- Título (opcional)

**`EstruturaFormatoFormDialog.tsx`** (novo, admin) — form simples: nome + ordem.

**`EstruturaVideoPlayerDialog.tsx`** (novo) — usa `getVideoEmbedUrl` de `src/lib/videoUtils.ts` (YouTube / Google Drive já suportados).

### 4. Cópia de transcrição
Botão "Copiar transcrição" usa `navigator.clipboard.writeText` + toast (`sonner`) igual padrão do `Prompts.tsx`.

### 5. Detalhes técnicos

- Fonte Poppins, labels dourados (`#B8860B`) para títulos de seção conforme padrão do projeto.
- Toasts top-right.
- Ordenação dos vídeos: `is_favorito desc, created_at desc` (favoritos do usuário atual primeiro).
- Admin detectado via `useUserRole() === "admin"`.
- Imagem no bucket armazenada como `{formato_id}/{video_id}.{ext}` para facilitar limpeza.

### Arquivos novos
- `supabase/migrations/*_estrutura.sql`
- `src/hooks/useEstruturaFormatos.ts`
- `src/components/mentorados/EstruturaDialog.tsx`
- `src/components/mentorados/EstruturaFormatoFormDialog.tsx`
- `src/components/mentorados/EstruturaVideoFormDialog.tsx`
- `src/components/mentorados/EstruturaVideoPlayerDialog.tsx`

### Arquivos editados
- `src/components/mentorados/RoteiroAnotacoesPanel.tsx` (novo chip "Estrutura")
