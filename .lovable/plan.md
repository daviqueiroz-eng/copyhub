

# Plan: Sistema Nativo de Gestão de Entregas (Calendário + Tabela)

Substituir o iframe externo por um sistema completo e nativo de gestão de entregas com duas visualizações sincronizadas.

---

## Etapa 1 — Banco de Dados (Migration)

Criar duas novas tabelas (a tabela `mentorados` já existe no projeto, mas o user quer um sistema separado para entregas com campos adicionais como `mentor`, `curso`, `cor`, `pausado`). Vou adicionar os campos que faltam à tabela `mentorados` existente e criar a tabela de entregas:

**Alterações na tabela `mentorados`** (adicionar colunas):
- `mentor` text
- `curso` text  
- `cor` text default '#3B82F6'
- `pausado` boolean default false

**Nova tabela `gestao_entregas`**:
- `id` uuid PK
- `mentorado_id` uuid FK → mentorados.id ON DELETE CASCADE
- `responsavel_id` uuid FK → profiles (user_id do responsável)
- `user_id` uuid NOT NULL (dono do registro, para RLS)
- `leva` integer
- `prazo` date NOT NULL
- `data_entrega` date
- `dias_uteis` integer default 10
- `status` text default 'Em andamento'
- `observacao` text
- `created_at` timestamptz

**RLS**: Usuário só vê/edita seus próprios dados (`user_id = auth.uid()`).

---

## Etapa 2 — Hooks de Dados

**`src/hooks/useGestaoEntregas.ts`**: Hook com queries e mutations para CRUD de entregas, incluindo joins com `mentorados` e `profiles`.

---

## Etapa 3 — Componente Calendário

**`src/components/mentorados/GestaoCalendarioView.tsx`**:
- FullCalendar com visão semana/mês
- Cards coloridos por mentorado (usando `cor` do mentorado)
- Drag and drop para mover entregas entre datas
- Detecção de conflitos (2 no mesmo dia = alerta leve, 3+ = alerta crítico)
- Overdue: destaque vermelho quando prazo < hoje e status != "Finalizado"
- Click no card: dialog para marcar como finalizado, definir data de entrega, gerar próxima entrega automaticamente

---

## Etapa 4 — Componente Tabela (Estilo Excel)

**`src/components/mentorados/GestaoTabelaView.tsx`**:
- Tabela com colunas: Copy, Mentorado, Mentor, Curso, Leva, Prazo, Data Entrega, Dias Úteis, Status, Pausado, Observação
- Edição inline: status (dropdown), prazo (date picker), observação
- Ordenação por prazo
- Busca por nome
- Filtros: por copy, status, mentor, período
- Regras automáticas visuais: atrasado = vermelho, próximo do prazo = amarelo, finalizado = opacidade reduzida
- Header fixo, hover leve, estilo Notion/Airtable

---

## Etapa 5 — Componente Principal com Toggle

**`src/components/mentorados/GestaoEntregasView.tsx`**:
- Toggle `[Calendário | Tabela]` no topo
- Botão "Exportar Planilha" (CSV/XLSX dos dados filtrados)
- Ambas as views compartilham o mesmo hook/dados
- Sincronização automática via React Query

---

## Etapa 6 — Integração na Página

**`src/pages/Mentorados.tsx`**:
- Substituir os dois iframes (mobile e desktop) pelo componente `GestaoEntregasView`

---

## Arquivos Criados/Modificados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar (alter mentorados + nova tabela gestao_entregas) |
| `src/hooks/useGestaoEntregas.ts` | Criar |
| `src/components/mentorados/GestaoCalendarioView.tsx` | Criar |
| `src/components/mentorados/GestaoTabelaView.tsx` | Criar |
| `src/components/mentorados/GestaoEntregasView.tsx` | Criar |
| `src/components/mentorados/GestaoEntregaDialog.tsx` | Criar |
| `src/pages/Mentorados.tsx` | Modificar (remover iframes) |

