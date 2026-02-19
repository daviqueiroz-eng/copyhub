

## Plano: Bloco de Notas Flutuante no Roteiro (estilo Docs)

### Resumo

Adicionar um botao redondo flutuante com icone de livro dentro da tela de Roteiros. Ao clicar, abre um painel flutuante estilo Apple Notes/Google Docs que:
- E arrastavel (posicao livre na tela)
- E redimensionavel
- Mostra as notas do mentorado atual
- Permite trocar entre mentorados sem sair do roteiro
- Permite copiar conteudo das notas para o roteiro
- Minimiza ao clicar no X (nao fecha/destroi)

---

### Nova Tabela no Banco de Dados

**`mentorado_notas`** - notas por mentorado, vinculadas ao usuario

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | ID unico |
| user_id | uuid | Dono da nota |
| mentorado_id | uuid (FK mentorados) | Mentorado associado |
| conteudo | text | Conteudo livre da nota |
| created_at | timestamptz | Criacao |
| updated_at | timestamptz | Ultima atualizacao |

RLS: usuarios autenticados fazem CRUD nas suas proprias linhas (`user_id = auth.uid()`). Um registro por mentorado por usuario (upsert por `user_id + mentorado_id`).

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useMentoradoNotas.ts` | Hook CRUD para `mentorado_notas` (fetch, upsert, delete) |
| `src/components/mentorados/FloatingNotesPanel.tsx` | Painel flutuante arrastavel e redimensionavel com editor de notas |

### Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar botao flutuante e renderizar o FloatingNotesPanel |

---

### Detalhes de Implementacao

**1. FloatingNotesPanel.tsx - Painel flutuante**

- **Botao flutuante**: Circulo com icone `BookOpen` (lucide), posicao fixa no canto inferior direito, z-index alto
- **Painel aberto**: Container com position fixed, arrastavel via barra de titulo (mousedown/mousemove), redimensionavel via handle no canto inferior direito
- **Layout interno**:
  - Barra de titulo com nome do mentorado atual, seletor de mentorados (dropdown), botao copiar e botao X (minimiza)
  - Area de texto (textarea) com auto-save (debounce 1.5s), estilo limpo como Apple Notes
  - Sidebar lateral esquerda com lista de mentorados (pastas), similar a imagem de referencia
- **Sidebar de mentorados**: Lista vertical com nome e preview do conteudo, ao clicar troca para as notas daquele mentorado
- **Botao copiar**: Copia todo o conteudo da nota para o clipboard
- **X**: Apenas minimiza (seta `isOpen = false`), nao destroi o componente
- **Redimensionamento**: Handle no canto inferior direito com cursor `nwse-resize`, min-width 400px, min-height 300px

**2. useMentoradoNotas.ts - Hook**

- `useMentoradoNota(mentoradoId)` - busca nota do mentorado
- `useUpsertMentoradoNota()` - cria ou atualiza nota (upsert por user_id + mentorado_id)
- Auto-save com debounce no componente

**3. MentoradoRoteirosView.tsx - Integracao**

- Importar e renderizar `FloatingNotesPanel` passando:
  - `mentoradoId` atual
  - `mentoradoNome` atual
  - Lista de `mentorados` (ja disponivel via `useMentorados`)
- O painel fica flutuando sobre o conteudo do roteiro

---

### Fluxo do Usuario

1. Usuario esta editando roteiros de um mentorado
2. Ve um botao redondo com icone de livro no canto inferior direito
3. Clica no botao -> painel de notas abre flutuando
4. Escreve anotacoes livremente (auto-save)
5. Pode arrastar o painel para qualquer posicao
6. Pode redimensionar o painel
7. Na sidebar esquerda do painel, ve outros mentorados e pode clicar para ver/editar notas deles
8. Pode copiar texto das notas e colar no roteiro
9. Clica X -> painel minimiza, botao redondo volta a aparecer

