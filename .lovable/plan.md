

## Plano: Select de Tipo ao Lado da Headline + Cópia com Estrutura do Tipo

### Resumo

Adicionar um **select de tipo de roteiro** ao lado do label "HEADLINE 01:" para que o usuário possa selecionar o tipo diretamente. Quando clicar no botão de cópia (abaixo do teleprompter), o sistema copia usando o `template_estrutura` do tipo selecionado.

### Fluxo

```text
1. Usuário escreve a headline
2. Ao lado de "HEADLINE 01:", seleciona o tipo (ex: "Curiosidade", "Story")
3. Sistema salva automaticamente o tipo_roteiro_id
4. Quando clica no ícone de cópia simplificada → copia com template_estrutura do tipo
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `migration` | Criar | Adicionar coluna `tipo_roteiro_id` em `mentorados_roteiros` |
| `src/hooks/useMentoradosRoteiros.ts` | Modificar | Incluir `tipo_roteiro_id` no tipo e na mutação de upsert |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Modificar | Adicionar select de tipo, estado local, função de cópia atualizada |

---

### 1. Migração do Banco de Dados

```sql
ALTER TABLE mentorados_roteiros 
ADD COLUMN tipo_roteiro_id uuid REFERENCES tipos_roteiro(id) ON DELETE SET NULL;
```

---

### 2. Atualizar Hook useMentoradosRoteiros

**Tipo atualizado:**
```typescript
export type MentoradoRoteiro = {
  id: string;
  mentorado_id: string;
  user_id: string;
  guia_numero: number;
  ordem: number;
  headline: string;
  estrutura: string;
  tipo_roteiro_id: string | null;  // NOVO
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

**Mutação atualizada (incluir `tipo_roteiro_id` no upsert):**
```typescript
mutationFn: async ({
  mentoradoId,
  guiaNumero,
  ordem,
  headline,
  estrutura,
  tipoRoteiroId,  // NOVO - opcional
}: {
  mentoradoId: string;
  guiaNumero: number;
  ordem: number;
  headline: string;
  estrutura: string;
  tipoRoteiroId?: string | null;  // NOVO
}) => {
  // ... incluir tipo_roteiro_id no objeto de upsert
}
```

---

### 3. Modificações no MentoradoRoteirosView

#### 3.1 - Atualizar RoteiroLocal

```typescript
type RoteiroLocal = {
  headline: string;
  estrutura: string;
  tipo_roteiro_id?: string | null;  // NOVO
};
```

#### 3.2 - Importar useTiposRoteiro

```typescript
import { useTiposRoteiro } from "@/hooks/useTiposRoteiro";
```

#### 3.3 - Usar o hook

```typescript
const { data: tiposRoteiro = [] } = useTiposRoteiro();
```

#### 3.4 - Adicionar Select ao Lado da Headline

Modificar a área onde aparece "HEADLINE 01:" (linhas ~2416-2432):

**De:**
```tsx
<div className="flex items-center gap-3">
  <Checkbox ... />
  <span className="font-poppins font-bold text-[#B8860B] text-base">
    HEADLINE {String(ordem).padStart(2, "0")}:
  </span>
</div>
```

**Para:**
```tsx
<div className="flex items-center gap-3 flex-wrap">
  <Checkbox ... />
  <span className="font-poppins font-bold text-[#B8860B] text-base">
    HEADLINE {String(ordem).padStart(2, "0")}:
  </span>
  {/* Select de tipo de estrutura */}
  <Select
    value={roteiro.tipo_roteiro_id || ""}
    onValueChange={(value) => {
      handleTipoRoteiroChange(guiaAtiva, ordem, value || null);
    }}
  >
    <SelectTrigger className="h-6 text-xs w-auto min-w-[120px] border-dashed">
      <SelectValue placeholder="Tipo..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">Nenhum</SelectItem>
      {tiposRoteiro.map(tipo => (
        <SelectItem key={tipo.id} value={tipo.id}>
          {tipo.nome}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

#### 3.5 - Função para Alterar o Tipo

```typescript
const handleTipoRoteiroChange = useCallback((guiaNumero: number, ordem: number, tipoId: string | null) => {
  const key = `${guiaNumero}-${ordem}`;
  
  setRoteirosLocais(prev => {
    const newMap = new Map(prev);
    const existing = newMap.get(key) || { headline: "", estrutura: "" };
    newMap.set(key, { ...existing, tipo_roteiro_id: tipoId });
    return newMap;
  });
  
  // Agendar salvamento
  const existingRoteiro = roteirosLocais.get(key);
  if (existingRoteiro) {
    pendingSavesRef.current.add(key);
    scheduleFlush();
  }
}, [roteirosLocais, scheduleFlush]);
```

#### 3.6 - Atualizar Função de Cópia Simplificada

```typescript
const handleCopyRoteiroSimplificado = async (guiaNumero: number, ordem: number) => {
  const key = `${guiaNumero}-${ordem}`;
  const roteiro = roteirosLocais.get(key);
  
  // Buscar o tipo de roteiro selecionado
  const tipoRoteiroId = roteiro?.tipo_roteiro_id;
  const tipo = tiposRoteiro.find(t => t.id === tipoRoteiroId);
  
  if (!tipo?.template_estrutura) {
    toast({
      title: "Tipo não selecionado",
      description: "Selecione um tipo de estrutura ao lado da headline.",
    });
    return;
  }

  const plainText = `headline: ${roteiro?.headline || ''}\n\nEstrutura:\n${tipo.template_estrutura}`;

  try {
    await navigator.clipboard.writeText(plainText);
    toast({
      title: "Copiado!",
      description: "Headline e estrutura do tipo copiadas.",
    });
  } catch {
    toast({
      title: "Erro",
      description: "Não foi possível copiar.",
      variant: "destructive",
    });
  }
};
```

#### 3.7 - Condição do Botão de Cópia

Mudar a condição para mostrar o botão quando houver **tipo selecionado**:

**De:**
```tsx
{roteiro.estrutura?.trim() && (
```

**Para:**
```tsx
{roteiro.tipo_roteiro_id && (
```

---

### 4. Atualizar Inicialização dos Roteiros Locais

Ao carregar os roteiros do banco, incluir o `tipo_roteiro_id`:

```typescript
// Onde carrega roteirosLocais a partir de mentoradosRoteiros
newMap.set(key, { 
  headline: r.headline, 
  estrutura: r.estrutura,
  tipo_roteiro_id: r.tipo_roteiro_id  // NOVO
});
```

---

### 5. Atualizar Flush de Salvamento

Incluir `tipo_roteiro_id` ao salvar:

```typescript
await upsertRoteiro.mutateAsync({
  mentoradoId,
  guiaNumero,
  ordem,
  headline: roteiro.headline,
  estrutura: roteiro.estrutura,
  tipoRoteiroId: roteiro.tipo_roteiro_id,  // NOVO
});
```

---

### Interface Visual Final

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ☑  HEADLINE 01:  [Curiosidade ▼]                                   │
│    faça essas 3 coisas se quiser...                                │
│                                                                     │
│    ESTRUTURA 01:                                                    │
│    E o que poucos sabem...                                         │
│                                                    [📋][🗑️][📹][📄] │
└─────────────────────────────────────────────────────────────────────┘
```

- O botão 📄 (ClipboardCopy) só aparece quando há tipo selecionado
- Ao clicar, copia usando o `template_estrutura` do tipo

---

### Formato da Cópia

**Entrada:**
- Headline: "3 livros que você precisa ler"
- Tipo selecionado: "Curiosidade" (template: "E o que poucos sabem é que...")

**Saída:**
```
headline: 3 livros que você precisa ler

Estrutura:
E o que poucos sabem é que...
```

