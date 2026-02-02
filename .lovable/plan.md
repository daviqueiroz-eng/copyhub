
## Plano: Adicionar Aba Sprints em Atividades

### Resumo

Criar um novo modulo "Sprints" na pagina de Atividades (/modo-flow) seguindo o layout das imagens de referencia. O sistema permitira gerenciar iniciativas estrategicas com status Kanban (Backlog, Sprint, Finalizado), com tarefas vinculadas e acompanhamento de progresso.

---

### Estrutura do Banco de Dados

Serao criadas 2 novas tabelas:

**Tabela `sprints_iniciativas`**
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | Chave primaria |
| titulo | text | Nome da iniciativa (obrigatorio) |
| descricao | text | Descricao breve |
| criterio_conclusao | text | Como saber que foi concluido |
| dono_id | uuid | Referencia ao profiles.user_id |
| prazo_entrega | date | Data limite |
| impacto | text | "baixo", "medio", "alto" |
| status | text | "backlog", "sprint", "finalizado" |
| arquivada | boolean | Se a iniciativa esta arquivada |
| created_by | uuid | Quem criou |
| created_at | timestamp | Data de criacao |
| updated_at | timestamp | Data de atualizacao |

**Tabela `sprints_tarefas`**
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | Chave primaria |
| iniciativa_id | uuid | FK para sprints_iniciativas |
| texto | text | Descricao da tarefa |
| concluida | boolean | Se foi concluida |
| created_at | timestamp | Data de criacao |

---

### Layout Visual

**Aba Sprints na pagina de Atividades:**

```text
+----------------------------------------------------------+
| Atividades                                                |
+----------------------------------------------------------+
| [Pomodoro] [Notas] [Tarefas] [Atividades Gerais] [Sprints]|
+----------------------------------------------------------+
|                                                          |
|  [Arquivadas]                    [Todos v] [+ Nova Iniciativa]
|                                                          |
|  o Backlog (3)       o Sprint (0)        o Finalizado (0)|
|  +--------------+    +--------------+    +--------------+|
|  | Card 1       |    | Nenhuma      |    | Nenhuma      ||
|  | - Titulo     |    | iniciativa   |    | iniciativa   ||
|  | - Impacto    |    +--------------+    +--------------+|
|  | - Dono       |                                        |
|  | - Prazo      |                                        |
|  | [=====] 0%   |                                        |
|  +--------------+                                        |
|  | Card 2       |                                        |
|  +--------------+                                        |
+----------------------------------------------------------+
```

**Modal de Nova Iniciativa:**

```text
+----------------------------------+
| Criar Nova Iniciativa         X  |
+----------------------------------+
| Titulo *                         |
| [________________________]       |
|                                  |
| Descricao                        |
| [________________________]       |
| [________________________]       |
|                                  |
| Criterio de Conclusao            |
| [________________________]       |
|                                  |
| Dono *            | Impacto      |
| [Selecione v]     | [Medio v]    |
|                                  |
| Prazo de Entrega                 |
| [Selecione]                      |
|                                  |
| [Cancelar]  [Criar Iniciativa]   |
+----------------------------------+
```

**Modal de Detalhes da Iniciativa:**

```text
+------------------------------------------+
| Titulo da Iniciativa                  X  |
| [Nao iniciada] [Alto]                    |
| Dono: Nome | Prazo: 09/02/2026           |
+------------------------------------------+
| Descricao                                |
| Texto da descricao aqui...               |
|                                          |
| Progresso                         0%     |
| [==============================]         |
|                                          |
| Criterio de conclusao                    |
| Texto do criterio aqui...                |
|                                          |
| Tarefas (0/2)                            |
| o Tarefa X                               |
| o Tarefa Y                               |
|                                          |
| [Nova tarefa...] [+ Adicionar]           |
+------------------------------------------+
```

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/flow/SprintsBoard.tsx` | Componente principal com Kanban |
| `src/components/flow/SprintIniciativaCard.tsx` | Card da iniciativa |
| `src/components/flow/SprintIniciativaDialog.tsx` | Modal de criar/editar |
| `src/components/flow/SprintDetalheDialog.tsx` | Modal de detalhes com tarefas |
| `src/hooks/useSprints.ts` | Hooks para CRUD de iniciativas e tarefas |

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Atividades.tsx` | Adicionar aba "Sprints" com icone Target |

---

### Detalhes de Implementacao

#### 1. Migracao do Banco

```sql
-- Tabela de Iniciativas
CREATE TABLE sprints_iniciativas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  criterio_conclusao text,
  dono_id uuid REFERENCES profiles(user_id),
  prazo_entrega date,
  impacto text DEFAULT 'medio' CHECK (impacto IN ('baixo', 'medio', 'alto')),
  status text DEFAULT 'backlog' CHECK (status IN ('backlog', 'sprint', 'finalizado')),
  arquivada boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Tarefas
CREATE TABLE sprints_tarefas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  iniciativa_id uuid REFERENCES sprints_iniciativas(id) ON DELETE CASCADE,
  texto text NOT NULL,
  concluida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE sprints_iniciativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints_tarefas ENABLE ROW LEVEL SECURITY;

-- Politicas: usuarios autenticados podem ver e manipular
CREATE POLICY "Users can view iniciativas" ON sprints_iniciativas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert iniciativas" ON sprints_iniciativas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update iniciativas" ON sprints_iniciativas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete iniciativas" ON sprints_iniciativas
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can view tarefas" ON sprints_tarefas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage tarefas" ON sprints_tarefas
  FOR ALL TO authenticated USING (true);
```

#### 2. Hook useSprints

```typescript
// Queries
- useSprintsIniciativas(arquivadas?: boolean) - lista iniciativas
- useSprintsTarefas(iniciativaId: string) - lista tarefas

// Mutations
- useCreateIniciativa()
- useUpdateIniciativa()
- useDeleteIniciativa()
- useCreateTarefa()
- useUpdateTarefa()
- useDeleteTarefa()
```

#### 3. Componente SprintsBoard

- Kanban com 3 colunas usando dnd-kit (mesmo padrao do KanbanBoard.tsx)
- Filtro "Arquivadas" para ver iniciativas arquivadas
- Filtro de Dono com todos os usuarios
- Botao "+ Nova Iniciativa"
- Arraste entre colunas para mudar status

#### 4. Card da Iniciativa

Cada card exibe:
- Titulo
- Badge de Impacto (Baixo = cinza, Medio = amarelo, Alto = vermelho)
- Icone de pessoa + nome do dono
- Icone de calendario + prazo formatado
- Barra de progresso (tarefas concluidas / total)

#### 5. Cores e Estilos

Seguindo o estilo atual do projeto:
- Colunas com fundo sutil (bg-muted/30)
- Cards com borda arredondada e sombra
- Badges seguindo o padrao ja existente
- Cores dos indicadores de status nas colunas

---

### Fluxo de Uso

1. Usuario acessa Atividades > Sprints
2. Ve o Kanban com iniciativas distribuidas
3. Clica em "+ Nova Iniciativa" para criar
4. Preenche titulo, descricao, criterio, dono, prazo, impacto
5. Iniciativa aparece no Backlog
6. Arrasta para Sprint quando for iniciar
7. Clica no card para ver detalhes e adicionar tarefas
8. Marca tarefas como concluidas
9. Quando todas tarefas estiverem concluidas, arrasta para Finalizado
10. Pode arquivar iniciativas finalizadas

---

### Permissoes

- Qualquer usuario autenticado pode:
  - Ver todas as iniciativas
  - Criar novas iniciativas
  - Editar iniciativas (arrastar, atualizar)
  - Adicionar/marcar tarefas

- Apenas o criador pode:
  - Deletar a iniciativa

---

### Proximos Passos Apos Implementacao

1. Testar o fluxo completo de criacao de iniciativas
2. Verificar drag and drop entre colunas
3. Testar adicao e conclusao de tarefas
4. Verificar calculo de progresso
