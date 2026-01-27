

## Plano: Configurar Tipos de Chat para o Chat de Revisao

### Visao Geral

Criar um sistema de tipos configuráveis para o "Chat de Revisao", similar ao que já existe para o "Ajuste Fino". O usuário poderá escolher diferentes estilos/comportamentos para o assistente de revisão, cada um com seu próprio prompt de sistema.

---

### Layout Proposto (Input do Chat)

```text
+--------------------------------------------------+
|  [Mensagens do chat...]                          |
+--------------------------------------------------+
| +------------------------------------------+     |
| | Digite sua instrução...                  |     |
| +------------------------------------------+     |
|                                                  |
| [+]               [Tipo de Chat v] [>]           |
|                                                  |
+--------------------------------------------------+
```

O botão "Tipo de Chat" abrirá um dropdown/popover para:
- Selecionar um tipo existente
- Gerenciar tipos (adicionar, editar, excluir)

---

### Estrutura do Banco de Dados

Nova tabela `tipos_chat_revisao`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nome | text | Nome do tipo (ex: "Padrão", "Objetivo", "Criativo") |
| descricao | text | Descrição curta do comportamento |
| prompt_sistema | text | Prompt de sistema para a IA |
| user_id | uuid | Referência ao usuário |
| created_at | timestamp | Data de criação |

---

### Tipos Padrão Sugeridos

1. **Padrão** - Comportamento atual (faz apenas o que é pedido)
2. **Objetivo** - Foco em clareza e concisão
3. **Criativo** - Sugere melhorias e variações
4. **Correção** - Foca em gramática e ortografia

---

### Arquivos a Criar/Modificar

| Arquivo | Mudanças |
|---------|----------|
| **Migração SQL** | Criar tabela `tipos_chat_revisao` com RLS |
| `src/hooks/useTiposChatRevisao.ts` | Hook para CRUD dos tipos de chat |
| `src/components/mentorados/TiposChatDialog.tsx` | Dialog para gerenciar tipos (similar a TiposAjusteDialog) |
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Adicionar seletor de tipo no input do chat |
| `supabase/functions/revisar-roteiro/index.ts` | Receber e usar o prompt do tipo selecionado |

---

### Detalhes Técnicos

#### 1. Migração SQL

```sql
CREATE TABLE public.tipos_chat_revisao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  prompt_sistema text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.tipos_chat_revisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus tipos de chat"
  ON public.tipos_chat_revisao FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar tipos de chat"
  ON public.tipos_chat_revisao FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ... demais políticas
```

#### 2. Hook useTiposChatRevisao

```typescript
export interface TipoChatRevisao {
  id: string;
  nome: string;
  descricao: string | null;
  prompt_sistema: string | null;
  user_id: string;
  created_at: string;
}

export const useTiposChatRevisao = () => {
  // Similar ao useTiposAjuste
  // Query para buscar tipos do usuário
};
```

#### 3. Seletor no Chat de Revisão

```tsx
// Estado para tipo selecionado
const [selectedTipoChat, setSelectedTipoChat] = useState<string | null>(null);

// No input area, adicionar botão com popover
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="sm">
      {tipoAtivo?.nome || "Padrão"}
      <ChevronDown className="h-4 w-4 ml-1" />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    {tiposChatRevisao.map(tipo => (
      <button onClick={() => setSelectedTipoChat(tipo.id)}>
        {tipo.nome}
      </button>
    ))}
    <Separator />
    <button onClick={() => setShowTiposChatDialog(true)}>
      Gerenciar
    </button>
  </PopoverContent>
</Popover>
```

#### 4. Edge Function - Receber Prompt Customizado

```typescript
// revisar-roteiro/index.ts
const { headline, estrutura, mensagem, historico, selecao, promptSistema } = await req.json();

// Usar prompt customizado ou padrão
const systemPrompt = promptSistema || SYSTEM_PROMPT_PADRAO;

const messages = [
  { role: "system", content: systemPrompt },
  // ... resto
];
```

---

### Fluxo de Uso

1. Usuário abre Chat de Revisão
2. Por padrão, usa o tipo "Padrão" (prompt atual)
3. Pode clicar no seletor de tipo para:
   - Escolher outro tipo cadastrado
   - Acessar "Gerenciar" para criar/editar tipos
4. Ao enviar mensagem, o prompt do tipo selecionado é enviado para a edge function
5. A IA responde de acordo com o comportamento configurado

---

### Considerações

- O tipo selecionado é mantido por sessão (não persistido)
- Criar tipo "Padrão" ao primeiro uso se não houver nenhum
- Permitir editar o prompt de sistema de cada tipo
- O botão "+" (ajustes rápidos) pode ser mantido separado do seletor de tipo

