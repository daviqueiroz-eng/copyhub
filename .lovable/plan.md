

## Plano: Alterar Aba "Comunicação"

### O Que Será Feito

Remover os 3 campos atuais da aba "Comunicação" e substituir por 2 novos campos:

| Remover | Adicionar |
|---------|-----------|
| Estilo de Comunicação | **Informações do mentorado** |
| Roteiros e Headlines que Performaram | **Apresentação** |
| Observações do Estrategista | - |

---

### Visual Final

```
┌─────────────────────────────────────────────────────────────────┐
│  [Avatar]  [Comunicação]  [Materiais]  [Roteiros]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Informações do mentorado                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │ Informações gerais sobre o mentorado...                   │  │
│  │                                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Apresentação                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │ Apresentação do mentorado...                              │  │
│  │                                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                        [ Fechar ]                               │
│                   [ Excluir Mentorado ]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### Mudanças Técnicas

#### 1. Atualizar Banco de Dados

Adicionar 2 novos campos na tabela `mentorados`:

```sql
ALTER TABLE public.mentorados 
ADD COLUMN IF NOT EXISTS informacoes_mentorado TEXT,
ADD COLUMN IF NOT EXISTS apresentacao TEXT;
```

---

#### 2. Atualizar Hook useMentorados

Adicionar os novos campos no tipo `Mentorado`:

```tsx
export type Mentorado = {
  // ... campos existentes
  informacoes_mentorado: string | null;  // NOVO
  apresentacao: string | null;           // NOVO
};
```

---

#### 3. Atualizar Mentorados.tsx

Substituir o conteúdo da `TabsContent value="comunicacao"`:

```tsx
<TabsContent value="comunicacao" className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="informacoes">Informações do mentorado</Label>
    <Textarea
      id="informacoes"
      value={selectedMentorado?.informacoes_mentorado || ""}
      onChange={(e) => handleUpdateMentorado("informacoes_mentorado", e.target.value)}
      placeholder="Informações gerais sobre o mentorado..."
      rows={4}
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="apresentacao">Apresentação</Label>
    <Textarea
      id="apresentacao"
      value={selectedMentorado?.apresentacao || ""}
      onChange={(e) => handleUpdateMentorado("apresentacao", e.target.value)}
      placeholder="Apresentação do mentorado..."
      rows={4}
    />
  </div>
</TabsContent>
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Adicionar campos `informacoes_mentorado` e `apresentacao` |
| `src/hooks/useMentorados.ts` | Adicionar novos campos no tipo |
| `src/pages/Mentorados.tsx` | Substituir campos da aba Comunicação |

---

### Dados Preservados

Os campos antigos (`estilo_comum`, `roteiros`, `observacoes`) continuarão existindo no banco de dados caso você precise recuperar os dados depois. Apenas a interface será alterada.

