

## Plano: Melhorias nos Termos Virais e Nichos

### Problemas identificados

1. **Scroll não funciona** no popover `/t` — o `ScrollArea` com `max-h-[350px]` não está recebendo altura fixa suficiente para ativar o scroll dentro do container `max-h-[80vh]`.
2. **Termo duplicado** — nenhuma validação existe ao registrar um termo que já existe no mesmo nicho.
3. **Nicho duplicado** — nenhuma validação ao criar nicho com nome já existente.
4. **Mover termo de nicho** — não existe funcionalidade para alterar o `nicho_id` de um termo.
5. **Apagar nicho** — precisa verificar se há termos vinculados e exigir que sejam movidos antes.

---

### Alterações

#### 1. Corrigir scroll no `/t` (SlashCommandPopover.tsx)
- Substituir `<ScrollArea className="max-h-[350px]">` por uma `div` com `overflow-y-auto` e `max-h-[300px]` no `renderTermosVirais`.
- O `ScrollArea` do Radix às vezes não funciona bem dentro de containers com `overflow-hidden` + `flex`. Uma `div` nativa resolve.

#### 2. Validar termo duplicado no mesmo nicho (MentoradoRoteirosView.tsx)
- No dialog "Registrar Termo Viral", antes de salvar:
  - Buscar na lista de `termosVirais` (já carregada via `useTermosVirais`) se existe um termo com mesmo `termo.toLowerCase()` e mesmo `nicho_id`.
  - Se existir, mostrar toast de erro "Este termo já está registrado neste nicho" e não salvar.
- Precisa importar `useTermosVirais` no componente (já existe `useCreateTermoViral`, basta adicionar a query).

#### 3. Validar nicho duplicado (MentoradoRoteirosView.tsx)
- Ao clicar para criar novo nicho dentro do dialog de registro:
  - Verificar se `nichos` já contém um com `nome.toLowerCase()` igual.
  - Se sim, toast "Este nicho já existe" e não criar.

#### 4. Hook para atualizar termo viral (useTermosVirais.ts)
- Adicionar `useUpdateTermoViral` — mutation que faz `supabase.from("termos_virais").update({ nicho_id }).eq("id", id)`.
- Exportar o hook.

#### 5. Mover termo para outro nicho + Apagar nicho (SlashCommandPopover.tsx)
- Nos itens do `renderTermosVirais`, adicionar ações ao hover:
  - Botão para **mover** (abre um mini-select de nicho inline) usando `useUpdateTermoViral`.
  - Botão para **excluir** o termo usando `useDeleteTermoViral`.
- Adicionar um botão "Gerenciar nichos" no header do banco de termos que abre opções:
  - **Apagar nicho**: verifica se há termos vinculados. Se houver, mostra toast "Mova os termos deste nicho antes de apagá-lo". Se não houver, executa `useDeleteNicho`.

#### 6. Arquivos modificados
- `src/hooks/useTermosVirais.ts` — adicionar `useUpdateTermoViral`
- `src/components/mentorados/SlashCommandPopover.tsx` — corrigir scroll, adicionar ações de mover/excluir termo, gerenciar nichos
- `src/components/mentorados/MentoradoRoteirosView.tsx` — validação de duplicados (termo e nicho), importar `useTermosVirais` query

