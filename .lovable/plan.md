

## Plano: Restaurar Exibicao das Sugestoes de Headlines (MentoradoHeadlinesList)

### Problema Identificado

O componente `MentoradoHeadlinesList` foi removido da renderizacao do `MentoradoRoteirosView.tsx`. 
O comentario na linha 62 diz: "MentoradoHeadlinesList removido - seleção agora é feita diretamente nos campos de headline"

**Resultado:**
- Quando voce usa `/m` para registrar uma headline, ela e salva no banco (`headlines_criadas`)
- Porem NAO existe mais nenhum lugar na interface onde essas headlines sao exibidas
- A secao "Ideias de Headlines" simplesmente sumiu

---

### Solucao

Restaurar a importacao e renderizacao do `MentoradoHeadlinesList` no `MentoradoRoteirosView.tsx`.

---

### Onde Deve Aparecer

Existem duas opcoes de posicionamento:

**Opcao 1 - Sidebar (ao lado do checklist):**
Adicionar abaixo do RoteiroChecklist, na barra lateral direita

**Opcao 2 - Acima dos roteiros:**
Mostrar a lista de headlines sugeridas logo antes da lista de roteiros, para facilitar copiar/usar

---

### Posicionamento Recomendado

Baseado na memoria do sistema e no fluxo de trabalho, a opcao mais pratica e colocar as sugestoes de headlines **abaixo do checklist lateral**, assim o usuario pode ver as ideias enquanto trabalha nos roteiros.

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Restaurar import e adicionar renderizacao do MentoradoHeadlinesList |

---

### Detalhes Tecnicos

#### 1. Restaurar Import

```typescript
// Linha 62 - descomentar/restaurar
import { MentoradoHeadlinesList } from "./MentoradoHeadlinesList";
```

#### 2. Adicionar Renderizacao

Inserir o componente na sidebar, abaixo do RoteiroChecklist:

```tsx
{/* Na sidebar direita, após o RoteiroChecklist */}
<MentoradoHeadlinesList 
  mentoradoId={mentoradoId}
/>
```

O componente ja existe e funciona:
- Busca headlines da tabela `headlines_criadas` filtradas por `mentorado_id`
- Mostra com cabecalho "Ideias de Headlines (N)"
- Permite copiar e excluir headlines
- So aparece se houver headlines para o mentorado

---

### Layout Final

```text
+------------------------------------------+-------------------+
| ROTEIROS                                 | Checklist         |
| +--------------------------------------+ | [ ] Headlines     |
| | HEADLINE 01:                         | | [ ] Roteiros      |
| | ...                                  | | [ ] Revisar       |
| | ESTRUTURA 01:                        | | ...               |
| | ...                                  | |                   |
| +--------------------------------------+ |-------------------|
|                                          | Ideias de         |
|                                          | Headlines (3)     |
|                                          | +-----------------+
|                                          | | headline 1    X |
|                                          | | headline 2    X |
|                                          | | headline 3    X |
|                                          | +-----------------+
+------------------------------------------+-------------------+
```

---

### Consideracoes

- O componente `MentoradoHeadlinesList` ja existe e esta funcional
- Apenas precisa ser re-adicionado ao render da view
- Nao requer mudancas no banco de dados ou hooks
- O `/m` continua funcionando normalmente para registrar novas headlines

