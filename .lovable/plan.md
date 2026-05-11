## Atualizações da página Virais

### 1. Admin pode apagar virais
- **Banco**: adicionar política RLS de `DELETE` na tabela `virais` permitindo somente quem tem `has_role(auth.uid(), 'admin')`. Nenhum dado existente é apagado.
- **UI (`ViraisTable.tsx`)**: para usuários admin, na coluna de ações (atualmente mostra ícone de cadeado para virais de outros), exibir um botão de lixeira ao lado/no lugar do cadeado. Clique abre `AlertDialog` de confirmação ("Apagar este viral? Essa ação não pode ser desfeita.") e chama um novo `useDeleteViral()` em `useVirais.ts`.
- O autor continua vendo o lápis para editar; o admin vê lápis (se for autor) + lixeira; usuários comuns continuam vendo só o cadeado em virais de terceiros.

### 2. Filtro/coluna "Perfil"
- **Banco**: adicionar coluna `perfil_id uuid` (nullable) em `virais` com FK para `perfis_referencia(id)` `ON DELETE SET NULL`. Index em `perfil_id`. Nada existente perdido.
- **Hook `useVirais.ts`**:
  - Adicionar `perfil_id` em `Viral`, `NewViralInput`, e em `ViralFilters` (`perfilIds?: string[]`).
  - Query: select com join `perfis_referencia(id, nome)`; mapear `perfil_nome`.
  - Aplicar filtro `.in("perfil_id", perfilIds)` quando informado.
- **`ViraisFiltersBar.tsx`**: ao lado do popover "Nicho", adicionar popover "Perfil" usando `usePerfisReferencia()`. Mesmo padrão visual do nicho (multi-select com chips). Botão "+" abre input para criar novo perfil chamando `useCreatePerfilReferencia` (campos mínimos: nome + link; nicho herdado do filtro selecionado se houver, ou null).
- **`ViraisTable.tsx`**: adicionar coluna "Perfil" exibindo `perfil_nome` (ou "—").

### 3. Auto-preenchimento ao "Registrar mais um viral"
- **`ViralRegistrarDialog.tsx`**: ao clicar em "+ Registrar mais um viral", o novo bloco copia `nicho_id` e `perfil_id` do bloco anterior (último da lista). Demais campos ficam vazios.
- Adicionar campo "Perfil" em cada bloco (mesmo padrão de Select + botão de criar novo, igual ao filtro). Persiste `perfil_id` no insert.

### 4. Toggle "Esse mês"
- **`ViraisFiltersBar.tsx`**: ao lado do switch "Meus virais", adicionar switch "Esse mês".
- Quando ativo, define `dataInicio` = primeiro dia do mês atual 00:00 e `dataFim` = agora (e desabilita visualmente os inputs De/Até). Ao desativar, limpa `dataInicio`/`dataFim`.
- Como já usa os filtros de data existentes, não há mudança no hook.

### Garantia de dados
- Nenhuma operação destrutiva nos dados existentes: as duas mudanças de schema são `ADD COLUMN` (nullable) e `CREATE POLICY`. A deleção só ocorre quando o admin clicar e confirmar.

### Detalhes técnicos
- Migration:
  - `ALTER TABLE public.virais ADD COLUMN perfil_id uuid REFERENCES public.perfis_referencia(id) ON DELETE SET NULL;`
  - `CREATE INDEX idx_virais_perfil_id ON public.virais(perfil_id);`
  - `CREATE POLICY "Admins podem apagar virais" ON public.virais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));`
- `useDeleteViral` invalida `["virais"]` e mostra toast.
- Toggle "Esse mês" calcula:
  ```ts
  const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
  ```
