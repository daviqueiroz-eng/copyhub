

## Plano: Adicionar Informações aos Tipos de Roteiro

### Objetivo

Permitir que você clique em cada tipo de roteiro e adicione informações detalhadas que serão usadas no disparo para o n8n.

---

### O que Será Implementado

Quando você clicar em um tipo de roteiro (como "Lista útil"), vai abrir um formulário onde pode adicionar:

1. **Prompt/Instruções** - O prompt que será enviado para a IA gerar o roteiro
2. **Template de estrutura** - Modelo de estrutura padrão para esse tipo
3. **Configurações extras** (opcional) - Parâmetros adicionais para o n8n

---

### Visual Final

```
┌─────────────────────────────────────────────────────────────────┐
│ Gerar Roteiro                                               [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 1 headline selecionada                                      │
│                                                                 │
│  Selecione o tipo de roteiro:                                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ◉  Lista útil                        [⚙️] [🗑️]          │  │ ← Botão config
│  │ ○  Defesa de crença                  [⚙️] [🗑️]          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [+ Novo tipo]                                                  │
│                                                                 │
│                               [Cancelar]  [Gerar]               │
└─────────────────────────────────────────────────────────────────┘
               ↓ Clica em ⚙️
┌─────────────────────────────────────────────────────────────────┐
│ Configurar: Lista útil                                      [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Prompt / Instruções para IA:                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Você é um especialista em criar roteiros de vídeo curto.  │  │
│  │ Crie um roteiro no formato "lista útil" com:              │  │
│  │ - Gancho forte no início                                  │  │
│  │ - 3 a 5 itens da lista                                    │  │
│  │ - CTA no final                                            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Template de Estrutura (opcional):                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ GANCHO:                                                   │  │
│  │ ITEM 1:                                                   │  │
│  │ ITEM 2:                                                   │  │
│  │ ITEM 3:                                                   │  │
│  │ CTA:                                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                               [Cancelar]  [Salvar]              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Parte 1: Atualizar Tabela no Banco de Dados

Adicionar novos campos na tabela `tipos_roteiro`:

```sql
ALTER TABLE public.tipos_roteiro 
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS template_estrutura TEXT,
ADD COLUMN IF NOT EXISTS config_extra JSONB DEFAULT '{}';
```

| Campo | Descrição |
|-------|-----------|
| `prompt` | Instruções para a IA gerar o roteiro |
| `template_estrutura` | Template de estrutura padrão |
| `config_extra` | Configurações adicionais em JSON (para n8n) |

---

### Parte 2: Atualizar Hook useTiposRoteiro

Adicionar mutation para atualizar tipo:

```tsx
export const useUpdateTipoRoteiro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      id: string; 
      nome?: string;
      prompt?: string;
      template_estrutura?: string;
      config_extra?: Record<string, unknown>;
    }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("tipos_roteiro")
        .update(updates)
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

### Parte 3: Criar Dialog de Configuração

Novo componente `TipoRoteiroConfigDialog.tsx`:

```tsx
interface TipoRoteiroConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoRoteiro | null;
}

export const TipoRoteiroConfigDialog = ({
  open,
  onOpenChange,
  tipo,
}: TipoRoteiroConfigDialogProps) => {
  const [prompt, setPrompt] = useState(tipo?.prompt || "");
  const [template, setTemplate] = useState(tipo?.template_estrutura || "");
  
  const updateTipo = useUpdateTipoRoteiro();

  const handleSave = () => {
    if (!tipo) return;
    updateTipo.mutate({
      id: tipo.id,
      prompt,
      template_estrutura: template,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar: {tipo?.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Prompt / Instruções para IA</Label>
            <Textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite as instruções que serão enviadas para a IA..."
              className="min-h-[150px]"
            />
          </div>
          
          <div>
            <Label>Template de Estrutura (opcional)</Label>
            <Textarea 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Digite o template de estrutura padrão..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### Parte 4: Atualizar TipoRoteiroDialog

Adicionar botão de configuração (engrenagem) ao lado de cada tipo:

```tsx
{tipos.map((tipo) => (
  <div key={tipo.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
    <div className="flex items-center space-x-3">
      <RadioGroupItem value={tipo.id} id={tipo.id} />
      <Label htmlFor={tipo.id} className="cursor-pointer">
        {tipo.nome}
      </Label>
      {/* Indicador se tem prompt configurado */}
      {tipo.prompt && (
        <span className="text-xs text-green-500">✓ configurado</span>
      )}
    </div>
    <div className="flex items-center gap-1">
      {/* Botão de configuração */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={(e) => {
          e.stopPropagation();
          setTipoParaConfigurar(tipo);
          setShowConfigDialog(true);
        }}
      >
        <Settings className="h-3.5 w-3.5" />
      </Button>
      {/* Botão de deletar */}
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
))}
```

---

### Parte 5: Atualizar onConfirm

Passar as informações completas do tipo para o n8n:

```tsx
const handleConfirm = () => {
  const tipoSelecionado = tipos.find((t) => t.id === selectedTipo);
  if (tipoSelecionado) {
    onConfirm(selectedTipo, tipoSelecionado.nome, {
      prompt: tipoSelecionado.prompt,
      template_estrutura: tipoSelecionado.template_estrutura,
      config_extra: tipoSelecionado.config_extra,
    });
  }
};
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Adicionar campos `prompt`, `template_estrutura`, `config_extra` |
| `src/hooks/useTiposRoteiro.ts` | Adicionar `useUpdateTipoRoteiro` |
| `src/components/mentorados/TipoRoteiroConfigDialog.tsx` | Criar dialog de configuração |
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Adicionar botão de engrenagem e integrar config dialog |

---

### Dados Enviados ao n8n

Quando você clicar em "Gerar", o sistema vai montar um payload assim:

```json
{
  "tipo": {
    "id": "uuid-do-tipo",
    "nome": "Lista útil",
    "prompt": "Você é um especialista em criar roteiros...",
    "template_estrutura": "GANCHO:\nITEM 1:\n..."
  },
  "headlines": [
    {
      "key": "1-1",
      "headline": "Texto da headline selecionada",
      "estrutura": "Estrutura se houver"
    }
  ]
}
```

---

### Comportamento Final

1. **Criar tipo**: Adiciona apenas o nome
2. **Configurar tipo**: Clica na engrenagem → adiciona prompt e template
3. **Selecionar tipo**: Escolhe o tipo para gerar
4. **Gerar**: Envia todas as informações (tipo + configurações + headlines) para o n8n

