

## Plano: Registrar Termos Virais + Banco de Termos (/t)

### Contexto

Hoje, ao selecionar texto na headline, aparece apenas o botão "Ajustar" (IA). O pedido é adicionar um botão "Registrar" que salva a palavra selecionada como **termo viral** associado a um nicho e número de views. Além disso, o comando `/t` deve abrir um banco pesquisável de todos os termos virais registrados.

### 1. Nova tabela: `termos_virais`

```sql
CREATE TABLE public.termos_virais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termo text NOT NULL,
  nicho_id uuid REFERENCES public.nichos(id) ON DELETE SET NULL,
  views text DEFAULT '',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.termos_virais ENABLE ROW LEVEL SECURITY;
-- Todos autenticados podem ler e inserir
CREATE POLICY "select_termos" ON public.termos_virais FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_termos" ON public.termos_virais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "delete_termos" ON public.termos_virais FOR DELETE TO authenticated USING (true);
```

### 2. Hook: `useTermosVirais.ts`

- `useTermosVirais()` — busca todos os termos com join no nicho (nome)
- `useCreateTermoViral()` — insere termo com nicho_id, views, user_id
- `useDeleteTermoViral()` — deleta termo por id

### 3. Botão "Registrar" no floating adjust

No `MentoradoRoteirosView.tsx`, ao lado do botão "Ajustar" que já aparece ao selecionar texto na headline:
- Adicionar botão **"Registrar"**
- Ao clicar, abre um mini-dialog/popover pedindo:
  - **Nicho** (select com os nichos existentes + opção "+ Novo nicho" inline)
  - **Número de views** (input text)
- Ao confirmar, salva na tabela `termos_virais` e fecha

A seleção de texto precisa funcionar **sem** a flag `iaEnabled` — o botão "Registrar" aparece sempre que há texto selecionado na headline, independente do IA estar ativo.

### 4. Comando `/t` — Banco de Termos Virais

Em `MentoradoRoteirosView.tsx`, no handler de slash commands:
- Detectar `/t` e abrir o `SlashCommandPopover` no mode `"termos_virais"`
- Limpar o `/t` do texto

No `SlashCommandPopover.tsx`:
- Adicionar renderização para mode `"termos_virais"`
- Listar termos agrupados por nicho (como nas imagens: header com nome do nicho, lista de termos abaixo)
- Campo de busca para filtrar termos
- Scroll para navegar
- Ao clicar num termo, inseri-lo no campo (via `onSelectItem`)

### Arquivos a criar/modificar

1. **Migration SQL** — criar tabela `termos_virais`
2. **Novo:** `src/hooks/useTermosVirais.ts`
3. **Editar:** `src/components/mentorados/MentoradoRoteirosView.tsx` — botão Registrar no floating, handler `/t`, passar termos ao SlashCommandPopover
4. **Editar:** `src/components/mentorados/SlashCommandPopover.tsx` — renderizar mode `termos_virais`

