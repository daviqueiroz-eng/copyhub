

## Plano: Perfis Referência ao lado de Termos Virais

### O que muda

Quando abrir "Termos Virais" (atalho `/t` ou clique), a view se divide em duas colunas lado a lado:
- **Esquerda**: Banco de Termos Virais (como está hoje)
- **Direita**: Nova seção "Perfis Referência"

### Perfis Referência — funcionalidades

Cada perfil mostra um card com:
- Nome do perfil
- Número de inscritos
- Link (clique abre em nova guia)
- Botão de favoritar (estrela)
- Filtro por nicho (mesmo sistema de nichos dos termos virais)

### Alterações técnicas

#### 1. Nova tabela `perfis_referencia`
```sql
CREATE TABLE public.perfis_referencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  inscritos TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  nicho_id UUID REFERENCES public.nichos(id) ON DELETE SET NULL,
  favorito BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.perfis_referencia ENABLE ROW LEVEL SECURITY;
-- RLS: usuários autenticados podem CRUD seus próprios registros
CREATE POLICY "Users manage own perfis" ON public.perfis_referencia
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

#### 2. Novo hook `src/hooks/usePerfisReferencia.ts`
- `usePerfisReferencia()` — query com join em nichos para pegar nome do nicho
- `useCreatePerfilReferencia()` — insert
- `useUpdatePerfilReferencia()` — update (favoritar, editar)
- `useDeletePerfilReferencia()` — delete

#### 3. Ampliar o popover `SlashCommandPopover.tsx`
- Quando `internalMode === "termos_virais"`, o popover fica mais largo (~600px) com layout `flex` em duas colunas
- **Coluna esquerda**: `renderTermosVirais()` existente
- **Coluna direita**: nova `renderPerfisReferencia()` com:
  - Header "Perfis Referência" + botão "+"
  - Filtro por nicho (mesmo select)
  - Lista de cards com nome, inscritos, ícone de estrela (favorito), e ícone de link externo
  - Clique no card abre `window.open(link, '_blank')`
  - Dialog inline para adicionar perfil (nome, inscritos, link, nicho)

#### 4. Arquivos modificados
- **Nova migration** — tabela `perfis_referencia`
- **Novo arquivo**: `src/hooks/usePerfisReferencia.ts`
- **Atualizado**: `src/components/mentorados/SlashCommandPopover.tsx` — layout split + renderPerfisReferencia

