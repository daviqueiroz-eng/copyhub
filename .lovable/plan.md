

## Plano: Aba "Controle" com Drag-and-Drop de Mentorados no Calendario

### Resumo

Adicionar uma nova aba **"Controle"** (como primeira opcao no toggle de visualizacao, antes de Grid e Calendario) na Ordem de Prioridade. Layout split-screen:
- **Esquerda**: Lista dos mentorados cadastrados (arrastavel)  
- **Direita**: Calendario semanal/mensal onde voce solta o mentorado numa data

Ao clicar num mentorado ja posicionado no calendario, abre um dialog para configurar:
- Quantidade de dias uteis (10, 15, etc.)
- Data prevista de entrega (calculada automaticamente)
- Data real de entrega
- Botao "Proximo" que avanca para a proxima leva com a data pre-calculada

---

### Nova Tabela no Banco de Dados

**`controle_levas`** - armazena cada leva de cada mentorado com suas datas:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | ID unico |
| user_id | uuid | Dono do controle |
| mentorado_id | uuid (FK mentorados) | Referencia ao mentorado |
| numero_leva | integer | Numero da leva (1, 2, 3...) |
| data_inicio | date | Data onde o mentorado foi "dropado" no calendario |
| dias_uteis | integer | Quantidade de dias uteis configurados (10, 15...) |
| data_prevista | date | Calculada: data_inicio + dias_uteis (uteis) |
| data_real | date | Data real de entrega (preenchida manualmente) |
| concluida | boolean | Se a leva foi finalizada |
| created_at | timestamptz | Data de criacao |

RLS: usuarios autenticados podem CRUD nas suas proprias linhas (`user_id = auth.uid()`).

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/mentorados/ControleView.tsx` | Componente principal com layout split (lista + calendario) |
| `src/components/mentorados/ControleLevaDialog.tsx` | Dialog ao clicar num mentorado no calendario (config dias uteis, datas, proximo) |
| `src/hooks/useControleLevas.ts` | Hook CRUD para a tabela `controle_levas` |

### Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/mentorados/OrdemPrioridadeView.tsx` | Adicionar "Controle" ao toggle de viewMode (primeiro item) |

---

### Detalhes de Implementacao

**1. OrdemPrioridadeView.tsx - Novo ViewMode**

Alterar o tipo `ViewMode` para incluir "controle":
```typescript
type ViewMode = "controle" | "grid" | "calendar";
```

Adicionar ao ToggleGroup um item "Controle" como primeiro botao. E no render condicional, renderizar `<ControleView mentorados={mentorados} />` quando `viewMode === "controle"`.

A prop `mentorados` vira da lista de mentorados do usuario (importar `useMentorados`).

**2. ControleView.tsx - Layout Principal**

```text
+---------------------------+-------------------------------------------+
| Clientes           (7)    |  Fevereiro 2026   < Hoje >  [Semana|Mes] |
|                           |                                           |
| [Breno Frota         ]    |  SEG  TER  QUA  QUI  SEX  SAB  DOM       |
| Core Experience 3.0       |   9    10   11   12   13   14   15        |
| Davi                       |  [Breno]                                  |
|                           |       [Ednaldo]                           |
| [Ednaldo Henper      ]    |                                           |
| Core Experience 3.0       |                                           |
|                           |                                           |
| [Janio Cedalino      ]    |                                           |
+---------------------------+-------------------------------------------+
```

- Esquerda: Card com titulo "Clientes" + badge com contagem. Lista dos mentorados com nome, plano e copywriter ("Davi" = usuario logado). Cada card e arrastavel (`draggable`).
- Direita: Calendario FullCalendar (semana/mes) com suporte a `drop` externo. Ao soltar um mentorado, cria uma entrada na `controle_levas` com `numero_leva = 1` e a `data_inicio` = data onde foi solto.

Usar `@dnd-kit` ou FullCalendar `externalDrag` (ja temos `interactionPlugin`). FullCalendar ja suporta drop externo via `droppable: true` e `eventReceive`.

**3. ControleLevaDialog.tsx - Configuracao ao Clicar**

Ao clicar num evento no calendario, abre dialog mostrando:
- Nome do mentorado, plano, leva atual (ex: "Leva 1/9")
- Prazo Maximo (badge vermelho)
- Campo "Prazo Interno (Copy)" com datepicker
- Selector de dias uteis: botoes rapidos [10] [15] [20] [Customizado]
- Data prevista calculada automaticamente (data_inicio + dias_uteis)
- Campo data real (preenchido quando entregue)
- Tarefas da leva (checklist: Fazer Headlines, Fazer Roteiros, Revisar Roteiros)
- Botao **"Proximo"** que marca a leva como concluida e cria automaticamente a proxima leva com `data_inicio` = data_prevista da leva atual

**4. useControleLevas.ts - Hook**

- `useControleLevas(mentoradoId?)` - busca levas
- `useCreateControleLeva()` - cria nova leva (ao dropar no calendario)
- `useUpdateControleLeva()` - atualiza dias_uteis, data_real, concluida
- `useDeleteControleLeva()` - remove leva

Calculo de data prevista usa a funcao `addBusinessDays` ja existente em `src/lib/dateUtils.ts`.

---

### Fluxo do Usuario

1. Usuario abre "Ordem de Prioridade" e seleciona aba **Controle**
2. Ve seus mentorados a esquerda, calendario vazio a direita
3. Arrasta "Breno Frota" e solta na quarta-feira dia 12
4. Calendario mostra evento "Breno Frota" no dia 12
5. Clica no evento -> dialog abre
6. Seleciona "10 dias uteis" -> data prevista calcula automaticamente (26/02)
7. Quando terminar a leva, clica **"Proximo"**
8. Leva 1 e marcada como concluida, Leva 2 e criada automaticamente comecando no dia 26/02
9. O evento da Leva 2 aparece no calendario

---

### Resultado Visual

O toggle de visualizacao fica com 3 opcoes:

```text
[Controle] [Grid] [Calendario]
```

"Controle" como primeiro item e selecionado por padrao.

