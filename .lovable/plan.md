

## Plano: Checkboxes nas Headlines + Seleção de Tipo de Roteiro

### Visão Geral

Implementar um sistema onde você pode:
1. **Selecionar headlines** usando checkboxes
2. Ver um **botão "Gerar roteiro"** quando houver seleção
3. Escolher o **tipo de roteiro** em um dialog
4. **Cadastrar seus próprios tipos** de roteiro

---

### Parte 1: Nova Tabela no Banco de Dados

Criar tabela `tipos_roteiro` para que você cadastre seus tipos:

```sql
CREATE TABLE public.tipos_roteiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para cada usuário ver apenas seus tipos
ALTER TABLE public.tipos_roteiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus tipos" ON public.tipos_roteiro
  FOR ALL USING (auth.uid() = user_id);
```

---

### Parte 2: Hook para Tipos de Roteiro

Criar `src/hooks/useTiposRoteiro.ts`:

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTiposRoteiro = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["tipos-roteiro", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_roteiro")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateTipoRoteiro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string }) => {
      const { error } = await supabase
        .from("tipos_roteiro")
        .insert({ ...data, user_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-roteiro"] });
    },
  });
};

export const useDeleteTipoRoteiro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_roteiro")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-roteiro"] });
    },
  });
};
```

---

### Parte 3: Atualizar MentoradoHeadlinesList

Adicionar checkboxes e passar seleção para o componente pai:

**Props atualizadas:**
```tsx
interface MentoradoHeadlinesListProps {
  mentoradoId: string;
  selectedHeadlines: string[];  // IDs selecionados
  onSelectionChange: (ids: string[]) => void;  // Callback
}
```

**Renderização com checkbox:**
```tsx
<div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
  <Checkbox
    checked={selectedHeadlines.includes(headline.id)}
    onCheckedChange={(checked) => {
      if (checked) {
        onSelectionChange([...selectedHeadlines, headline.id]);
      } else {
        onSelectionChange(selectedHeadlines.filter(id => id !== headline.id));
      }
    }}
    className="mt-0.5"
  />
  <div className="flex-1">
    <p className="text-sm pr-12 leading-snug">{headline.headline}</p>
    {/* ... resto */}
  </div>
</div>
```

---

### Parte 4: Dialog de Tipo de Roteiro

Criar `src/components/mentorados/TipoRoteiroDialog.tsx`:

```text
┌─────────────────────────────────────────────┐
│ Gerar Roteiro                           [X] │
├─────────────────────────────────────────────┤
│                                             │
│  📝 3 headlines selecionadas                │
│                                             │
│  Selecione o tipo de roteiro:               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ○  Roteiro de Reels                 │    │
│  │ ○  Roteiro Completo                 │    │
│  │ ○  Roteiro Educacional              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Gerenciar tipos:                           │
│  [+ Novo tipo]                              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Roteiro de Reels              [🗑️] │    │
│  │ Roteiro Completo              [🗑️] │    │
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│               [Cancelar]  [Gerar]           │
└─────────────────────────────────────────────┘
```

**Componente:**
```tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useTiposRoteiro, useCreateTipoRoteiro, useDeleteTipoRoteiro } from "@/hooks/useTiposRoteiro";

interface TipoRoteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headlinesCount: number;
  onConfirm: (tipoId: string) => void;
}

export const TipoRoteiroDialog = ({
  open,
  onOpenChange,
  headlinesCount,
  onConfirm,
}: TipoRoteiroDialogProps) => {
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [novoTipo, setNovoTipo] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { data: tipos = [] } = useTiposRoteiro();
  const createTipo = useCreateTipoRoteiro();
  const deleteTipo = useDeleteTipoRoteiro();

  const handleAddTipo = () => {
    if (!novoTipo.trim()) return;
    createTipo.mutate({ nome: novoTipo.trim() });
    setNovoTipo("");
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Roteiro</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            📝 {headlinesCount} headline{headlinesCount > 1 ? "s" : ""} selecionada{headlinesCount > 1 ? "s" : ""}
          </p>

          {tipos.length > 0 ? (
            <>
              <Label>Selecione o tipo de roteiro:</Label>
              <RadioGroup value={selectedTipo} onValueChange={setSelectedTipo}>
                {tipos.map((tipo) => (
                  <div key={tipo.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={tipo.id} id={tipo.id} />
                      <Label htmlFor={tipo.id}>{tipo.nome}</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteTipo.mutate(tipo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum tipo cadastrado. Adicione um tipo abaixo.
            </p>
          )}

          <div className="border-t pt-4">
            {showAddForm ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do tipo..."
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
                />
                <Button size="sm" onClick={handleAddTipo}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo tipo
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onConfirm(selectedTipo)}
            disabled={!selectedTipo}
          >
            Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### Parte 5: Integração no MentoradoRoteirosView

Adicionar estado e botão flutuante:

```tsx
// Estados
const [selectedHeadlineIds, setSelectedHeadlineIds] = useState<string[]>([]);
const [showTipoRoteiroDialog, setShowTipoRoteiroDialog] = useState(false);

// Na área de "Ideias de Headlines":
<MentoradoHeadlinesList 
  mentoradoId={mentoradoId}
  selectedHeadlines={selectedHeadlineIds}
  onSelectionChange={setSelectedHeadlineIds}
/>

{/* Botão flutuante quando há seleção */}
{selectedHeadlineIds.length > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
    <Button 
      className="gap-2 shadow-lg"
      onClick={() => setShowTipoRoteiroDialog(true)}
    >
      <FileEdit className="h-4 w-4" />
      Gerar roteiro ({selectedHeadlineIds.length})
    </Button>
  </div>
)}

{/* Dialog de tipo */}
<TipoRoteiroDialog
  open={showTipoRoteiroDialog}
  onOpenChange={setShowTipoRoteiroDialog}
  headlinesCount={selectedHeadlineIds.length}
  onConfirm={(tipoId) => {
    // Aqui você pode usar o tipoId para gerar o roteiro
    console.log("Gerar roteiro do tipo:", tipoId, "para:", selectedHeadlineIds);
    setShowTipoRoteiroDialog(false);
    setSelectedHeadlineIds([]);
  }}
/>
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Criar tabela `tipos_roteiro` |
| `src/hooks/useTiposRoteiro.ts` | Criar hook CRUD |
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Criar dialog de seleção |
| `src/components/mentorados/MentoradoHeadlinesList.tsx` | Adicionar checkboxes |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Integrar seleção e botão |

---

### Fluxo Visual

```text
┌─────────────────────────────────────────────────────┐
│ Ideias de Headlines (5)                             │
├─────────────────────────────────────────────────────┤
│ ☐ Headline 1...                        [📋] [🗑️]  │
│ ☑ Headline 2...                        [📋] [🗑️]  │
│ ☑ Headline 3...                        [📋] [🗑️]  │
│ ☐ Headline 4...                        [📋] [🗑️]  │
│ ☐ Headline 5...                        [📋] [🗑️]  │
└─────────────────────────────────────────────────────┘

        ┌─────────────────────────────────┐
        │ 📝 Gerar roteiro (2)            │  ← Botão flutuante
        └─────────────────────────────────┘
              ↓ ao clicar
┌─────────────────────────────────────────────────────┐
│ Gerar Roteiro                                   [X] │
├─────────────────────────────────────────────────────┤
│ 📝 2 headlines selecionadas                         │
│                                                     │
│ Selecione o tipo:                                   │
│ ○ Roteiro de Reels                           [🗑️] │
│ ● Roteiro Completo                           [🗑️] │
│ ○ Roteiro Educacional                        [🗑️] │
│                                                     │
│ [+ Novo tipo]                                       │
│                                                     │
│                         [Cancelar]  [Gerar]         │
└─────────────────────────────────────────────────────┘
```

---

### Detalhes Técnicos

#### Migração SQL Completa

```sql
-- Tabela de tipos de roteiro
CREATE TABLE IF NOT EXISTS public.tipos_roteiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_roteiro ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê/gerencia apenas seus tipos
CREATE POLICY "Users can manage their own tipos_roteiro"
  ON public.tipos_roteiro
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Hook useTiposRoteiro.ts

O hook terá:
- `useTiposRoteiro()` - listar tipos
- `useCreateTipoRoteiro()` - criar novo tipo
- `useDeleteTipoRoteiro()` - deletar tipo

#### MentoradoHeadlinesList.tsx

Mudanças principais:
1. Adicionar props `selectedHeadlines` e `onSelectionChange`
2. Importar e usar componente `Checkbox`
3. Renderizar checkbox ao lado de cada headline
4. Chamar callback quando seleção muda

#### TipoRoteiroDialog.tsx

Componente novo com:
- RadioGroup para selecionar tipo
- Input para adicionar novo tipo
- Botões de deletar tipos existentes
- Confirmação para gerar roteiro

