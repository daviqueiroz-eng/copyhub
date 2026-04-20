

## Plano: Cronômetro removido + Anotações por roteiro + Adjetivos Poderosos

### Parte 1 — Editor de Roteiros

#### 1.1 Remover Cronômetro do espaço do editor
- No painel direito (`MentoradoRoteirosView`), o bloco que hoje renderiza `RoteiroChecklist` (com timers) será **removido da visualização padrão**.
- O Cronômetro **continua existindo** (não vamos apagar a feature), mas só aparece quando o usuário clicar no botão dedicado já existente para abrir o checklist como sheet (mobile) ou via toggle. O painel lateral direito passa a ser usado para outra coisa (item 1.2).
- Resultado: mais espaço horizontal para o editor central.

#### 1.2 Caixa de anotações por roteiro (4 seções colapsáveis)
Ao lado direito de **cada par HEADLINE + ESTRUTURA** será adicionado um painel com **4 seções sempre fechadas por padrão**:
- **Referência (texto)**
- **Notas**
- **Estudos**
- **Comentário**

Cada seção:
- Mostra o título com chevron `>` (fechado) / `v` (aberto)
- Ao clicar abre uma `Textarea` autogrow para escrever
- Salva automaticamente com debounce (~800ms)
- **Persistente**: a informação nunca some, fica vinculada ao `roteiro.id`

Layout: dentro do container do roteiro (linha 2785 `flex-1 min-w-0`), criar um wrapper flex com o conteúdo principal ocupando ~70% e o painel de anotações ~30% (em desktop). No mobile: empilha abaixo, também colapsado por padrão.

#### 1.3 Persistência (banco)
Nova tabela `mentorados_roteiros_anotacoes`:
- `id` uuid PK
- `roteiro_id` uuid FK → `mentorados_roteiros(id)` ON DELETE CASCADE
- `user_id` uuid
- `referencia_texto` text
- `notas` text
- `estudos` text
- `comentario` text
- `created_at`, `updated_at`
- UNIQUE(`roteiro_id`)
- RLS: usuário só lê/escreve as suas
- Realtime habilitado (mesmo padrão dos roteiros)

Novo hook `useRoteiroAnotacoes.ts`:
- `useRoteiroAnotacoes(roteiroId)` → busca/cria a linha
- `useUpsertRoteiroAnotacao()` → salva campo a campo com debounce

### Parte 2 — Adjetivos Poderosos (ao lado de Perfis Referência)

#### 2.1 Layout
No popover do `/t` (Termos Virais), hoje dividido em 2 colunas (Termos Virais | Perfis Referência), passa a ter **3 colunas**:
1. Banco de Termos Virais
2. Perfis Referência
3. **Adjetivos Poderosos** (novo)

Largura do popover ajustada de `700px` para `~960px` em desktop. No mobile continua empilhando.

#### 2.2 Funcionalidade da nova coluna
- Cabeçalho: "Adjetivos Poderosos (N)" + botão `+` para adicionar
- Filtro com select: **Positivo** / **Negativo** (sem filtro = "Todos")
- Lista vertical de adjetivos do tipo selecionado
- Cada item: clique no texto insere o adjetivo no campo onde o `/t` foi disparado; ícone `×` ao lado para deletar
- Form inline para adicionar: input de texto + select Positivo/Negativo + botão salvar
- **Compartilhado globalmente**: qualquer usuário vê e edita (igual perfis_referencia hoje)

#### 2.3 Persistência (banco)
Nova tabela `adjetivos_poderosos`:
- `id` uuid PK
- `texto` text NOT NULL
- `tipo` text NOT NULL CHECK (`tipo` IN ('positivo','negativo'))
- `user_id` uuid (autor, para auditoria)
- `created_at`
- RLS: SELECT/INSERT/DELETE liberados para todos os autenticados (mesmo padrão de `perfis_referencia`)

Novo hook `useAdjetivosPoderosos.ts` com:
- `useAdjetivosPoderosos()` → lista todos
- `useCreateAdjetivoPoderoso()`
- `useDeleteAdjetivoPoderoso()`

### Arquivos modificados / criados

**Banco (migrations)**
- Criar `mentorados_roteiros_anotacoes` + RLS + realtime
- Criar `adjetivos_poderosos` + RLS

**Novos arquivos**
- `src/hooks/useRoteiroAnotacoes.ts`
- `src/hooks/useAdjetivosPoderosos.ts`
- `src/components/mentorados/RoteiroAnotacoesPanel.tsx` (4 seções colapsáveis)

**Atualizados**
- `src/components/mentorados/MentoradoRoteirosView.tsx` — remover painel de cronômetro do layout direito padrão; envolver o conteúdo de cada roteiro num flex com o novo `RoteiroAnotacoesPanel` à direita
- `src/components/mentorados/SlashCommandPopover.tsx` — adicionar 3ª coluna "Adjetivos Poderosos" + ajustar largura do popover

### Resultado esperado
- Editor com mais espaço (sem painel de cronômetro fixo)
- Cada roteiro com 4 seções colapsáveis para anotações persistentes
- Popover `/t` mostra Termos Virais | Perfis Referência | Adjetivos Poderosos lado a lado
- Adjetivos compartilhados entre todos os usuários, com filtro Positivo/Negativo

