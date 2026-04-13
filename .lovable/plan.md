

## Plano: Acesso direto ao Roteiro + Perfil integrado + Checklist por headline

### 1. Clicar no mentorado abre direto o Roteiro

Em `Mentorados.tsx`, alterar `handleOpenDetail` para que em vez de abrir o Sheet de detalhes, abra direto a `MentoradoRoteirosView`:

```
const handleOpenDetail = (mentorado: Mentorado) => {
  setSelectedMentorado(mentorado);
  setIsRoteirosViewOpen(true); // Direto para roteiros
};
```

O Sheet de detalhes continua existindo mas só será acessado de dentro do roteiro.

### 2. Mover informações do perfil para dentro do Roteiro

Em `MentoradoRoteirosView.tsx`, na sidebar esquerda, **acima** da seção "Atalhos", adicionar uma seção colapsável "Perfil" que contém:
- Plano, Instagram, TikTok, Trello (campos editáveis compactos)
- Mapa do Avatar (usando `MapaAvatarSection`)
- Abas Comunicação e Materiais (compactas, em accordions)

Para isso, o componente precisa receber ou buscar os dados do mentorado atual (já tem acesso via `useMentorados` e `mentoradoId`). As alterações serão salvas via `useUpdateMentorado`.

Isso substitui completamente o Sheet de detalhes — o perfil fica acessível dentro do fluxo de roteiro.

### 3. Checklist editável por headline (admin-configurable)

**Tabela nova no banco:** `headline_checklist_items`
- `id` (uuid), `user_id` (uuid, quem criou — o admin), `label` (text), `ordem` (int), `ativo` (bool), `created_at`
- RLS: todos autenticados podem SELECT; somente admins podem INSERT/UPDATE/DELETE (via `has_role`)

**Tabela nova:** `headline_checklist_progress`
- `id` (uuid), `mentorado_id` (uuid), `guia_numero` (int), `ordem_roteiro` (int), `checklist_item_id` (uuid ref headline_checklist_items), `checked` (bool), `user_id` (uuid), `created_at`
- Unique constraint: `(mentorado_id, guia_numero, ordem_roteiro, checklist_item_id)`
- RLS: autenticados podem SELECT/INSERT/UPDATE seus próprios registros

**UI — ao lado de cada headline:**
- Renderizar checkboxes compactos ao lado do "HEADLINE 01:" baseados nos itens de `headline_checklist_items`
- Incluir um checkbox "Marcar todos" que marca/desmarca todos de uma vez
- O estado é persistido em `headline_checklist_progress` por mentorado/guia/ordem

**UI — configuração (admin):**
- Botão de configuração visível apenas para admin, abrindo um dialog para CRUD dos itens do checklist (similar ao `CheckRoteiroViralDialog`)

### Arquivos a modificar/criar

1. `src/pages/Mentorados.tsx` — redirecionar clique para roteiro
2. `src/components/mentorados/MentoradoRoteirosView.tsx` — adicionar perfil na sidebar, adicionar checklist por headline
3. **Novo:** `src/components/mentorados/HeadlineChecklistConfig.tsx` — dialog admin para configurar itens
4. **Novo:** `src/hooks/useHeadlineChecklist.ts` — hooks para buscar itens e progresso
5. **Migration SQL** — criar tabelas `headline_checklist_items` e `headline_checklist_progress`

